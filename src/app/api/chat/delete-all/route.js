import connectDB from "@/db/connectDB";
// import { openai } from "@/lib/openai";
import { groq } from "@/lib/groq";
import { countTokens } from "@/lib/tokenizer";
import { GLOBAL_SUMMARY_LIMIT } from "@/lib/limits";
import Message from "@/models/Message";
import ChatSession from "@/models/ChatSession";
import GlobalMemory from "@/models/GlobalMemory";

export async function POST(req) {

  await connectDB();

  const { userId } = await req.json();

  const session = await ChatSession.findOne({ userId });

  const messages = await Message.find({
    sessionId: session._id,
    isSummarized:false
  });

  const global = await GlobalMemory.findOne({ userId });

  const systemPrompt = `
    You are a Personal Identity Processor. Your goal is to manage a high-density "Global Memory" of a user.

    STRICT CONSTRAINTS:
    - TOKEN LIMIT: The final output must be under ${GLOBAL_SUMMARY_LIMIT} tokens.
    - PERSISTENCE: Only store permanent facts (interests, skills, goals, preferred tech stack, name).
    - EXCLUSION: Ignore specific questions about code bugs, greetings, or temporary tasks.
    - NO HALLUCINATION: Only include information explicitly found in the "Unsummarized Messages". 
    - MERGE: Integrate new insights into the "Existing Global Memory" without losing old, relevant facts.
    - OUTPUT: Plain text only. No conversational filler.
  `.trim();

  // 3. Structured Data Input
  const input = `
    [EXISTING GLOBAL MEMORY]
    ${global?.summary || "No previous records."}

    [SESSION CONTEXT]
    ${session?.runningSummary || "N/A"}

    [NEW MESSAGES TO ANALYZE]
    ${messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n")}

    [INSTRUCTION]
    Extract new permanent facts from the messages and update the Global Memory within ${GLOBAL_SUMMARY_LIMIT} tokens.
  `.trim();

  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ],
      temperature: 0, // Deterministic for factual accuracy
      max_tokens: GLOBAL_SUMMARY_LIMIT, // Hard API-level limit
    });

    const updatedSummary = res.choices[0].message.content.trim();
    
    // 4. Token Calculation using tiktoken
    const newTokenCount = countTokens(updatedSummary);

    // 5. Update or Create Database Record
    if (global) {
      global.summary = updatedSummary;
      global.summaryTokens = newTokenCount;
      await global.save();
    } else {
      await GlobalMemory.create({
        userId,
        summary: updatedSummary,
        summaryTokens: newTokenCount
      });
    }

    // console.log(`Global Memory Updated: ${newTokenCount} tokens.`);
    // return updatedSummary;

  } catch (error) {
    console.error("Global Memory update failed:", error);
    // return global?.summary || "";
  }

  // await Message.deleteMany({sessionId:session._id});

  // session.runningSummary="";
  // session.runningSummaryTokens=0;
  // session.totalSessionTokensPerDay=0;

  // await session.save();

  return Response.json({ success:true });
};