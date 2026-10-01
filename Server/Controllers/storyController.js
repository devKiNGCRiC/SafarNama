import "../Models/userModel.js"; // populate() needs it registered
import Story from "../Models/storyModel.js";
import ProfileModel from "../Models/profileModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { assertObjectId } from "../utils/cursor.js";
import { removeTempFiles } from "../Middleware/safargramUpload.js";

const person = (u) => (u ? { _id: u._id, username: u.username, avatar: u.avatar || "" } : null);
const hasViewed = (story, viewerId) => (story.viewers || []).some((v) => String(v.user?._id ?? v.user) === String(viewerId));

export function serializeStory(doc, viewerId) {
  const s = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: s._id,
    author: person(s.author),
    media: { type: s.media.type, url: s.media.url, width: s.media.width || null, height: s.media.height || null, duration: s.media.duration || null },
    caption: s.caption || "",
    viewerCount: (s.viewers || []).length,
    viewedByMe: hasViewed(s, viewerId),
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
  };
}

const withAuthor = (query) => query.populate("author", "username avatar");

// Cleans up a handful of expired stories' Cloudinary files. MongoDB's TTL index removes the rows
// on its own (usually within a minute of expiry), but it never calls application code, so the
// stored photo/video would otherwise be left behind forever. This runs opportunistically on the
// endpoints people actually hit, capped small so no request is slowed down noticeably.
async function cleanupExpired(media) {
  const stale = await Story.find({ expiresAt: { $lte: new Date() }, mediaCleaned: false }).limit(20).select("media");
  if (!stale.length) return;
  await media.remove(stale.map((s) => s.media));
  await Story.updateMany({ _id: { $in: stale.map((s) => s._id) } }, { $set: { mediaCleaned: true } });
}

async function followingIds(userId) {
  const profile = await ProfileModel.findOne({ user: userId }).select("following").lean();
  return (profile?.following || []).map(String);
}

export function makeStoryController({ media }) {
  const create = catchAsync(async (req, res) => {
    try {
      if (!req.file) throw new AppError("Please choose a photo or video to share", 400);
      const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
      if (caption.length > 200) throw new AppError("Caption can be at most 200 characters", 400);

      let uploaded;
      try {
        uploaded = await media.upload(req.file);
      } catch (error) {
        throw error instanceof AppError ? error : new AppError("Could not upload your story. Please try again.", 502);
      }

      let story;
      try {
        story = await Story.create({
          author: req.user._id,
          caption,
          media: { type: uploaded.type, url: uploaded.url, publicId: uploaded.publicId, width: uploaded.width, height: uploaded.height, duration: uploaded.duration },
        });
      } catch (error) {
        await media.remove([uploaded]);
        throw error;
      }

      cleanupExpired(media).catch(() => {}); // best-effort housekeeping, never blocks the response
      const populated = await withAuthor(Story.findById(story._id));
      res.status(201).json({ success: true, message: "Story shared", data: serializeStory(populated, req.user._id) });
    } finally {
      if (req.file) await removeTempFiles([req.file]);
    }
  });

  // Stories from people you follow, plus your own, newest-authored-group first, each as a
  // timeline the viewer can step through oldest-to-newest (the usual story-viewer order).
  const feed = catchAsync(async (req, res) => {
    await cleanupExpired(media).catch(() => {});
    const authors = [...new Set([...(await followingIds(req.user._id)), String(req.user._id)])];
    const rows = await withAuthor(Story.find({ author: { $in: authors }, expiresAt: { $gt: new Date() } }).sort({ author: 1, createdAt: 1 }));

    const groups = new Map();
    for (const row of rows) {
      const key = String(row.author._id);
      if (!groups.has(key)) groups.set(key, { author: person(row.author), stories: [], hasUnseen: false });
      const group = groups.get(key);
      group.stories.push(serializeStory(row, req.user._id));
      if (!hasViewed(row, req.user._id)) group.hasUnseen = true;
    }
    // your own stories first (so "Your story" always leads the ring), then everyone else,
    // unseen authors before already-seen ones
    const ordered = [...groups.values()].sort((a, b) => {
      if (String(a.author._id) === String(req.user._id)) return -1;
      if (String(b.author._id) === String(req.user._id)) return 1;
      return a.hasUnseen === b.hasUnseen ? 0 : a.hasUnseen ? -1 : 1;
    });
    res.status(200).json({ success: true, data: ordered });
  });

  const mine = catchAsync(async (req, res) => {
    const rows = await withAuthor(Story.find({ author: req.user._id, expiresAt: { $gt: new Date() } }).sort({ createdAt: 1 }));
    res.status(200).json({ success: true, data: rows.map((s) => serializeStory(s, req.user._id)) });
  });

  // Idempotent: watching the same story twice never creates a second viewer entry.
  const view = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "story id");
    const updated = await Story.findOneAndUpdate(
      { _id: id, expiresAt: { $gt: new Date() }, "viewers.user": { $ne: req.user._id } },
      { $push: { viewers: { user: req.user._id, viewedAt: new Date() } } },
      { new: true, projection: { viewers: 1 } },
    );
    if (!updated) {
      const exists = await Story.exists({ _id: id, expiresAt: { $gt: new Date() } });
      if (!exists) throw new AppError("Story not found", 404);
      // already viewed: fall through to report the current count
      const current = await Story.findById(id).select("viewers");
      return res.status(200).json({ success: true, data: { viewerCount: current.viewers.length, viewedByMe: true } });
    }
    res.status(200).json({ success: true, data: { viewerCount: updated.viewers.length, viewedByMe: true } });
  });

  // Only the author (or an admin) can see who watched - same privacy rule Instagram stories use.
  const viewers = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "story id");
    const story = await Story.findById(id).populate("viewers.user", "username avatar");
    if (!story) throw new AppError("Story not found", 404);
    if (String(story.author) !== String(req.user._id) && req.user.role !== "admin") {
      throw new AppError("Only the author can see who viewed this story", 403);
    }
    const list = [...story.viewers].reverse().map((v) => ({ user: person(v.user), viewedAt: v.viewedAt }));
    res.status(200).json({ success: true, data: list });
  });

  const remove = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "story id");
    const story = await Story.findById(id);
    if (!story) throw new AppError("Story not found", 404);
    if (String(story.author) !== String(req.user._id) && req.user.role !== "admin") {
      throw new AppError("Not authorized to delete this story", 403);
    }
    await story.deleteOne();
    if (!story.mediaCleaned) await media.remove([story.media]);
    res.status(200).json({ success: true, message: "Story deleted" });
  });

  return { create, feed, mine, view, viewers, remove };
}
