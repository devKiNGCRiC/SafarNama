import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    // "pending" = a message request the user has not accepted yet
    status: { type: String, enum: ["active", "pending"], default: "active" },
    // Everything after this moment (from other people) counts as unread.
    // Epoch by default; members added to an existing group get "now" from the code.
    lastReadAt: { type: Date, default: () => new Date(0) },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "group"], required: true },
    name: { type: String, trim: true, maxlength: 50 },
    avatar: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Direct chats only: "<smallerId>:<largerId>" so a pair can never have two chats.
    directKey: { type: String, unique: true, sparse: true },
    members: { type: [memberSchema], default: [] },
    lastMessage: {
      text: String,
      kind: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      at: Date,
    },
  },
  { timestamps: true },
);

conversationSchema.pre("validate", function checkMembers(next) {
  const count = this.members.length;
  if (this.type === "direct" && count !== 2) {
    return next(new Error("A direct conversation must have exactly 2 members"));
  }
  if (this.type === "group" && (count < 3 || count > 50)) {
    return next(new Error("A group must have 3 to 50 members"));
  }
  next();
});

conversationSchema.index({ "members.user": 1, updatedAt: -1 });

export default mongoose.model("ChatConversation", conversationSchema);
