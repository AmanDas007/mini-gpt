import connectDB from "@/db/connectDB";
import Message from "@/models/Message";
import ChatSession from "@/models/ChatSession";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = 20; // Number of messages per fetch
  const skip = (page - 1) * limit;

  try {
    const session = await ChatSession.findOne({ userId });
    if (!session) return Response.json([]);

    // Fetch messages sorted by newest first, then reverse for the UI
    const messages = await Message.find({ sessionId: session._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Reverse them so they appear in chronological order (Oldest -> Newest)
    return Response.json(messages.reverse());
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}