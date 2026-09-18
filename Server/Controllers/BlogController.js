import Mongoose from "mongoose";
import blogModel from "../Models/blogModel.js";
import UserModel from "../Models/userModel.js";
import cloudinary from "../utils/Cloudinary.js";
import fs from "fs";

//Get All Blogs
export const getAllBlogsController = async (req, res) => {
  try {
    const blogs = await blogModel
      .find({})
      .sort({ createdAt: -1 })
      .populate("user", "username");
    return res.status(200).send({
      success: true,
      BlogCount: blogs.length,
      message: blogs.length ? "All Blogs lists" : "No Blogs Found",
      blogs,
    });
  } catch (err) {
    console.error("getAllBlogs error:", err);
    return res.status(500).send({
      success: false,
      message: "Error while getting blogs",
    });
  }
};

//Create a Blog
export const createBlogController = async (req, res) => {
  try {
    const { title, description, image, excerpt, category, tags } = req.body;
    // The author is always the logged-in user - a `user` field sent by the
    // client is ignored so nobody can publish as someone else.
    const user = req.user._id;

    //vadidation
    if (!title || !description || !image) {
      return res.status(400).send({
        success: false,
        message: "Title, description and image are required",
      });
    }

    const existingUser = await UserModel.findById(user);
    //validation
    if (!existingUser) {
      return res.status(400).send({
        success: false,
        message: "Unable to find user",
      });
    }

    const session = await Mongoose.startSession();
    session.startTransaction();
    try {
      // Create and save new blog in the session
      const newBlog = new blogModel({
        title,
        description,
        image,
        user,
        excerpt: excerpt || "",
        category: category || "Travel",
        tags: tags || [],
      });
      await newBlog.save({ session });

      // Add blog reference to the user's blogs array
      existingUser.blogs.push(newBlog._id);
      await existingUser.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // await newBlog.save();

      return res.status(201).send({
        success: true,
        message: "Blog created successfully",
        blog: newBlog,
      });
    } catch (err) {
      // Abort transaction in case of error
      await session.abortTransaction();
      session.endSession();
      throw err; // rethrow error to be caught in the outer catch
    }
  } catch (error) {
    console.error("createBlog error:", error);
    return res.status(400).send({
      success: false,
      message: "Error while creating blog",
    });
  }
};
// Upload Blog Image to Cloudinary
export const uploadBlogImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "No image file provided",
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "safarnama/blogs",
      resource_type: "image",
      transformation: [
        { width: 1200, height: 675, crop: "fill" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    // Delete local file after upload
    fs.unlinkSync(req.file.path);

    return res.status(200).send({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("uploadBlogImage error:", error);
    // Clean up local file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).send({
      success: false,
      message: "Error uploading image",
      error: error.message,
    });
  }
};
//Update a Blog (owner or admin)
export const updateBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog not found",
      });
    }

    if (
      blog.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).send({
        success: false,
        message: "You can only edit your own blogs",
      });
    }

    // Only these fields can be changed - never `user`, `_id`, timestamps, ...
    for (const field of [
      "title",
      "description",
      "image",
      "excerpt",
      "category",
      "tags",
    ]) {
      if (req.body[field] !== undefined) blog[field] = req.body[field];
    }
    await blog.save();

    return res.status(200).send({
      success: true,
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    console.error("updateBlog error:", error);
    return res.status(400).send({
      success: false,
      message: "Error while updating blog",
    });
  }
};

//Get a Single Blog
export const getBlogByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await blogModel.findById(id).populate("user", "username");
    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog not found",
      });
    }
    return res.status(200).send({
      success: true,
      message: "Blog found",
      blog,
    });
  } catch (error) {
    console.error("getBlogById error:", error);
    return res.status(400).send({
      success: false,
      message: "Error while getting blog",
    });
  }
};

//Delete a Blog (owner or admin)
export const deleteBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await blogModel.findById(id);
    // Check if the blog exists
    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog not found",
      });
    }

    if (
      blog.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).send({
        success: false,
        message: "You can only delete your own blogs",
      });
    }

    await blog.deleteOne();
    // Remove the reference from the author's list (author may be gone already)
    await UserModel.updateOne(
      { _id: blog.user },
      { $pull: { blogs: blog._id } },
    );

    return res.status(200).send({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("deleteBlog error:", error);
    return res.status(400).send({
      success: false,
      message: "Error while deleting blog",
    });
  }
};

//Get User Blog
export const userBlogController = async (req, res) => {
  try {
    const userBlog = await UserModel.findById(req.params.id)
      .select("username firstName lastName avatar blogs")
      .populate({
      path: "blogs",
      populate: {
        path: "user",
        select: "username",
      },
    });
    if (!userBlog) {
      return res.status(404).send({
        success: false,
        message: "Blogs not found with this id",
      });
    }
    return res.status(200).send({
      success: true,
      message: "User blogs",
      userBlog,
    });
  } catch (error) {
    console.error("userBlog error:", error);
    return res.status(400).send({
      success: false,
      message: "Error in user blog",
    });
  }
};
