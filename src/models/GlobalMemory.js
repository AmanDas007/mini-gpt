import mongoose from "mongoose";

const GlobalMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    summary: {
      type: String,
      default: "",
    },

    summaryTokens: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.GlobalMemory || mongoose.model("GlobalMemory", GlobalMemorySchema);
