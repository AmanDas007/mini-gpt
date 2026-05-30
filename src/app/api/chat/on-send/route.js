import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import { groq } from "@/lib/groq";
import { redis } from "@/lib/redis";
import { countTokens } from "@/lib/tokenizer";
import { pineconeIndex } from "@/lib/pinecone";
import { createEmbedding } from "@/lib/huggingface";
import { getServerSession } from "next-auth";
import { authOptions } from "@/components/auth";
import {
  MODEL_CONTEXT_LIMIT,
  MAX_WINDOW_TOKENS,
  SUMMARIZATION_LIMIT,
  RUNNING_SUMMARY_MAX,
  SESSION_DAILY_LIMIT
} from "@/lib/limits";

import Message from "@/models/Message";
import ChatSession from "@/models/ChatSession";
import GlobalMemory from "@/models/GlobalMemory";
import User from "@/models/User";
import Document from "@/models/Document";


export async function POST(req) {

  const serverSession = await getServerSession(authOptions);
  if (!serverSession || !serverSession.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = serverSession.user.id;

  const { message } = await req.json();

  // ==========================================
  // REDIS RATE LIMITING
  // ==========================================
  
  const rateLimitKey = `${process.env.REDIS_NAMESPACE}:rate_limit:chat:${userId}`;
  try {
    const requests = await redis.incr(rateLimitKey);
    if (requests === 1) {
      await redis.expire(rateLimitKey, 60); 
    }
    if (requests > 10) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please wait a minute." },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error("Redis Rate Limit Error:", error);
  }
  
  await connectDB();

  const user = await User.findById(userId);
  let session = await ChatSession.findOne({ userId });

  if (!session) {
    session = await ChatSession.create({ userId });
  }

  // ==========================================
  // DAILY LIMIT CHECK
  // ==========================================

  if (session.totalSessionTokensPerDay > SESSION_DAILY_LIMIT) {
    if (!session.mediaResetAt) {
      session.mediaResetAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await session.save();
    }
    if (Date.now() < session.mediaResetAt) {
      return NextResponse.json(
        { message: "Daily limit reached" },
        { status: 403 }
      );
    }
    session.totalSessionTokensPerDay = 0;
    session.mediaResetAt = null;
  }

  const userTokens = countTokens(message);

  await Message.create({
    sessionId: session._id,
    role: "user",
    content: message,
    tokenCount: userTokens
  });

  session.totalSessionTokensPerDay += userTokens;
  user.totalTokenUsage += userTokens;

  await session.save();
  await user.save();

  // ==========================================
  // CHAT HISTORY & SLIDING WINDOW CONTEXT
  // ==========================================

  const messages = await Message.find({ sessionId: session._id }).sort({ createdAt: -1 }); // newest to old

  let windowMessages = [];
  let windowTokenSum = 0;
  let outsideMessages = [];

  for (let msg of messages) {
    if (windowTokenSum + msg.tokenCount <= MAX_WINDOW_TOKENS) {
      windowMessages.unshift(msg);
      windowTokenSum += msg.tokenCount;
    } else {
      outsideMessages.push(msg);
    }
  }

  // ==========================================
  // RUNNING SUMMARY LOGIC
  // ==========================================

  const unsummarized = outsideMessages.filter(m => !m.isSummarized);
  const outsideTokenSum = unsummarized.reduce((s, m) => s + m.tokenCount, 0);
  const totalUnsummarized = session.runningSummaryTokens + outsideTokenSum;

  if (totalUnsummarized > SUMMARIZATION_LIMIT && unsummarized.length) {
    const TOKEN_LIMIT = RUNNING_SUMMARY_MAX;
    const condensationSystemPrompt = `
      You are a precision memory condensation module. 
      Your task: Merge "New Messages" into the "Existing Summary" to create a single, dense update.
      CONSTRAINTS:
      - TOKEN BUDGET: Stay strictly under ${TOKEN_LIMIT} tokens.
      - FACTUAL INTEGRITY: Do not hallucinate. Include only specific facts, names, or technical details mentioned.
      - PERSPECTIVE: Summarize in the third person.
      - FORMAT: Output ONLY the plain text summary. No conversational filler.
    `.trim();
  
    const input = `
      [EXISTING SUMMARY]
      ${session.runningSummary || "None."}
      [NEW MESSAGES TO INTEGRATE]
      ${unsummarized.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n")}
      [TASK]
      Create the updated summary now.
    `.trim();
  
    try {
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: condensationSystemPrompt },
          { role: "user", content: input }
        ],
        temperature: 0,
        max_tokens: TOKEN_LIMIT,
      });
  
      const summary = res.choices[0].message.content.trim();
      const currentTokens = countTokens(summary);

      session.runningSummary = summary;
      session.runningSummaryTokens = currentTokens;

      await Message.updateMany(
        { _id: { $in: unsummarized.map(m => m._id) } },
        { $set: { isSummarized: true } }
      );
  
      await session.save();
    } catch (error) {
      console.error("Summarization failed:", error);
    }
  }

  // ==========================================
  // NEW: VECTOR DATABASE RETRIEVAL (RAG)
  // ==========================================

  let ragContext = "";
  let ragTokens = 0;

  try {
    // 1. Fetch user documents to identify active namespaces
    const userDocs = await Document.find({ userId });

    if (userDocs.length > 0) {
      const queryEmbedding = await createEmbedding(message);

      // 2. Query all document namespaces in parallel
      const pineconeQueries = userDocs.map(async (doc) => {
        try {
          const res = await pineconeIndex.namespace(doc.pineconeNamespace).query({
            vector: queryEmbedding,
            topK: 2, // Grab the best 2 chunks from each file
            includeMetadata: true,
          });
          return res.matches || [];
        } catch (err) {
          console.error(`Pinecone query failed for namespace ${doc.pineconeNamespace}:`, err);
          return [];
        }
      });

      const queryResults = await Promise.all(pineconeQueries);

      // 3. Flatten, rank by similarity score, and isolate the top 4 structural chunks overall
      const topMatches = queryResults
        .flat()
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      if (topMatches.length > 0) {
        // 4. Construct context segments complete with file source attributes for citation
        ragContext = topMatches
          .map((match) => `[SOURCE FILE: ${match.metadata?.fileName || "Unknown"} | PAGE: ${match.metadata?.pageNumber || "Unknown"}]\nContext Content: ${match.metadata?.text}`)
          .join("\n\n---\n\n");

        ragTokens = countTokens(ragContext);
      }
    }
  } catch (vectorError) {
    console.error("RAG Pipeline processing failed:", vectorError);
  }

  // ==========================================
  // CONTEXT WINDOW MANAGEMENT
  // ==========================================

  const global = await GlobalMemory.findOne({ userId });

  // Update System Instructions to strictly dictate dynamic inline citations
  const systemPrompt = `
  You are a highly analytical and truthful AI assistant.
  If unsure about an answer, state "I don't know" clearly. Do not make up facts.
  
  INLINE CITATION PROTOCOL:
  - When using information from the [RETRIEVED DOCUMENT CONTEXT] block below, you MUST cite the file name and page number exactly as provided in its source tag using an inline format at the end of the sentence. 
  - Example format: "The project requires Next.js [spec_sheet.pdf, Page 4]."
  - Only apply a file citation if your information explicitly references that source material. 
  - If the response builds entirely from general knowledge or conversation history, omit all file citations entirely.
  `.trim();

  let requestTokens =
    countTokens(systemPrompt) +
    (global?.summaryTokens || 0) +
    session.runningSummaryTokens +
    windowTokenSum +
    ragTokens; // Include RAG chunks into total calculation

  // Trim conversation sliding window if the aggregate context breaks boundaries
  while (requestTokens > MODEL_CONTEXT_LIMIT && windowMessages.length > 1) {
    const removed = windowMessages.shift();
    requestTokens -= removed.tokenCount;
  }

  const llmMessages = [
    { role: "system", content: systemPrompt }
  ];

  let memoryContext = "";
  if (global?.summary) memoryContext += `[USER DATA]: ${global.summary}\n`;
  if (session.runningSummary) memoryContext += `[CONVERSATION SO FAR]: ${session.runningSummary}\n`;
  
  // Inject the RAG context safely inside the system-level memory interface
  if (ragContext) memoryContext += `[RETRIEVED DOCUMENT CONTEXT]:\n${ragContext}\n`;

  if (memoryContext) {
    llmMessages.push({
      role: "system",
      content: `Use the following context to stay consistent with the user and past interactions:\n${memoryContext}`
    });
  }

  windowMessages.forEach(m =>
    llmMessages.push({ role: m.role, content: m.content })
  );

  // ==========================================
  // GROQ INFERENCE STREAM
  // ==========================================

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    stream: true,
    messages: llmMessages,
    temperature: 0.7 
  });

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        let full = "";

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              full += content;
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          console.error("Groq streaming error:", error);
        } finally {
          controller.close();
        }

        const finalizeChat = async () => {
          const assistantTokens = countTokens(full);

          await Message.create({
            sessionId: session._id,
            role: "assistant",
            content: full,
            tokenCount: assistantTokens,
          });

          session.totalSessionTokensPerDay += assistantTokens;
          user.totalTokenUsage += assistantTokens;

          await session.save();
          await user.save();
        };
        finalizeChat();
      }
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } } 
  );
}