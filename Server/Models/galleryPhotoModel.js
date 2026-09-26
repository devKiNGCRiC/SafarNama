import mongoose from "mongoose";

// One travel photo in the public Gallery. A person's "album" is simply their photos.
const galleryPhotoSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary id, needed to delete the file
    width: Number,
    height: Number,
    caption: { type: String, trim: true, maxlength: 300, default: "" },
    location: { type: String, trim: true, maxlength: 80, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

galleryPhotoSchema.index({ owner: 1, _id: -1 });

const GalleryPhoto = mongoose.models.GalleryPhoto || mongoose.model("GalleryPhoto", galleryPhotoSchema);
export default GalleryPhoto;
