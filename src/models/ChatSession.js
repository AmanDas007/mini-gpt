import mongoose from "mongoose";

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // title: {
    //   type: String,
    //   default: "New Chat",
    // },

    runningSummary: {
      type: String,
      default: "",
    },

    runningSummaryTokens: {
      type: Number,
      default: 0,
    },

    totalSessionTokensPerDay: {
      type: Number,
      default: 0,
    },

    // unsummarizedTokenSum: {
    //   type: Number,
    //   default: 0,
    // },

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
      default: null,
    },
  },
  { timestamps: true }
);

ChatSessionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.ChatSession || mongoose.model("ChatSession", ChatSessionSchema);
