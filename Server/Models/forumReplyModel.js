import mongoose from "mongoose";

const forumReplySchema = new mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "ForumThread", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 2000 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    editedAt: Date,
  },
  { timestamps: true },
);

forumReplySchema.index({ thread: 1, _id: 1 });

const ForumReply = mongoose.models.ForumReply || mongoose.model("ForumReply", forumReplySchema);
export default ForumReply;
