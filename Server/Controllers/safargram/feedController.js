import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import UserModel from "../../Models/userModel.js";
import { assertObjectId, parsePaging } from "../../utils/cursor.js";
import { followingIds, listPosts, listSaved } from "../../services/safargramFeed.js";
import { getTrending as loadTrending } from "../../services/safargramTrending.js";

const send = (res, { data, nextCursor }) =>
  res.status(200).json({ success: true, data, nextCursor });

export const getFeed = catchAsync(async (req, res) => {
  const tab = req.query.tab ?? "discover";
  if (tab !== "discover" && tab !== "following") {
    throw new AppError("tab must be 'discover' or 'following'", 400);
  }
  const { limit, cursor } = parsePaging(req.query);
  const filter = tab === "following" ? { author: { $in: await followingIds(req.user._id) } } : {};
  send(res, await listPosts({ filter, cursor, limit, viewerId: req.user._id }));
});

export const getUserPosts = catchAsync(async (req, res) => {
  const { limit, cursor } = parsePaging(req.query);
  const user = await UserModel.findOne({ username: String(req.params.username) }).select("_id");
  if (!user) throw new AppError("User not found", 404);
  send(res, await listPosts({ filter: { author: user._id }, cursor, limit, viewerId: req.user._id }));
});

export const getHashtagPosts = catchAsync(async (req, res) => {
  const tag = String(req.params.tag).replace(/^#/, "").toLowerCase();
  if (!/^[\p{L}\p{M}\p{N}_]{1,50}$/u.test(tag)) throw new AppError("Invalid hashtag", 400);
  const { limit, cursor } = parsePaging(req.query);
  send(res, await listPosts({ filter: { hashtags: tag }, cursor, limit, viewerId: req.user._id }));
});

export const getDestinationPosts = catchAsync(async (req, res) => {
  const destination = assertObjectId(req.params.id, "destination id");
  const { limit, cursor } = parsePaging(req.query);
  send(res, await listPosts({ filter: { destination }, cursor, limit, viewerId: req.user._id }));
});

export const getSaved = catchAsync(async (req, res) => {
  const { limit, cursor } = parsePaging(req.query);
  send(res, await listSaved({ userId: req.user._id, cursor, limit }));
});

export const getTrending = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: await loadTrending() });
});
