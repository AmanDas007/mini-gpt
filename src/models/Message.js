import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "audio", "video"],
      default: "text",
    },

    content: {
      type: String, // text or file URL 
      required: true,
    },

    tokenCount: {
      type: Number,
      default: 0,
    },

    mimeType: {
      type: String,
    },

    duration: {
      type: Number, // for audio/video (seconds)
    },

    isSummarized: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ sessionId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
