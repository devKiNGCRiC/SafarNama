import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import SafarPost from "../../Models/safargramPostModel.js";
import SafarComment from "../../Models/safargramCommentModel.js";
import { assertObjectId, cursorFilter, parsePaging, toPage } from "../../utils/cursor.js";
import { AUTHOR_FIELDS } from "../../services/safargramSerializer.js";

async function requirePost(rawId) {
  const id = assertObjectId(rawId, "post id");
  if (!(await SafarPost.exists({ _id: id }))) {
    throw new AppError("Post not found", 404);
  }
  return id;
}

export const listComments = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  const { limit, cursor } = parsePaging(req.query, { defaultLimit: 20, max: 50 });
  const rows = await SafarComment.find({ post, ...cursorFilter(cursor) })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate("author", AUTHOR_FIELDS);
  const { page, nextCursor } = toPage(rows, limit);
  res.status(200).json({ success: true, data: page, nextCursor });
});

export const addComment = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  if (text.length < 1 || text.length > 500) {
    throw new AppError("Comment must be between 1 and 500 characters", 400);
  }

  const comment = await SafarComment.create({ post, author: req.user._id, text });
  await SafarPost.updateOne({ _id: post }, { $inc: { commentsCount: 1 } });
  await comment.populate("author", AUTHOR_FIELDS);
  res.status(201).json({ success: true, data: comment });
});

export const deleteComment = catchAsync(async (req, res) => {
  const id = assertObjectId(req.params.id, "comment id");
  const comment = await SafarComment.findById(id);
  if (!comment) throw new AppError("Comment not found", 404);

  const post = await SafarPost.findById(comment.post).select("author");
  const me = String(req.user._id);
  const allowed =
    String(comment.author) === me ||
    (post && String(post.author) === me) ||
    req.user.role === "admin";
  if (!allowed) throw new AppError("You cannot delete this comment", 403);

  await comment.deleteOne();
  if (post) {
    await SafarPost.updateOne(
      { _id: post._id, commentsCount: { $gt: 0 } },
      { $inc: { commentsCount: -1 } },
    );
  }
  res.status(200).json({ success: true, message: "Comment deleted" });
});
