import PostModel from "../Models/postModel.js";
import UserModel from "../Models/userModel.js";

import mongoose from "mongoose";

//Create a new Post

export const createPost = async (req, res) => {
  const newPost = new PostModel(req.body);
  try {
    const savedPost = await newPost.save();
    // Find the user and update their posts array
    await UserModel.findByIdAndUpdate(req.body.userId, {
      $push: { posts: savedPost._id },
    });
    res.status(200).json(newPost);
  } catch (error) {
    res.status(500).json(error);
  }
};

//Get a Post

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await PostModel.findById(id);
    if (post) {
      res.status(200).json(post);
    } else {
      res.status(404).json("Post does not exist");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};


//Update a Post

export const updatePost = async (req, res) => {
  const postId = req.params.id;
  const { userId } = req.body;
  try {
        const updatedPost = await PostModel.findByIdAndUpdate(postId);
        
        if (updatedPost.userId === userId) {
            await updatedPost.updateOne({ $set: req.body });
            res.status(200).json(updatedPost);
        } else {
            res.status(404).json("Post does not exist");
        }
    } catch (error) {
        res.status(500).json(error);
    }
};

//Delete a Post

export const deletePost = async (req, res) => {
  const postId = req.params.id;
  const { userId } = req.body;
  try {
        const deletedPost = await PostModel.findByIdAndDelete(postId);
        if (deletedPost.userId === userId) {
            await deletedPost.deleteOne();
            res.status(200).json("Post deleted successfully");
        } else {
            res.status(404).json("Post does not exist");
        }
    } catch (error) {
        res.status(500).json(error);
    }
};

//Like a Post

export const likePost = async (req, res) => {
    const postId = req.params.id;
    const { userId } = req.body;
    try {
        const post = await PostModel.findById(postId);
        if (post.likes.includes(userId)) {
            await post.updateOne({ $pull: { likes: userId } });
            res.status(200).json("Post unliked!");
        } else {
            await post.updateOne({ $push: { likes: userId } });
            res.status(200).json("Post liked!");
        }
    } catch (error) {
    res.status(500).json(error);
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
    res.status(200).json(currentUserPosts.concat(...followingPosts[0].followingPosts).sort((a, b) =>{
        return b.createdAt - a.createdAt;
    }));
  } catch (error) {
    res.status(500).json(error);
  }
};


// Controller to add a comment
export const addComment = async (req, res) => {
  const postId = req.params.id;
  const { userId, text } = req.body;

  try {
    // Validate inputs
    if (!userId || !text) {
      return res.status(400).json({ message: "User ID and text are required." });
    }

    // Find and update the post with the new comment
    const post = await PostModel.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            userId,
            text,
            createdAt: new Date()
          }
        }
      },
      { new: true } // Return the updated document
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Return just the comments array
    res.status(200).json(post.comments);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


// Controller to add a comment
// export const addComment = async (req, res) => {
//   const { id } = req.params.id;
//   console.log("Received Post ID:", id);
//   const { userId, text } = req.body;

//   try {
//     // Validate that all required data is present
//     if (!userId || !text) {
//       return res.status(400).json({ message: "User ID and text are required." });
//     }

//     // Find the post by ID
//     const post = await PostModel.findById(id);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found." });
//     }

//     // Add the comment to the post's comment array
//     post.comments.push({ userId, text });
//     await post.save(); // Save the updated post

//     // Return the updated comments
//     res.status(200).json(post.comments);
//   } catch (error) {
//     console.error("Error adding comment:", error);
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }

//   // try {
//   //   const post = await PostModel.findById(postId);
//   //   const newComment = { userId, text, createdAt: new Date() };
//   //   post.comments.push(newComment);
//   //   await post.save();
//   //   res.status(201).json(post.comments);
//   // } catch (error) {
//   //   res.status(500).json({ error: "Failed to add comment" });
//   // }
// };

// Controller to get comments
export const getComments = async (req, res) => {
  const  postId  = req.params.id;

  try {
    const post = await PostModel.findById(postId);
    res.status(200).json(post.comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve comments" });
  }
};