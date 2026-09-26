import "../Models/userModel.js"; // populate() needs it registered
import EcoGuide, { GUIDE_CATEGORIES } from "../Models/ecoGuideModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { assertObjectId, cursorFilter, parsePaging, toPage } from "../utils/cursor.js";
import { escapeRegex } from "../utils/regex.js";
import { MAX_COMMENTS, parseGuideInput, readMinutes } from "../utils/ecoGuideInput.js";
import { removeTempFiles } from "../Middleware/safargramUpload.js";

const person = (u) => (u ? { _id: u._id, username: u.username, avatar: u.avatar || "" } : null);
const excerptOf = (g) => (g.summary || g.content.replace(/\s+/g, " ")).slice(0, 200);
const likedBy = (g, viewerId) => (viewerId ? (g.likes || []).some((id) => String(id) === String(viewerId)) : false);

// The list only carries a teaser, never the whole article.
export function serializeCard(doc, viewerId) {
  const g = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: g._id,
    title: g.title,
    category: g.category,
    excerpt: excerptOf(g),
    cover: g.images?.[0] || "",
    tags: g.tags || [],
    author: person(g.author),
    likeCount: (g.likes || []).length,
    commentCount: (g.comments || []).length,
    likedByMe: likedBy(g, viewerId),
    readMinutes: readMinutes(g.content),
    createdAt: g.createdAt,
  };
}

export const serializeComment = (c) => ({
  _id: c._id,
  content: c.content,
  createdAt: c.createdAt,
  user: person(c.user),
});

export function serializeGuide(doc, viewerId) {
  const g = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    ...serializeCard(g, viewerId),
    summary: g.summary || "",
    content: g.content,
    comments: (g.comments || []).map(serializeComment),
    updatedAt: g.updatedAt,
  };
}

const withAuthor = (query) => query.populate("author", "username avatar");
const withPeople = (query) => withAuthor(query).populate("comments.user", "username avatar");

async function loadGuide(rawId) {
  const id = assertObjectId(rawId, "guide id");
  const guide = await EcoGuide.findById(id);
  if (!guide) throw new AppError("Guide not found", 404);
  return guide;
}

export function makeEcoGuideController({ media }) {
  async function uploadCover(file) {
    if (!file) return null;
    try {
      return await media.upload(file);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Could not upload the cover photo. Please try again.", 502);
    }
  }

  const listGuides = catchAsync(async (req, res) => {
    const { category, tag, search } = req.query;
    if (category && category !== "ALL" && !GUIDE_CATEGORIES.includes(category)) {
      throw new AppError("Unknown guide category", 400);
    }
    const { limit, cursor } = parsePaging(req.query, { defaultLimit: 12, max: 30 });

    const filter = { ...cursorFilter(cursor) };
    if (category && category !== "ALL") filter.category = category;
    if (typeof tag === "string" && tag.trim()) filter.tags = tag.trim().toLowerCase();
    if (typeof search === "string" && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ title: rx }, { summary: rx }, { content: rx }, { tags: rx }];
    }

    const rows = await withAuthor(EcoGuide.find(filter).sort({ _id: -1 }).limit(limit + 1));
    const { page, nextCursor } = toPage(rows, limit);
    res.status(200).json({ success: true, data: page.map((g) => serializeCard(g, req.user?._id)), nextCursor });
  });

  const getGuide = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "guide id");
    const guide = await withPeople(EcoGuide.findById(id));
    if (!guide) throw new AppError("Guide not found", 404);
    res.status(200).json({ success: true, data: serializeGuide(guide, req.user?._id) });
  });

  const createGuide = catchAsync(async (req, res) => {
    try {
      const { data, errors } = parseGuideInput(req.body);
      if (errors.length) throw new AppError(errors[0], 400);

      const cover = await uploadCover(req.file);
      let guide;
      try {
        guide = await EcoGuide.create({
          ...data,
          author: req.user._id,
          ...(cover ? { images: [cover.url], imagePublicId: cover.publicId } : {}),
        });
      } catch (error) {
        if (cover) await media.remove([cover]);
        throw error;
      }
      const populated = await withPeople(EcoGuide.findById(guide._id));
      res.status(201).json({ success: true, message: "Guide published", data: serializeGuide(populated, req.user._id) });
    } finally {
      if (req.file) await removeTempFiles([req.file]);
    }
  });

  const updateGuide = catchAsync(async (req, res) => {
    try {
      const guide = await loadGuide(req.params.id);
      const { data, errors } = parseGuideInput(req.body, guide);
      if (errors.length) throw new AppError(errors[0], 400);

      const cover = await uploadCover(req.file);
      const oldCover = guide.imagePublicId;
      Object.assign(guide, data);
      if (cover) {
        guide.images = [cover.url];
        guide.imagePublicId = cover.publicId;
      }
      try {
        await guide.save();
      } catch (error) {
        if (cover) await media.remove([cover]);
        throw error;
      }
      if (cover && oldCover) await media.remove([{ type: "image", publicId: oldCover }]);

      const populated = await withPeople(EcoGuide.findById(guide._id));
      res.status(200).json({ success: true, message: "Guide updated", data: serializeGuide(populated, req.user._id) });
    } finally {
      if (req.file) await removeTempFiles([req.file]);
    }
  });

  const deleteGuide = catchAsync(async (req, res) => {
    const guide = await loadGuide(req.params.id);
    await guide.deleteOne();
    if (guide.imagePublicId) await media.remove([{ type: "image", publicId: guide.imagePublicId }]);
    res.status(200).json({ success: true, message: "Guide deleted" });
  });

  // $addToSet / $pull make liking idempotent and safe when many people like at once.
  async function setLike(req, res, liking) {
    const id = assertObjectId(req.params.id, "guide id");
    const guide = await EcoGuide.findByIdAndUpdate(
      id,
      liking ? { $addToSet: { likes: req.user._id } } : { $pull: { likes: req.user._id } },
      { new: true, projection: { likes: 1 } },
    );
    if (!guide) throw new AppError("Guide not found", 404);
    res.status(200).json({ success: true, data: { likeCount: guide.likes.length, likedByMe: liking } });
  }
  const like = catchAsync((req, res) => setLike(req, res, true));
  const unlike = catchAsync((req, res) => setLike(req, res, false));

  const addComment = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "guide id");
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 500) throw new AppError("A comment must be 1 to 500 characters", 400);

    // The size check and the push are one atomic update, so the cap holds under a rush.
    const updated = await EcoGuide.findOneAndUpdate(
      { _id: id, [`comments.${MAX_COMMENTS - 1}`]: { $exists: false } },
      { $push: { comments: { user: req.user._id, content } } },
      { new: true, projection: { comments: { $slice: -1 } } },
    );
    if (!updated) {
      if (!(await EcoGuide.exists({ _id: id }))) throw new AppError("Guide not found", 404);
      throw new AppError(`This guide already has ${MAX_COMMENTS} comments`, 400);
    }
    const saved = updated.comments[0];
    res.status(201).json({
      success: true,
      data: serializeComment({ ...saved.toObject(), user: req.user }),
    });
  });

  const deleteComment = catchAsync(async (req, res) => {
    const guide = await loadGuide(req.params.id);
    const commentId = assertObjectId(req.params.commentId, "comment id");
    const comment = guide.comments.id(commentId);
    if (!comment) throw new AppError("Comment not found", 404);
    if (req.user.role !== "admin" && String(comment.user) !== String(req.user._id)) {
      throw new AppError("Not authorized to delete this comment", 403);
    }
    await EcoGuide.updateOne({ _id: guide._id }, { $pull: { comments: { _id: commentId } } });
    res.status(200).json({ success: true, message: "Comment deleted" });
  });

  return { listGuides, getGuide, createGuide, updateGuide, deleteGuide, like, unlike, addComment, deleteComment };
}
