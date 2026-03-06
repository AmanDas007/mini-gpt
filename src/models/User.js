import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    password: {
      type: String,
    },

    image: {
      type: String,
    },

    providers: {
      type: [String],
      enum: ["credentials", "google", "github"],
      default: ["credentials"]
    },

    totalTokenUsage: {
      type: Number,
      default: 0,
    },

    // plan: {
    //   type: String,
    //   enum: ["free", "pro"],
    //   default: "free",
    // },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
