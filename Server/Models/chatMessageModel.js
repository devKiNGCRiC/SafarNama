import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: Number,
    height: Number,
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "ChatConversation", required: true },
    // null for system messages ("Asha added Ravi")
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    kind: { type: String, enum: ["text", "image", "system"], required: true },
    text: { type: String, default: "", trim: true, maxlength: 2000 },
    media: { type: mediaSchema, default: undefined },
  },
  { timestamps: true },
);

messageSchema.pre("validate", function checkContent(next) {
  if (this.kind === "text" && !this.text) {
    return next(new Error("A text message needs text"));
  }
  if (this.kind === "image" && !this.media?.url) {
    return next(new Error("An image message needs an image"));
  }
  next();
});

messageSchema.index({ conversation: 1, _id: -1 });

export default mongoose.model("ChatMessage", messageSchema);
