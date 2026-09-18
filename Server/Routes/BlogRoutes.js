import express from "express";
import {
  createBlogController,
  deleteBlogController,
  getAllBlogsController,
  getBlogByIdController,
  updateBlogController,
  userBlogController,
  uploadBlogImageController,
} from "../Controllers/BlogController.js";
import { upload } from "../Middleware/uploadMiddleware.js";
import { verifyToken } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Public reads
router.get("/all-blog", getAllBlogsController);
router.get("/get-blog/:id", getBlogByIdController);
router.get("/user-blog/:id", userBlogController);

// Writes require a logged-in user; ownership is checked in the controller
router.post(
  "/upload-blog-image",
  verifyToken,
  upload.single("image"),
  uploadBlogImageController,
);
router.post("/create-blog", verifyToken, createBlogController);
router.put("/update-blog/:id", verifyToken, updateBlogController);
router.delete("/delete-blog/:id", verifyToken, deleteBlogController);

export default router;
