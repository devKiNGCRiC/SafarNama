import mongoose from "mongoose";

export const GUIDE_CATEGORIES = ["SUSTAINABLE_TIPS", "BEST_PRACTICES", "LOCAL_GUIDE"];

const ecoGuideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: GUIDE_CATEGORIES, required: true },
    // Optional short teaser; when empty the list shows the start of the article instead.
    summary: { type: String, trim: true, maxlength: 200, default: "" },
    content: { type: String, required: true, maxlength: 20000 },
    images: [String],
    imagePublicId: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tags: [String],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

ecoGuideSchema.index({ category: 1, _id: -1 });
ecoGuideSchema.index({ tags: 1, _id: -1 });

const EcoGuide = mongoose.models.EcoGuide || mongoose.model("EcoGuide", ecoGuideSchema);
export default EcoGuide;
