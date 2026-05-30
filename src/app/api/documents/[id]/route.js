import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import Document from "@/models/Document";

export async function GET(req, { params }) {
  try {
    await connectDB();

    // 1. Await params for Next.js 15 compatibility
    const resolvedParams = await params;
    const id = resolvedParams.id; 

    const document = await Document.findById(id);

    if (!document) {
      // 2. Cleaner error handling with NextResponse.json
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    // 3. Fetch the raw PDF bytes from Cloudinary
    const fileRes = await fetch(document.cloudinaryUrl);
    
    if (!fileRes.ok) {
      return NextResponse.json(
        { error: "File not accessible from storage" },
        { status: 500 }
      );
    }

    const arrayBuffer = await fileRes.arrayBuffer();

    // 4. Return the file buffer using new NextResponse
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // 'inline' forces the browser to open the PDF viewer
        "Content-Disposition": `inline; filename="${document.fileName}"`, 
      },
    });

  } catch (error) {
    console.error("PDF Fetch Error:", error);
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}