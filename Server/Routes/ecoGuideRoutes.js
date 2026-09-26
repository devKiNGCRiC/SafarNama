import express from "express";
import { makeEcoGuideController } from "../Controllers/ecoGuideController.js";
import { verifyToken, isAdmin, optionalAuth } from "../Middleware/authMiddleware.js";
import { uploadGuideImage } from "../Middleware/ecoGuideUpload.js";
import { DEFAULT_LIMITS, createLimiters } from "../Middleware/safargramLimits.js";
import { createCloudinaryMediaService } from "../services/safargramMedia.js";

// /api/v1/eco-guides. `media` and `limits` are injectable so tests can fake Cloudinary and rate limits.
export function createEcoGuideRouter({
  media = createCloudinaryMediaService(undefined, { folder: "safarnama/eco-guides" }),
  limits = DEFAULT_LIMITS,
} = {}) {
  const router = express.Router();
  const guides = makeEcoGuideController({ media });
  const limiters = createLimiters(limits);

  // Public reading (a valid login only adds "likedByMe"; a bad token is ignored)
  router.get("/", optionalAuth, guides.listGuides);
  router.get("/:id", optionalAuth, guides.getGuide);

  // Only admins write the guides
  router.post("/", verifyToken, isAdmin, uploadGuideImage, guides.createGuide);
  router.put("/:id", verifyToken, isAdmin, uploadGuideImage, guides.updateGuide);
  router.delete("/:id", verifyToken, isAdmin, guides.deleteGuide);

  // Any logged-in reader can like and comment
  router.post("/:id/like", verifyToken, limiters.reaction, guides.like);
  router.delete("/:id/like", verifyToken, limiters.reaction, guides.unlike);
  router.post("/:id/comments", verifyToken, limiters.comment, guides.addComment);
  router.delete("/:id/comments/:commentId", verifyToken, guides.deleteComment);

  return router;
}

export default createEcoGuideRouter();
