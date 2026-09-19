import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import { CATEGORIES } from "../../Models/safargramPostModel.js";
import { parsePaging } from "../../utils/cursor.js";
import { listPosts } from "../../services/safargramFeed.js";
import {
  popularPosts,
  searchHashtags,
  searchPeople,
  searchPlaces,
  suggestedPeople,
} from "../../services/safargramExplore.js";

const TAG_OK = /^[\p{L}\p{M}\p{N}_]{1,50}$/u;

// No category: the popular grid. With a category: that category, newest first, paged.
export const getExplore = catchAsync(async (req, res) => {
  const { category } = req.query;
  if (category === undefined) {
    const { limit } = parsePaging(req.query, { defaultLimit: 30, max: 50 });
    const data = await popularPosts({ viewerId: req.user._id, limit });
    return res.status(200).json({ success: true, data, nextCursor: null });
  }
  if (!CATEGORIES.includes(category)) throw new AppError("Unknown category", 400);
  const { limit, cursor } = parsePaging(req.query, { defaultLimit: 12, max: 30 });
  const page = await listPosts({ filter: { category }, cursor, limit, viewerId: req.user._id });
  res.status(200).json({ success: true, ...page });
});

export const search = catchAsync(async (req, res) => {
  const type = req.query.type;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!["people", "hashtags", "places", "posts"].includes(type)) {
    throw new AppError("type must be people, hashtags, places or posts", 400);
  }
  if (q.length < 2) throw new AppError("Type at least 2 characters to search", 400);

  if (type === "people") {
    return res.status(200).json({ success: true, data: await searchPeople({ q, viewerId: req.user._id }) });
  }
  if (type === "hashtags") {
    const tag = q.replace(/^#/, "").toLowerCase();
    if (!TAG_OK.test(tag)) throw new AppError("Invalid hashtag", 400);
    return res.status(200).json({ success: true, data: await searchHashtags({ tag }) });
  }
  if (type === "places") {
    return res.status(200).json({ success: true, data: await searchPlaces({ q }) });
  }

  // posts: caption words, newest first, paged like the feed
  const { limit, cursor } = parsePaging(req.query);
  const page = await listPosts({
    filter: { $text: { $search: q } },
    cursor,
    limit,
    viewerId: req.user._id,
  });
  res.status(200).json({ success: true, ...page });
});

export const getSuggestedPeople = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: await suggestedPeople({ viewerId: req.user._id }) });
});
