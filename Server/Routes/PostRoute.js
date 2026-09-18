import Express from "express";
import {
  createPost,
  deletePost,
  getPost,
  getTimelinePosts,
  likePost,
  updatePost,
  addComment,
  getComments,
} from "../Controllers/PostController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";

const router = Express.Router();

// Every post endpoint needs a logged-in user
router.use(verifyToken);

router.post("/", createPost);
router.get("/:id", getPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.put("/:id/like", likePost);
router.post("/:id/comment", addComment);
router.get("/:postId/comments", getComments);
router.get("/:id/timeline", getTimelinePosts);

export default router;
