import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import SafarPost, { CATEGORIES } from "../../Models/safargramPostModel.js";
import SafarComment from "../../Models/safargramCommentModel.js";
import SafarLike from "../../Models/safargramLikeModel.js";
import SafarSave from "../../Models/safargramSaveModel.js";
import Destination from "../../Models/destinationModel.js";
import { assertObjectId } from "../../utils/cursor.js";
import { extractHashtags } from "../../utils/safargramText.js";
import { validateMediaFiles } from "../../utils/safargramMediaRules.js";
import { removeTempFiles } from "../../Middleware/safargramUpload.js";
import { populatePost, serializePosts } from "../../services/safargramSerializer.js";

export function makePostController(media) {
  const createPost = catchAsync(async (req, res) => {
    const files = req.files || [];
    try {
      const problem = validateMediaFiles(files);
      if (problem) throw new AppError(problem, 400);

      const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
      if (caption.length > 2200) {
        throw new AppError("Caption can be at most 2200 characters", 400);
      }

      const category = req.body.category || "Other";
      if (!CATEGORIES.includes(category)) throw new AppError("Invalid category", 400);

      let destination = null;
      if (req.body.destinationId) {
        destination = assertObjectId(req.body.destinationId, "destination id");
        if (!(await Destination.exists({ _id: destination }))) {
          throw new AppError("Destination not found", 400);
        }
      }

      // Upload everything; on any failure remove what already went up.
      const settled = await Promise.allSettled(files.map((f) => media.upload(f)));
      const uploaded = settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
      const failed = settled.find((s) => s.status === "rejected");
      if (failed) {
        await media.remove(uploaded);
        throw failed.reason instanceof AppError
          ? failed.reason
          : new AppError("Could not upload media. Please try again.", 502);
      }

      let post;
      try {
        post = await SafarPost.create({
          author: req.user._id,
          media: uploaded,
          caption,
          hashtags: extractHashtags(caption),
          category,
          destination,
        });
      } catch (error) {
        await media.remove(uploaded);
        throw error;
      }

      const populated = await populatePost(SafarPost.findById(post._id));
      const [data] = await serializePosts([populated], req.user._id);
      res.status(201).json({ success: true, data });
    } finally {
      await removeTempFiles(files);
    }
  });

  const getPost = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "post id");
    const post = await populatePost(SafarPost.findById(id));
    if (!post) throw new AppError("Post not found", 404);
    const [data] = await serializePosts([post], req.user._id);
    res.status(200).json({ success: true, data });
  });

  const deletePost = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "post id");
    const post = await SafarPost.findById(id);
    if (!post) throw new AppError("Post not found", 404);

    const isOwner = String(post.author) === String(req.user._id);
    if (!isOwner && req.user.role !== "admin") {
      throw new AppError("You can only delete your own posts", 403);
    }

    await Promise.all([
      SafarComment.deleteMany({ post: id }),
      SafarLike.deleteMany({ post: id }),
      SafarSave.deleteMany({ post: id }),
      post.deleteOne(),
    ]);
    await media.remove(post.media); // best effort, never throws
    res.status(200).json({ success: true, message: "Post deleted" });
  });

  return { createPost, getPost, deletePost };
}
