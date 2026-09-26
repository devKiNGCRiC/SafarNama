import Report, { REPORT_REASONS, REPORT_TYPES } from "../Models/reportModel.js";
import ForumThread from "../Models/forumThreadModel.js";
import ForumReply from "../Models/forumReplyModel.js";
import GalleryPhoto from "../Models/galleryPhotoModel.js";
import SafarPost from "../Models/safargramPostModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { assertObjectId } from "../utils/cursor.js";

const teaser = (text = "") => String(text).replace(/\s+/g, " ").trim().slice(0, 200);

// For each kind of reportable content: how to find it, who owns it, what to remember about
// it, and where an admin can look at it.
const TARGETS = {
  FORUM_THREAD: {
    find: (id) => ForumThread.findById(id).select("author title"),
    owner: (d) => d.author,
    snapshot: (d) => ({ text: teaser(d.title), image: "" }),
    link: (d) => `/forum/${d._id}`,
  },
  FORUM_REPLY: {
    find: (id) => ForumReply.findById(id).select("author content thread"),
    owner: (d) => d.author,
    snapshot: (d) => ({ text: teaser(d.content), image: "" }),
    link: (d) => `/forum/${d.thread}#reply-${d._id}`,
  },
  GALLERY_PHOTO: {
    find: (id) => GalleryPhoto.findById(id).select("owner caption url"),
    owner: (d) => d.owner,
    snapshot: (d) => ({ text: teaser(d.caption) || "(photo)", image: d.url }),
    link: (d) => `/gallery/${d._id}`,
  },
  SAFARGRAM_POST: {
    find: (id) => SafarPost.findById(id).select("author caption media"),
    owner: (d) => d.author,
    snapshot: (d) => ({ text: teaser(d.caption) || "(post)", image: d.media?.[0]?.url || "" }),
    link: (d) => `/safargram/post/${d._id}`,
  },
};

export function makeReportController() {
  const createReport = catchAsync(async (req, res) => {
    const { type, targetId, reason } = req.body ?? {};
    if (!REPORT_TYPES.includes(type)) throw new AppError("Unknown kind of content", 400);
    assertObjectId(typeof targetId === "string" ? targetId : "", "content id");
    if (!REPORT_REASONS.includes(reason)) throw new AppError("Please choose a reason for the report", 400);
    const details = typeof req.body.details === "string" ? req.body.details.trim() : "";
    if (details.length > 300) throw new AppError("Details can be at most 300 characters", 400);

    const target = TARGETS[type];
    const doc = await target.find(targetId);
    if (!doc) throw new AppError("That content no longer exists", 404);
    const owner = target.owner(doc);
    if (owner && String(owner) === String(req.user._id)) throw new AppError("You cannot report your own content", 400);

    try {
      await Report.create({
        reporter: req.user._id,
        targetType: type,
        targetId,
        targetOwner: owner,
        snapshot: target.snapshot(doc),
        link: target.link(doc),
        reason,
        details,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(200).json({ success: true, message: "You have already reported this. Thank you!" });
      }
      throw error;
    }
    res.status(201).json({ success: true, message: "Thank you. Our team will take a look." });
  });

  return { createReport };
}
