import "../Models/userModel.js"; // populate() needs it registered
import ForumThread, { FORUM_CATEGORIES } from "../Models/forumThreadModel.js";
import ForumReply from "../Models/forumReplyModel.js";
import Notification from "../Models/notificationModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { assertObjectId, cursorFilter, parsePaging, toPage } from "../utils/cursor.js";
import { escapeRegex } from "../utils/regex.js";
import { parseReplyContent, parseThreadInput } from "../utils/forumInput.js";
import { notify, unnotify } from "../services/notifier.js";

const person = (u) => (u ? { _id: u._id, username: u.username, avatar: u.avatar || "" } : null);
const has = (list, id) => (id ? (list || []).some((x) => String(x) === String(id)) : false);
const excerptOf = (content) => content.replace(/\s+/g, " ").slice(0, 200);
const isAdmin = (user) => user.role === "admin";

// The list carries a teaser, never the whole post.
export function serializeThreadCard(doc, viewerId) {
  const t = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: t._id,
    title: t.title,
    category: t.category,
    excerpt: excerptOf(t.content),
    tags: t.tags || [],
    author: person(t.author),
    replyCount: t.replyCount || 0,
    likeCount: (t.likes || []).length,
    likedByMe: has(t.likes, viewerId),
    savedByMe: has(t.bookmarks, viewerId),
    isPinned: Boolean(t.pinned),
    isLocked: Boolean(t.locked),
    hasAcceptedAnswer: Boolean(t.acceptedReply),
    createdAt: t.createdAt,
    lastReplyAt: t.lastReplyAt || null,
  };
}

export function serializeThread(doc, viewerId) {
  const t = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    ...serializeThreadCard(t, viewerId),
    content: t.content,
    acceptedReplyId: t.acceptedReply || null,
    editedAt: t.editedAt || null,
  };
}

export function serializeReply(doc, thread, viewerId) {
  const r = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: r._id,
    threadId: r.thread,
    content: r.content,
    author: person(r.author),
    likeCount: (r.likes || []).length,
    likedByMe: has(r.likes, viewerId),
    isAccepted: Boolean(thread?.acceptedReply) && String(thread.acceptedReply) === String(r._id),
    createdAt: r.createdAt,
    editedAt: r.editedAt || null,
  };
}

const withAuthor = (query) => query.populate("author", "username avatar");

async function loadThread(rawId) {
  const id = assertObjectId(rawId, "thread id");
  const thread = await ForumThread.findById(id);
  if (!thread) throw new AppError("Thread not found", 404);
  return thread;
}
async function loadReply(rawId) {
  const id = assertObjectId(rawId, "reply id");
  const reply = await ForumReply.findById(id);
  if (!reply) throw new AppError("Reply not found", 404);
  return reply;
}

export function makeForumController() {
  // ---- threads ----------------------------------------------------------------------------
  const listThreads = catchAsync(async (req, res) => {
    const { category, tag, search, saved, mine } = req.query;
    if (category && category !== "ALL" && !FORUM_CATEGORIES.includes(category)) {
      throw new AppError("Unknown forum category", 400);
    }
    if ((saved || mine) && !req.user) throw new AppError("Please log in to see this list", 401);
    const { limit, cursor } = parsePaging(req.query, { defaultLimit: 15, max: 30 });

    const filter = {};
    if (category && category !== "ALL") filter.category = category;
    if (typeof tag === "string" && tag.trim()) filter.tags = tag.trim().toLowerCase();
    if (typeof search === "string" && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ title: rx }, { content: rx }, { tags: rx }];
    }
    if (saved) filter.bookmarks = req.user._id;
    if (mine) filter.author = req.user._id;

    // Pinned threads are shown first, on the first page only; everything else is paged by id.
    let pinned = [];
    if (!cursor) {
      pinned = await withAuthor(ForumThread.find({ ...filter, pinned: true }).sort({ _id: -1 }));
    }
    const rows = await withAuthor(
      ForumThread.find({ ...filter, pinned: { $ne: true }, ...cursorFilter(cursor) }).sort({ _id: -1 }).limit(limit + 1),
    );
    const { page, nextCursor } = toPage(rows, limit);
    res.status(200).json({
      success: true,
      data: [...pinned, ...page].map((t) => serializeThreadCard(t, req.user?._id)),
      nextCursor,
    });
  });

  const getThread = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "thread id");
    const thread = await withAuthor(ForumThread.findById(id));
    if (!thread) throw new AppError("Thread not found", 404);
    res.status(200).json({ success: true, data: serializeThread(thread, req.user?._id) });
  });

  const createThread = catchAsync(async (req, res) => {
    const { data, errors } = parseThreadInput(req.body);
    if (errors.length) throw new AppError(errors[0], 400);
    const thread = await ForumThread.create({ ...data, author: req.user._id });
    const populated = await withAuthor(ForumThread.findById(thread._id));
    res.status(201).json({ success: true, message: "Thread posted", data: serializeThread(populated, req.user._id) });
  });

  const updateThread = catchAsync(async (req, res) => {
    const thread = await loadThread(req.params.id);
    if (!isAdmin(req.user) && String(thread.author) !== String(req.user._id)) {
      throw new AppError("Not authorized to edit this thread", 403);
    }
    const { data, errors } = parseThreadInput(req.body, thread);
    if (errors.length) throw new AppError(errors[0], 400);

    Object.assign(thread, data, { editedAt: new Date() });
    await thread.save();
    const populated = await withAuthor(ForumThread.findById(thread._id));
    res.status(200).json({ success: true, data: serializeThread(populated, req.user._id) });
  });

  const deleteThread = catchAsync(async (req, res) => {
    const thread = await loadThread(req.params.id);
    if (!isAdmin(req.user) && String(thread.author) !== String(req.user._id)) {
      throw new AppError("Not authorized to delete this thread", 403);
    }
    await thread.deleteOne();
    await ForumReply.deleteMany({ thread: thread._id });
    await unnotify({ thread: thread._id });
    res.status(200).json({ success: true, message: "Thread deleted" });
  });

  // One helper for every "add me to / remove me from a list on the thread" switch. $addToSet and
  // $pull make these idempotent and safe when many people click at once.
  const setMembership = (field, resultKey, adding) =>
    catchAsync(async (req, res) => {
      const id = assertObjectId(req.params.id, "thread id");
      const thread = await ForumThread.findByIdAndUpdate(
        id,
        adding ? { $addToSet: { [field]: req.user._id } } : { $pull: { [field]: req.user._id } },
        { new: true, projection: { likes: 1, bookmarks: 1 } },
      );
      if (!thread) throw new AppError("Thread not found", 404);
      res.status(200).json({
        success: true,
        data: { likeCount: thread.likes.length, likedByMe: has(thread.likes, req.user._id), savedByMe: has(thread.bookmarks, req.user._id), [resultKey]: adding },
      });
    });

  // Admin moderation switches
  const setFlag = (field, value) =>
    catchAsync(async (req, res) => {
      const id = assertObjectId(req.params.id, "thread id");
      const thread = await ForumThread.findByIdAndUpdate(id, { $set: { [field]: value } }, { new: true, projection: { pinned: 1, locked: 1 } });
      if (!thread) throw new AppError("Thread not found", 404);
      res.status(200).json({ success: true, data: { isPinned: thread.pinned, isLocked: thread.locked } });
    });

  // ---- replies ----------------------------------------------------------------------------
  const listReplies = catchAsync(async (req, res) => {
    const thread = await loadThread(req.params.id);
    const { limit, cursor } = parsePaging(req.query, { defaultLimit: 20, max: 50 });
    // oldest first, so the cursor walks forwards
    const rows = await withAuthor(
      ForumReply.find({ thread: thread._id, ...(cursor ? { _id: { $gt: cursor } } : {}) }).sort({ _id: 1 }).limit(limit + 1),
    );
    const more = rows.length > limit;
    const page = more ? rows.slice(0, limit) : rows;
    res.status(200).json({
      success: true,
      data: page.map((r) => serializeReply(r, thread, req.user?._id)),
      nextCursor: more ? String(page[page.length - 1]._id) : null,
    });
  });

  const createReply = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "thread id");
    const { content, error } = parseReplyContent(req.body?.content);
    if (error) throw new AppError(error, 400);

    // Reserve the reply in the counter first; this fails for unknown or locked threads.
    const thread = await ForumThread.findOneAndUpdate(
      { _id: id, locked: { $ne: true } },
      { $inc: { replyCount: 1 }, $set: { lastReplyAt: new Date() } },
      { new: true, projection: { author: 1, title: 1 } },
    );
    if (!thread) {
      if (!(await ForumThread.exists({ _id: id }))) throw new AppError("Thread not found", 404);
      throw new AppError("This thread is locked and cannot take new replies", 403);
    }

    let reply;
    try {
      reply = await ForumReply.create({ thread: id, author: req.user._id, content });
    } catch (error2) {
      await ForumThread.updateOne({ _id: id }, { $inc: { replyCount: -1 } });
      throw error2;
    }

    await notify({ recipient: thread.author, actor: req.user._id, type: "reply", thread: id, reply: reply._id, text: content });
    const populated = await withAuthor(ForumReply.findById(reply._id));
    res.status(201).json({ success: true, data: serializeReply(populated, null, req.user._id) });
  });

  const updateReply = catchAsync(async (req, res) => {
    const reply = await loadReply(req.params.replyId);
    if (String(reply.author) !== String(req.user._id)) throw new AppError("Not authorized to edit this reply", 403);
    const { content, error } = parseReplyContent(req.body?.content);
    if (error) throw new AppError(error, 400);

    reply.content = content;
    reply.editedAt = new Date();
    await reply.save();
    const thread = await ForumThread.findById(reply.thread).select("acceptedReply");
    const populated = await withAuthor(ForumReply.findById(reply._id));
    res.status(200).json({ success: true, data: serializeReply(populated, thread, req.user._id) });
  });

  const deleteReply = catchAsync(async (req, res) => {
    const reply = await loadReply(req.params.replyId);
    const thread = await ForumThread.findById(reply.thread).select("author");
    const allowed =
      isAdmin(req.user) ||
      String(reply.author) === String(req.user._id) ||
      (thread && String(thread.author) === String(req.user._id)); // thread owners moderate their thread
    if (!allowed) throw new AppError("Not authorized to delete this reply", 403);

    await reply.deleteOne();
    await ForumThread.updateOne({ _id: reply.thread }, { $inc: { replyCount: -1 } });
    // if it was the accepted answer, the mark goes too
    await ForumThread.updateOne({ _id: reply.thread, acceptedReply: reply._id }, { $set: { acceptedReply: null } });
    await unnotify({ reply: reply._id });
    res.status(200).json({ success: true, message: "Reply deleted" });
  });

  const setReplyLike = (adding) =>
    catchAsync(async (req, res) => {
      const id = assertObjectId(req.params.replyId, "reply id");
      const reply = await ForumReply.findByIdAndUpdate(
        id,
        adding ? { $addToSet: { likes: req.user._id } } : { $pull: { likes: req.user._id } },
        { new: true, projection: { likes: 1 } },
      );
      if (!reply) throw new AppError("Reply not found", 404);
      res.status(200).json({ success: true, data: { likeCount: reply.likes.length, likedByMe: adding } });
    });

  // The person who asked (or an admin) marks the reply that solved it; one answer per thread.
  const acceptReply = catchAsync(async (req, res) => {
    const thread = await loadThread(req.params.id);
    if (!isAdmin(req.user) && String(thread.author) !== String(req.user._id)) {
      throw new AppError("Only the person who started the thread can choose the answer", 403);
    }
    const replyId = assertObjectId(req.params.replyId, "reply id");
    if (!(await ForumReply.exists({ _id: replyId, thread: thread._id }))) throw new AppError("Reply not found in this thread", 404);
    await ForumThread.updateOne({ _id: thread._id }, { $set: { acceptedReply: replyId } });
    res.status(200).json({ success: true, data: { acceptedReplyId: replyId } });
  });

  const clearAccepted = catchAsync(async (req, res) => {
    const thread = await loadThread(req.params.id);
    if (!isAdmin(req.user) && String(thread.author) !== String(req.user._id)) {
      throw new AppError("Only the person who started the thread can choose the answer", 403);
    }
    await ForumThread.updateOne({ _id: thread._id }, { $set: { acceptedReply: null } });
    res.status(200).json({ success: true, data: { acceptedReplyId: null } });
  });

  return {
    listThreads,
    getThread,
    createThread,
    updateThread,
    deleteThread,
    like: setMembership("likes", "liked", true),
    unlike: setMembership("likes", "liked", false),
    save: setMembership("bookmarks", "saved", true),
    unsave: setMembership("bookmarks", "saved", false),
    pin: setFlag("pinned", true),
    unpin: setFlag("pinned", false),
    lock: setFlag("locked", true),
    unlock: setFlag("locked", false),
    listReplies,
    createReply,
    updateReply,
    deleteReply,
    likeReply: setReplyLike(true),
    unlikeReply: setReplyLike(false),
    acceptReply,
    clearAccepted,
  };
}
