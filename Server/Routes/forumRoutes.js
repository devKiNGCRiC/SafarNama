import express from "express";
import { makeForumController } from "../Controllers/forumController.js";
import { verifyToken, isAdmin, optionalAuth } from "../Middleware/authMiddleware.js";
import { DEFAULT_LIMITS, createLimiters } from "../Middleware/safargramLimits.js";

// /api/v1/forum. `limits` is injectable so tests are not slowed by rate limits.
export function createForumRouter({ limits = DEFAULT_LIMITS } = {}) {
  const router = express.Router();
  const forum = makeForumController();
  const limiters = createLimiters(limits);

  // Reading is public (a valid login only adds "likedByMe" / "savedByMe"; a bad token is ignored)
  router.get("/threads", optionalAuth, forum.listThreads);
  router.get("/threads/:id", optionalAuth, forum.getThread);
  router.get("/threads/:id/replies", optionalAuth, forum.listReplies);

  // Threads
  router.post("/threads", verifyToken, limiters.createPost, forum.createThread);
  router.patch("/threads/:id", verifyToken, forum.updateThread);
  router.delete("/threads/:id", verifyToken, forum.deleteThread);
  router.post("/threads/:id/like", verifyToken, limiters.reaction, forum.like);
  router.delete("/threads/:id/like", verifyToken, limiters.reaction, forum.unlike);
  router.post("/threads/:id/save", verifyToken, limiters.reaction, forum.save);
  router.delete("/threads/:id/save", verifyToken, limiters.reaction, forum.unsave);

  // Moderation (admins only)
  router.post("/threads/:id/pin", verifyToken, isAdmin, forum.pin);
  router.delete("/threads/:id/pin", verifyToken, isAdmin, forum.unpin);
  router.post("/threads/:id/lock", verifyToken, isAdmin, forum.lock);
  router.delete("/threads/:id/lock", verifyToken, isAdmin, forum.unlock);

  // Replies
  router.post("/threads/:id/replies", verifyToken, limiters.comment, forum.createReply);
  router.patch("/replies/:replyId", verifyToken, forum.updateReply);
  router.delete("/replies/:replyId", verifyToken, forum.deleteReply);
  router.post("/replies/:replyId/like", verifyToken, limiters.reaction, forum.likeReply);
  router.delete("/replies/:replyId/like", verifyToken, limiters.reaction, forum.unlikeReply);

  // Accepted answer
  router.post("/threads/:id/accept/:replyId", verifyToken, forum.acceptReply);
  router.delete("/threads/:id/accept", verifyToken, forum.clearAccepted);

  return router;
}

export default createForumRouter();
