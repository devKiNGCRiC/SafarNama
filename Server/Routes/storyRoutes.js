import express from "express";
import { makeStoryController } from "../Controllers/storyController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";
import { uploadStoryMedia } from "../Middleware/storyUpload.js";
import { DEFAULT_LIMITS, createLimiters } from "../Middleware/safargramLimits.js";
import { createCloudinaryMediaService } from "../services/safargramMedia.js";

// /api/v1/stories. `media` and `limits` are injectable so tests can fake Cloudinary and rate limits.
// Stories are a private, followers-only feature (like SafarGram chat), so every route needs a login.
export function createStoryRouter({
  media = createCloudinaryMediaService(undefined, { folder: "safarnama/stories" }),
  limits = DEFAULT_LIMITS,
} = {}) {
  const router = express.Router();
  const stories = makeStoryController({ media });
  const limiters = createLimiters(limits);

  router.use(verifyToken);
  router.get("/feed", stories.feed);
  router.get("/mine", stories.mine);
  router.post("/", limiters.createPost, uploadStoryMedia, stories.create);
  router.post("/:id/view", limiters.reaction, stories.view);
  router.get("/:id/viewers", stories.viewers);
  router.delete("/:id", stories.remove);

  return router;
}

export default createStoryRouter();
