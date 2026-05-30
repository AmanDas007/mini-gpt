import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import Document from "@/models/Document";
import { getServerSession } from "next-auth";
import { authOptions } from "@/components/auth";
import cloudinary from "@/lib/cloudinary";
import { pineconeIndex } from "@/lib/pinecone";

import { createEmbedding } from "@/lib/huggingface";
import { chunkText } from "@/lib/chunking";

import pdf from "pdf-parse/lib/pdf-parse.js";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;

    // Extract pagination and search params from the URL
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5; // Adjust default limit as needed
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build the query object
    const query = { userId };
    if (search) {
      // Case-insensitive regex search on the fileName
      query.fileName = { $regex: search, $options: "i" };
    }

    // Fetch paginated documents and the total count for frontend math
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalDocuments = await Document.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);

    return NextResponse.json({ 
      documents,
      currentPage: page,
      totalPages,
      totalDocuments
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      await connectDB();
      const userId = session.user.id;
  
      const formData = await req.formData();
  
      const file = formData.get("file");
  
      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 }
        );
      }
  
      // =========================
      // FILE BUFFER
      // =========================
  
      const bytes = await file.arrayBuffer();
  
      const buffer = Buffer.from(bytes);
  
      // =========================
      // CLOUDINARY UPLOAD
      // =========================
  
      const base64 = buffer.toString("base64");
  
      const dataURI = `data:application/pdf;base64,${base64}`;
  
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        resource_type: "raw",
        folder: "pdfs",
      });
  
      // =========================
      // PDF TEXT EXTRACTION (WITH PAGE DELIMITERS)
      // =========================
  
      // Custom handler to capture page indexes during binary extraction
      const render_page = async (pageData) => {
        const textContent = await pageData.getTextContent();
        const text = textContent.items.map((item) => item.str).join(" ");
        return `<<<PAGE_${pageData.pageIndex + 1}>>>${text}`;
      };

      const pdfData = await pdf(buffer, { pagerender: render_page });
  
      const rawText = pdfData.text?.trim();

      if (!rawText) {
        return NextResponse.json(
            { error: "No readable text found in PDF" },
            { status: 400 }
        );
      }

      // Deconstruct the parsed string back into separate pages
      const pageSections = rawText.split("<<<PAGE_").filter(Boolean);
      let structuredChunks = [];

      // =========================
      // PAGINATED CHUNKING
      // =========================
  
      for (const section of pageSections) {
        const delimiterIndex = section.indexOf(">>>");
        if (delimiterIndex === -1) continue;

        const pageNum = parseInt(section.substring(0, delimiterIndex), 10);
        const pageText = section.substring(delimiterIndex + 3).trim();

        if (!pageText) continue;

        // Process chunking for each isolated page sequence
        const pageChunks = await chunkText(pageText);
        for (const chunkStr of pageChunks) {
          structuredChunks.push({
            text: chunkStr,
            pageNumber: pageNum,
          });
        }
      }

      if (!structuredChunks.length) {
        return NextResponse.json(
          { error: "Failed to create chunks" },
          { status: 400 }
        );
      }
  
      // =========================
      // CREATE EMBEDDINGS IN PARALLEL
      // =========================
  
      console.log("Starting embeddings...");
      console.log("Total chunks:", structuredChunks.length);

      const embeddings = await Promise.all(
        structuredChunks.map(async (chunkObj, index) => {
            try {
            const embedding = await createEmbedding(chunkObj.text);

            console.log(
                `Chunk ${index} embedding type:`,
                typeof embedding
            );

            console.log(
                `Chunk ${index} embedding length:`,
                embedding?.length
            );

            if (
                !embedding ||
                !Array.isArray(embedding) ||
                embedding.length === 0
            ) {
                console.log(
                `Invalid embedding at chunk ${index}`
                );
                return null;
            }

            return embedding;

            } catch (err) {
            console.error(
                `Embedding failed for chunk ${index}:`,
                err
            );
            return null;
            }
        })
      );

      console.log("Embeddings completed");
  
      // =========================
      // CREATE VECTORS WITH PAGE METADATA
      // =========================
  
      const namespace = `doc-${Date.now()}-${userId}`;
  
      const vectors = [];

      for (let i = 0; i < structuredChunks.length; i++) {
        const embedding = embeddings[i];

        console.log(
            `Checking embedding ${i}:`,
            embedding ? "VALID" : "NULL"
        );

        if (
            !embedding ||
            !Array.isArray(embedding) ||
            embedding.length === 0
        ) {
            console.log(
            `Skipping invalid embedding ${i}`
            );
            continue;
        }

        vectors.push({
            id: `${namespace}-${i}`,
            values: embedding,
            metadata: {
              text: structuredChunks[i].text,
              chunkIndex: i,
              pageNumber: structuredChunks[i].pageNumber, // Storing dynamic page citation number
              fileName: file.name,
              userId,
            },
        });
      }

      console.log("Final vectors count:", vectors.length);

      if (!vectors.length) {
          return NextResponse.json(
            { error: "No valid embeddings generated" },
            { status: 500 }
          );
        }
  
      // =========================
      // BATCH UPSERT
      // =========================
      console.log("vectors size: ", vectors.length)
  
      const BATCH_SIZE = 100;
  
      for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
        const batch = vectors.slice(i, i + BATCH_SIZE);
      
        console.log(
          `Uploading batch ${i / BATCH_SIZE + 1}`
        );
      
        console.log(
          `Batch size:`,
          batch.length
        );
      
        if (!batch.length) {
          console.log("Skipping empty batch");
          continue;
        }

        console.log("coming, coming, coming")
        console.log("batch: ", batch)
      
        await pineconeIndex.namespace(namespace).upsert({ records: batch });
      
        console.log("Batch uploaded");
      }
  
      // =========================
      // SAVE DOCUMENT
      // =========================
  
      const document = await Document.create({
        userId,
        fileName: file.name,
        fileSize: file.size,
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        pineconeNamespace: namespace,
      });
  
      return NextResponse.json({
        success: true,
        document,
      });
  
    } catch (err) {
      console.error(err);
  
      return NextResponse.json(
        { error: err.message || "Upload failed" },
        { status: 500 }
      );
    }
}

export async function DELETE(req) {
  try {

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;

    const body = await req.json();

    const { documentId } = body;

    const document = await Document.findOne({
      _id: documentId,
      userId,
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // ========= DELETE CLOUDINARY =========

    await cloudinary.uploader.destroy(
      document.cloudinaryPublicId,
      {
        resource_type: "raw",
      }
    );

    // ========= DELETE PINECONE =========

    await pineconeIndex
      .namespace(document.pineconeNamespace)
      .deleteAll();

    // ========= DELETE MONGO =========

    await Document.findByIdAndDelete(documentId);

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}