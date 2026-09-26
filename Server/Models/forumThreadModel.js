import mongoose from "mongoose";

export const FORUM_CATEGORIES = [
  "GENERAL",
  "TRIP_HELP",
  "TRAVEL_TIPS",
  "ECO_PRACTICES",
  "LOCAL_KNOWLEDGE",
  "MEETUPS",
];

// A discussion topic. Replies live in their own collection (ForumReply) so a busy thread never
// grows into one huge document; replyCount is kept in step with them by atomic updates.
const forumThreadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    content: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: FORUM_CATEGORIES, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [String],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replyCount: { type: Number, default: 0, min: 0 },
    lastReplyAt: Date,
    pinned: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    acceptedReply: { type: mongoose.Schema.Types.ObjectId, ref: "ForumReply", default: null },
    editedAt: Date,
  },
  { timestamps: true },
);

forumThreadSchema.index({ category: 1, _id: -1 });
forumThreadSchema.index({ tags: 1, _id: -1 });
forumThreadSchema.index({ author: 1, _id: -1 });
forumThreadSchema.index({ bookmarks: 1, _id: -1 });
forumThreadSchema.index({ pinned: 1 });

const ForumThread = mongoose.models.ForumThread || mongoose.model("ForumThread", forumThreadSchema);
export default ForumThread;
