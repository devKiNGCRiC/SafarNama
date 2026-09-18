import SafarPost from "../Models/safargramPostModel.js";
import SafarSave from "../Models/safargramSaveModel.js";
import Profile from "../Models/profileModel.js";
import { cursorFilter, toPage } from "../utils/cursor.js";
import { AUTHOR_FIELDS, populatePost, serializePosts } from "./safargramSerializer.js";

export async function listPosts({ filter = {}, cursor, limit, viewerId }) {
  const rows = await populatePost(
    SafarPost.find({ ...filter, ...cursorFilter(cursor) })
      .sort({ _id: -1 })
      .limit(limit + 1),
  );
  const { page, nextCursor } = toPage(rows, limit);
  return { data: await serializePosts(page, viewerId), nextCursor };
}

// The Bucket List pages over the *save* records (newest save first).
export async function listSaved({ userId, cursor, limit }) {
  const saves = await SafarSave.find({ user: userId, ...cursorFilter(cursor) })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate({
      path: "post",
      populate: [
        { path: "author", select: AUTHOR_FIELDS },
        { path: "destination", select: "name" },
      ],
    });
  const { page, nextCursor } = toPage(saves, limit);
  const posts = page.map((s) => s.post).filter(Boolean);
  return { data: await serializePosts(posts, userId), nextCursor };
}

// Users without a Profile document simply follow nobody.
export async function followingIds(userId) {
  const profile = await Profile.findOne({ user: userId }).select("following").lean();
  return profile?.following || [];
}
