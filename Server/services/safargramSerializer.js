// Imported for their side effect: populate() needs these models registered even
// when only the SafarGram routes are loaded (e.g. in tests).
import "../Models/userModel.js";
import "../Models/destinationModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

export const AUTHOR_FIELDS = "username firstName lastName avatar";

export const populatePost = (query) =>
  query.populate("author", AUTHOR_FIELDS).populate("destination", "name");

// One `$in` query per flag for the whole page (no per-post queries).
export async function serializePosts(posts, viewerId) {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p._id);
  const [likes, saves] = await Promise.all([
    SafarLike.find({ user: viewerId, post: { $in: ids } }).select("post").lean(),
    SafarSave.find({ user: viewerId, post: { $in: ids } }).select("post").lean(),
  ]);
  const liked = new Set(likes.map((l) => String(l.post)));
  const saved = new Set(saves.map((s) => String(s.post)));

  return posts.map((post) => {
    const o = typeof post.toObject === "function" ? post.toObject() : post;
    return {
      _id: o._id,
      author: o.author,
      media: o.media,
      caption: o.caption,
      hashtags: o.hashtags,
      category: o.category,
      destination: o.destination || null,
      likesCount: o.likesCount,
      commentsCount: o.commentsCount,
      likedByMe: liked.has(String(o._id)),
      savedByMe: saved.has(String(o._id)),
      createdAt: o.createdAt,
    };
  });
}
