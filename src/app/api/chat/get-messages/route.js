import connectDB from "@/db/connectDB";
import Message from "@/models/Message";
import ChatSession from "@/models/ChatSession";
import { redis } from "@/lib/redis";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = 20; // Number of messages per fetch
  const skip = (page - 1) * limit;

  try {
    // ==========================================
    // 1. CHECK REDIS FOR 60-SECOND SPAM LIMIT
    // ==========================================
    const rateLimitKey = `rate_limit:chat:${userId}`;
    const requests = await redis.get(rateLimitKey);
    let rateLimitTTL = 0;

    // If they have made more than 10 requests, check how many seconds are left on their ban
    if (requests && parseInt(requests) > 10) {
      rateLimitTTL = await redis.ttl(rateLimitKey); 
    }

    // ==========================================
    // 2. CHECK MONGODB FOR 24-HOUR DAILY LIMIT
    // ==========================================
    const session = await ChatSession.findOne({ userId });
    let isDailyLimited = false;

    if (session) {
      // If mediaResetAt exists and the current time is before the reset time
      isDailyLimited = session.mediaResetAt && Date.now() < new Date(session.mediaResetAt).getTime();
    }

    // ==========================================
    // 3. FETCH MESSAGES & RETURN EVERYTHING
    // ==========================================
    const messages = session 
      ? await Message.find({ sessionId: session._id }).sort({ createdAt: -1 }).skip(skip).limit(limit)
      : [];

    return Response.json({
      messages: messages.reverse(),
      isDailyLimited: isDailyLimited,
      rateLimitTTL: Math.max(0, rateLimitTTL) // Returns remaining seconds (or 0 if not blocked)
    });

  } catch (error) {
    console.error("Get Messages Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}