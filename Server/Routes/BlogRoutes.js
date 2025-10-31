import express from "express";
import { createBlogController, deleteBlogController, getAllBlogsController, getBlogByIdController, updateBlogController, userBlogController } from "../Controllers/BlogController.js";

//router objects

const router = express.Router();

//routes

//Get || All blogs
router.get("/all-blog" , getAllBlogsController);

//Post || Create a new blog
router.post("/create-blog", createBlogController);

//Put || Update a blog
router.put("/update-blog/:id", updateBlogController);

//Get || Get a single blog
router.get("/get-blog/:id", getBlogByIdController);

//Delete || Delete a blog
router.delete("/delete-blog/:id", deleteBlogController);

//Get || User blogs
router.get("/user-blog/:id", userBlogController);

export default router;