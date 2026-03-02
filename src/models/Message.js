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
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    tokenCount: {
      type: Number,
      required: true,
    },

    mimeType: {
      type: String,
    },

    duration: {
      type: Number, // for audio/video (seconds)
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },

    isSummarized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
