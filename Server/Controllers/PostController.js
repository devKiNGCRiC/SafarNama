import PostModel from "../Models/postModel.js";
import UserModel from "../Models/userModel.js";

import mongoose from "mongoose";

// The acting user always comes from the verified JWT (req.user, set by
// verifyToken) - a `userId` sent in the request body is never trusted.

//Create a new Post
export const createPost = async (req, res) => {
  try {
    const newPost = new PostModel({
      userId: req.user._id.toString(),
      desc: req.body.desc,
      image: req.body.image,
    });
    const savedPost = await newPost.save();
    // Find the user and update their posts array
    await UserModel.findByIdAndUpdate(req.user._id, {
      $push: { posts: savedPost._id },
    });
    res.status(200).json(savedPost);
  } catch (error) {
    console.error("createPost error:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

//Get a Post
export const getPost = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (post) {
      res.status(200).json(post);
    } else {
      res.status(404).json("Post does not exist");
    }
  } catch (error) {
    res.status(400).json({ message: "Invalid post id" });
  }
};

//Update a Post (author only)
export const updatePost = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json("Post does not exist");
    }
    if (post.userId !== req.user._id.toString()) {
      return res.status(403).json("You can only edit your own posts");
    }

    if (req.body.desc !== undefined) post.desc = req.body.desc;
    if (req.body.image !== undefined) post.image = req.body.image;
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error("updatePost error:", error);
    res.status(500).json({ message: "Failed to update post" });
  }
};

//Delete a Post (author or admin)
export const deletePost = async (req, res) => {
  try {
    // Look the post up first - it used to be deleted *before* the owner check
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json("Post does not exist");
    }
    if (
      post.userId !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json("You can only delete your own posts");
    }

    await post.deleteOne();
    await UserModel.updateOne(
      { _id: post.userId },
      { $pull: { posts: post._id } },
    );
    res.status(200).json("Post deleted successfully");
  } catch (error) {
    console.error("deletePost error:", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

//Like a Post
export const likePost = async (req, res) => {
  const userId = req.user._id.toString();
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json("Post does not exist");
    }
    if (post.likes.includes(userId)) {
      await post.updateOne({ $pull: { likes: userId } });
      res.status(200).json("Post unliked!");
    } else {
      await post.updateOne({ $push: { likes: userId } });
      res.status(200).json("Post liked!");
    }
  } catch (error) {
    console.error("likePost error:", error);
    res.status(500).json({ message: "Failed to like post" });
  }
};

//Get Timeline Posts
export const getTimelinePosts = async (req, res) => {
  const userId = req.params.id;
  try {
    const currentUserPosts = await PostModel.find({ userId: userId });
    const followingPosts = await UserModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "following",
          foreignField: "userId",
          as: "followingPosts",
        },
      },
      {
        $project: {
          followingPosts: 1,
          _id: 0,
        },
      },
    ]);
    const others = followingPosts[0]?.followingPosts || [];
    res.status(200).json(
      currentUserPosts.concat(...others).sort((a, b) => {
        return b.createdAt - a.createdAt;
      }),
    );
  } catch (error) {
    console.error("getTimelinePosts error:", error);
    res.status(500).json({ message: "Failed to load timeline" });
  }
};

// Controller to add a comment
export const addComment = async (req, res) => {
  const postId = req.params.id;
  // The client sends the comment text either as `text` or wrapped in `comment`
  const text = req.body.text ?? req.body.comment;

  try {
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    // Find and update the post with the new comment
    const post = await PostModel.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            userId: req.user._id.toString(),
            text: text.trim(),
            createdAt: new Date(),
          },
        },
      },
      { new: true }, // Return the updated document
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Return just the comments array
    res.status(200).json(post.comments);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller to get comments (the route parameter is named `postId`)
export const getComments = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    res.status(200).json(post.comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve comments" });
  }
};
