import mongoose from "mongoose";

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    totalSessionTokens: {
      type: Number,
      default: 0,
    },

    unsummarizedTokenSum: {
      type: Number,
      default: 0,
    },

    imageCount: {
      type: Number,
      default: 0,
    },

    audioCount: {
      type: Number,
      default: 0,
    },

    videoCount: {
      type: Number,
      default: 0,
    },

    // Optional: limit media generation within 24 hrs
    mediaResetAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent model overwrite in Next.js hot reload
export default mongoose.models.ChatSession || mongoose.model("ChatSession", ChatSessionSchema);
