import mongoose from "mongoose";

// "Someone liked / commented on your post" and "someone followed you".
// Chat messages are NOT notifications: chat has its own unread badge.
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "comment", "follow"], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SafarPost" },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "SafarComment" },
    text: { type: String, maxlength: 120 }, // comment snippet
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, _id: -1 });
// One notification per person per post (likes) and per follower (follows): toggling
// like/follow repeatedly can never flood someone's list.
notificationSchema.index(
  { recipient: 1, actor: 1, type: 1, post: 1 },
  { unique: true, partialFilterExpression: { type: "like" } },
);
notificationSchema.index(
  { recipient: 1, actor: 1 },
  { unique: true, partialFilterExpression: { type: "follow" } },
);

export default mongoose.model("Notification", notificationSchema);
