import mongoose from "mongoose";

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000; // a story is visible for 24 hours, like SafarGram's chat and posts

const storyMediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: Number,
    height: Number,
    duration: Number,
  },
  { _id: false },
);

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    media: { type: storyMediaSchema, required: true },
    caption: { type: String, default: "", trim: true, maxlength: 200 },
    viewers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + STORY_LIFETIME_MS) },
    // Cloudinary cleanup is opportunistic (see storyController.cleanupExpired); this flag stops
    // the same file being removed twice while MongoDB's TTL thread independently deletes the row.
    mediaCleaned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

storySchema.index({ author: 1, expiresAt: 1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB drops the document itself once it expires
storySchema.index({ "viewers.user": 1 });

const Story = mongoose.models.Story || mongoose.model("Story", storySchema);
export default Story;
export { STORY_LIFETIME_MS };
