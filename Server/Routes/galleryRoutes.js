import express from "express";
import { makeGalleryController } from "../Controllers/galleryController.js";
import { verifyToken, optionalAuth } from "../Middleware/authMiddleware.js";
import { uploadGalleryPhoto } from "../Middleware/galleryUpload.js";
import { DEFAULT_LIMITS, createLimiters } from "../Middleware/safargramLimits.js";
import { createCloudinaryMediaService } from "../services/safargramMedia.js";

// /api/v1/gallery. `media` and `limits` are injectable so tests can fake Cloudinary and rate limits.
export function createGalleryRouter({
  media = createCloudinaryMediaService(undefined, { folder: "safarnama/gallery" }),
  limits = DEFAULT_LIMITS,
} = {}) {
  const router = express.Router();
  const gallery = makeGalleryController({ media });
  const limiters = createLimiters(limits);

  // Public viewing (a valid login only adds "likedByMe"; a bad token is ignored)
  router.get("/", optionalAuth, gallery.listPhotos);
  router.get("/:id", optionalAuth, gallery.getPhoto);

  // Logged-in people add photos, like and comment
  router.post("/", verifyToken, limiters.createPost, uploadGalleryPhoto, gallery.uploadPhoto);
  router.put("/:id", verifyToken, gallery.updatePhoto);
  router.delete("/:id", verifyToken, gallery.deletePhoto);
  router.post("/:id/like", verifyToken, limiters.reaction, gallery.like);
  router.delete("/:id/like", verifyToken, limiters.reaction, gallery.unlike);
  router.post("/:id/comments", verifyToken, limiters.comment, gallery.addComment);
  router.delete("/:id/comments/:commentId", verifyToken, gallery.deleteComment);

  return router;
}

export default createGalleryRouter();
