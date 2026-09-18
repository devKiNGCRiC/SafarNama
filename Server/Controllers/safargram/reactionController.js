import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import SafarPost from "../../Models/safargramPostModel.js";
import SafarLike from "../../Models/safargramLikeModel.js";
import SafarSave from "../../Models/safargramSaveModel.js";
import { assertObjectId } from "../../utils/cursor.js";

async function requirePost(rawId) {
  const id = assertObjectId(rawId, "post id");
  if (!(await SafarPost.exists({ _id: id }))) {
    throw new AppError("Post not found", 404);
  }
  return id;
}

// The unique {post, user} index makes this safe under concurrent requests:
// only the request that really created the record returns true.
async function addRecord(Model, post, user) {
  try {
    await Model.create({ post, user });
    return true;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
}

export const likePost = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  if (await addRecord(SafarLike, post, req.user._id)) {
    await SafarPost.updateOne({ _id: post }, { $inc: { likesCount: 1 } });
  }
  const { likesCount } = await SafarPost.findById(post).select("likesCount");
  res.status(200).json({ success: true, data: { likesCount, likedByMe: true } });
});

export const unlikePost = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  const { deletedCount } = await SafarLike.deleteOne({ post, user: req.user._id });
  if (deletedCount) {
    await SafarPost.updateOne(
      { _id: post, likesCount: { $gt: 0 } },
      { $inc: { likesCount: -1 } },
    );
  }
  const { likesCount } = await SafarPost.findById(post).select("likesCount");
  res.status(200).json({ success: true, data: { likesCount, likedByMe: false } });
});

export const savePost = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  await addRecord(SafarSave, post, req.user._id);
  res.status(200).json({ success: true, data: { savedByMe: true } });
});

export const unsavePost = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  await SafarSave.deleteOne({ post, user: req.user._id });
  res.status(200).json({ success: true, data: { savedByMe: false } });
});
