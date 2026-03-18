import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import { groq } from "@/lib/groq";
import { redis } from "@/lib/redis";
import { countTokens } from "@/lib/tokenizer";
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


export async function POST(req) {

  const { message, userId } = await req.json();

  // redis rate limiting 
  // Max 10 messages per 60 seconds.
  const rateLimitKey = `rate_limit:chat:${userId}`;
  
  try {
    const requests = await redis.incr(rateLimitKey);
    
    // If this is the first request in the window, set the expiry to 60 seconds
    if (requests === 1) {
      await redis.expire(rateLimitKey, 60); 
    }

    if (requests > 10) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please wait a minute." },
        { status: 429 } // 429: Too Many Requests
      );
    }
  } catch (error) {
    console.error("Redis Rate Limit Error:", error);
    // If Redis goes down, we shouldn't crash the whole app. We just log it and let them pass.
  }
  
  await connectDB();

  const user = await User.findById(userId);

  let session = await ChatSession.findOne({ userId });

  if (!session) {
    session = await ChatSession.create({ userId });
  }

  // daily limit check
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

  // fetch recent messages
  const messages = await Message.find({ sessionId: session._id })
    .sort({ createdAt: -1 }); //newest to old

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

  // running summary logic
  const unsummarized = outsideMessages.filter(m => !m.isSummarized);

  const outsideTokenSum = unsummarized.reduce((s, m) => s + m.tokenCount, 0);

  const totalUnsummarized = session.runningSummaryTokens + outsideTokenSum;

  // console.log(totalUnsummarized)
  // updating running summary
  if (totalUnsummarized > SUMMARIZATION_LIMIT && unsummarized.length) {
    const TOKEN_LIMIT = RUNNING_SUMMARY_MAX;
  
    // 2. Build the System Prompt (Instructional Layer)
    const systemPrompt = `
      You are a precision memory condensation module. 
      Your task: Merge "New Messages" into the "Existing Summary" to create a single, dense update.
  
      CONSTRAINTS:
      - TOKEN BUDGET: Stay strictly under ${TOKEN_LIMIT} tokens.
      - FACTUAL INTEGRITY: Do not hallucinate. Include only specific facts, names, or technical details mentioned.
      - PERSPECTIVE: Summarize in the third person (e.g., "User asked about X; Assistant explained Y").
      - FORMAT: Output ONLY the plain text summary. No conversational filler or labels.
    `.trim();
  
    // 3. Build the User Input (Data Layer)
    const input = `
      [EXISTING SUMMARY]
      ${session.runningSummary || "None."}
  
      [NEW MESSAGES TO INTEGRATE]
      ${unsummarized.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n")}
  
      [TASK]
      Create the updated summary now.
    `.trim();
  
    try {
      // 4. Call OpenAI with high precision settings
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        temperature: 0,    // 0 = Deterministic (prevents hallucinations)
        max_tokens: TOKEN_LIMIT, // Hard cap at the API level
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
      // Optional: Implement a retry logic or notification if summarization fails
    }
  }

  // global memory
  const global = await GlobalMemory.findOne({ userId });

  const systemPrompt = `
You are a truthful AI assistant.
If unsure say "I don't know".
Do not hallucinate.
`;

  let requestTokens =
    countTokens(systemPrompt) +
    (global?.summaryTokens) +
    session.runningSummaryTokens +
    windowTokenSum;

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

    if (memoryContext) {
        llmMessages.push({
            role: "system",
            content: `Use the following context to stay consistent with the user and past interactions:\n${memoryContext}`
        });
    }

    windowMessages.forEach(m =>
        llmMessages.push({ role: m.role, content: m.content })
    );

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    stream: true,
    messages: llmMessages,
    temperature: 0.7 // Higher than summary (0) to allow for natural conversation
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
            //   isSummarized: false
            });

            session.totalSessionTokensPerDay += assistantTokens;
            user.totalTokenUsage += assistantTokens;

            await session.save();
            await user.save();
        };
        finalizeChat();
      }
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } } // Standard for AI streaming
  );
}