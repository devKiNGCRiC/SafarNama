import SafarPost from "../Models/safargramPostModel.js";
import UserModel from "../Models/userModel.js";
import Destination from "../Models/destinationModel.js";
import ChatBlock from "../Models/chatBlockModel.js";
import { escapeRegex } from "../utils/regex.js";
import { followingIds } from "./safargramFeed.js";
import { AUTHOR_FIELDS, populatePost, serializePosts } from "./safargramSerializer.js";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const SEARCH_LIMIT = 20;
const SUGGESTION_LIMIT = 5;

// "Popular": the last 30 days ranked by likes + 2 x comments. If there are not enough
// recent posts, the grid is filled with the newest older ones so it is never empty.
export async function popularPosts({ viewerId, limit = 30, now = Date.now() }) {
  const since = new Date(now - WINDOW_MS);
  const top = await SafarPost.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $addFields: { score: { $add: ["$likesCount", { $multiply: ["$commentsCount", 2] }] } } },
    { $sort: { score: -1, _id: -1 } },
    { $limit: limit },
    { $project: { _id: 1 } },
  ]);
  let ids = top.map((t) => t._id);

  if (ids.length < limit) {
    const filler = await SafarPost.find({ _id: { $nin: ids } })
      .sort({ _id: -1 })
      .limit(limit - ids.length)
      .select("_id");
    ids = ids.concat(filler.map((f) => f._id));
  }

  const docs = await populatePost(SafarPost.find({ _id: { $in: ids } }));
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);
  return serializePosts(ordered, viewerId);
}

export async function searchPeople({ q, viewerId }) {
  const prefix = new RegExp(`^${escapeRegex(q)}`, "i");
  const blockers = await ChatBlock.find({ blocked: viewerId }).distinct("blocker");

  const users = await UserModel.find({
    $or: [{ username: prefix }, { firstName: prefix }, { lastName: prefix }],
    _id: { $ne: viewerId, $nin: blockers },
    active: { $ne: false },
  })
    .select(AUTHOR_FIELDS)
    .sort({ username: 1 })
    .limit(SEARCH_LIMIT)
    .lean();

  const following = new Set((await followingIds(viewerId)).map(String));
  return users.map((u) => ({ ...u, isFollowing: following.has(String(u._id)) }));
}

// `tag` must already be validated (letters/marks/digits/underscore, lowercase).
export async function searchHashtags({ tag }) {
  const rows = await SafarPost.aggregate([
    { $unwind: "$hashtags" },
    { $match: { hashtags: { $regex: `^${escapeRegex(tag)}` } } },
    { $group: { _id: "$hashtags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: SEARCH_LIMIT },
  ]);
  return rows.map((r) => ({ tag: r._id, count: r.count }));
}

export async function searchPlaces({ q }) {
  const places = await Destination.find({ name: new RegExp(escapeRegex(q), "i") })
    .select("name")
    .limit(SEARCH_LIMIT)
    .lean();
  if (places.length === 0) return [];

  const counts = await SafarPost.aggregate([
    { $match: { destination: { $in: places.map((p) => p._id) } } },
    { $group: { _id: "$destination", count: { $sum: 1 } } },
  ]);
  const countOf = new Map(counts.map((c) => [String(c._id), c.count]));
  return places
    .map((p) => ({ _id: p._id, name: p.name, count: countOf.get(String(p._id)) || 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Travellers with the most posts whom the viewer does not follow (and has no block with).
export async function suggestedPeople({ viewerId }) {
  const following = await followingIds(viewerId);
  const blocks = await ChatBlock.find({ $or: [{ blocker: viewerId }, { blocked: viewerId }] }).lean();
  const blockedIds = blocks.map((b) => (String(b.blocker) === String(viewerId) ? b.blocked : b.blocker));

  const top = await SafarPost.aggregate([
    { $match: { author: { $nin: [viewerId, ...following, ...blockedIds] } } },
    { $group: { _id: "$author", postsCount: { $sum: 1 }, latest: { $max: "$_id" } } },
    { $sort: { postsCount: -1, latest: -1 } },
    { $limit: SUGGESTION_LIMIT },
  ]);
  const users = await UserModel.find({ _id: { $in: top.map((t) => t._id) }, active: { $ne: false } })
    .select(AUTHOR_FIELDS)
    .lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  return top
    .map((t) => (byId.has(String(t._id)) ? { ...byId.get(String(t._id)), postsCount: t.postsCount } : null))
    .filter(Boolean);
}
