import express from "express";
import { verifyToken } from "../Middleware/authMiddleware.js";
import { DEFAULT_LIMITS, createLimiters } from "../Middleware/safargramLimits.js";
import { createCloudinaryMediaService } from "../services/safargramMedia.js";
import { uploadMedia } from "../Middleware/safargramUpload.js";
import { makePostController } from "../Controllers/safargram/postController.js";
import {
  likePost,
  savePost,
  unlikePost,
  unsavePost,
} from "../Controllers/safargram/reactionController.js";
import {
  addComment,
  deleteComment,
  listComments,
} from "../Controllers/safargram/commentController.js";
import {
  getDestinationPosts,
  getFeed,
  getHashtagPosts,
  getSaved,
  getTrending,
  getUserPosts,
} from "../Controllers/safargram/feedController.js";

// `media` and `limits` are injectable so tests can fake Cloudinary and rate limits.
export function createSafargramRouter({
  media = createCloudinaryMediaService(),
  limits = DEFAULT_LIMITS,
} = {}) {
  const router = express.Router();
  const limiters = createLimiters(limits);
  const posts = makePostController(media);

  router.use(verifyToken);

  router.post("/posts", limiters.createPost, uploadMedia, posts.createPost);
  router.get("/posts/:id", posts.getPost);
  router.delete("/posts/:id", posts.deletePost);
  router.post("/posts/:id/like", limiters.reaction, likePost);
  router.delete("/posts/:id/like", limiters.reaction, unlikePost);
  router.post("/posts/:id/save", limiters.reaction, savePost);
  router.delete("/posts/:id/save", limiters.reaction, unsavePost);
  router.get("/posts/:id/comments", listComments);
  router.post("/posts/:id/comments", limiters.comment, addComment);
  router.delete("/comments/:id", deleteComment);

  router.get("/feed", getFeed);
  router.get("/saved", getSaved);
  router.get("/trending", getTrending);
  router.get("/users/:username/posts", getUserPosts);
  router.get("/hashtags/:tag", getHashtagPosts);
  router.get("/destinations/:id/posts", getDestinationPosts);

  return router;
}

export default createSafargramRouter();
