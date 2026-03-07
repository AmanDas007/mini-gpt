import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/components/auth";
import connectDB from "@/db/connectDB";
import User from "@/models/User";
import Message from "@/models/Message";
import ChatSession from "@/models/ChatSession";
import GlobalMemory from "@/models/GlobalMemory";

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const email = session.user.email;
    const userId = session.user.id;
    
    const userChatSession = await ChatSession.findOne({ userId: userId });

    // 2. Perform deletions in parallel for efficiency
    await Promise.all([
      // Delete the User profile
      User.findOneAndDelete({ email: email }),

      // Delete the Global Memory associated with this user
      GlobalMemory.findOneAndDelete({ userId: userId }),

      // Delete the ChatSession itself
      ChatSession.findOneAndDelete({ userId: userId }),

      // Delete all Messages that belonged to that ChatSession
      userChatSession ? Message.deleteMany({ sessionId: userChatSession._id }) : Promise.resolve(),
    ]);

    return NextResponse.json({ message: "Account and all associated data deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}