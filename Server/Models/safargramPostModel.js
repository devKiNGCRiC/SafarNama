import mongoose from "mongoose";

export const CATEGORIES = [
  "Trekking", "Wildlife", "Culture", "Eco-stay", "Beach", "Food", "Adventure", "Other",
];

const mediaSchema = new mongoose.Schema(
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

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    media: {
      type: [mediaSchema],
      validate: [
        {
          validator: (items) => items.length >= 1 && items.length <= 5,
          message: "A post needs 1 to 5 media items",
        },
        {
          validator: (items) => {
            const videos = items.filter((m) => m.type === "video").length;
            return videos === 0 || (videos === 1 && items.length === 1);
          },
          message: "A post can have photos or one video, not both",
        },
      ],
    },
    caption: { type: String, default: "", trim: true, maxlength: 2200 },
    hashtags: { type: [String], default: [] },
    category: { type: String, enum: CATEGORIES, default: "Other" },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", default: null },
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

postSchema.index({ author: 1, _id: -1 });
postSchema.index({ hashtags: 1, _id: -1 });
postSchema.index({ destination: 1, _id: -1 });
postSchema.index({ caption: "text" }); // caption search on the Explore page

export default mongoose.model("SafarPost", postSchema);
