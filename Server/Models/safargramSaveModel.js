import mongoose from "mongoose";

const saveSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SafarPost", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

saveSchema.index({ post: 1, user: 1 }, { unique: true });
saveSchema.index({ user: 1, _id: -1 });

export default mongoose.model("SafarSave", saveSchema);
