import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import UserModel from "../../Models/userModel.js";
import ChatConversation from "../../Models/chatConversationModel.js";
import ChatMessage from "../../Models/chatMessageModel.js";
import ChatBlock from "../../Models/chatBlockModel.js";
import { assertObjectId } from "../../utils/cursor.js";
import { blockState, directKeyFor, initialStatusFor, usersAreConnected } from "../../services/chatRules.js";
import { populateConversation, serializeConversations } from "../../services/chatSerializer.js";
import {
  conversationJsonFor,
  loadMemberConversation,
  pushConversationUpdate,
} from "../../services/chatAccess.js";

// Inbox paging is by "last activity" (a date), not by _id.
function parseInboxPaging(query) {
  const limit = query.limit === undefined ? 20 : Number.parseInt(query.limit, 10);
  if (!Number.isInteger(limit) || limit < 1) throw new AppError("Invalid limit", 400);
  let before = null;
  if (query.cursor) {
    before = new Date(query.cursor);
    if (Number.isNaN(before.getTime())) throw new AppError("Invalid cursor", 400);
  }
  return { limit: Math.min(limit, 50), before };
}

export function makeConversationController({ realtime, media }) {
  const listInbox = catchAsync(async (req, res) => {
    const { limit, before } = parseInboxPaging(req.query);
    const filter = { members: { $elemMatch: { user: req.user._id, status: "active" } } };
    if (before) filter.updatedAt = { $lt: before };

    const rows = await populateConversation(
      ChatConversation.find(filter)
        .sort({ updatedAt: -1 })
        .limit(limit + 1),
    );
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const data = await serializeConversations(page, req.user._id, realtime);
    res.status(200).json({
      success: true,
      data,
      nextCursor: hasMore ? page[page.length - 1].updatedAt.toISOString() : null,
    });
  });

  const listRequests = catchAsync(async (req, res) => {
    const rows = await populateConversation(
      ChatConversation.find({ members: { $elemMatch: { user: req.user._id, status: "pending" } } })
        .sort({ updatedAt: -1 })
        .limit(50),
    );
    res.status(200).json({ success: true, data: await serializeConversations(rows, req.user._id, realtime) });
  });

  const startDirect = catchAsync(async (req, res) => {
    const otherId = assertObjectId(req.body.userId, "user id");
    if (otherId === String(req.user._id)) throw new AppError("You cannot chat with yourself", 400);
    if (!(await UserModel.exists({ _id: otherId }))) throw new AppError("User not found", 404);

    const { blockedByMe, blockedMe } = await blockState(req.user._id, otherId);
    if (blockedByMe || blockedMe) throw new AppError("You can't message this user", 403);

    const directKey = directKeyFor(req.user._id, otherId);
    let conv = await ChatConversation.findOne({ directKey });
    let created = false;

    if (!conv) {
      const connected = await usersAreConnected(req.user._id, otherId);
      try {
        conv = await ChatConversation.create({
          type: "direct",
          createdBy: req.user._id,
          directKey,
          members: [{ user: req.user._id }, { user: otherId, status: initialStatusFor(connected) }],
        });
        created = true;
      } catch (error) {
        if (error.code !== 11000) throw error; // lost a race with the other user: reuse theirs
        conv = await ChatConversation.findOne({ directKey });
      }
    }

    const data = await conversationJsonFor(conv._id, req.user._id, realtime);
    res.status(created ? 201 : 200).json({ success: true, data });
  });

  const getConversation = catchAsync(async (req, res) => {
    const { conv } = await loadMemberConversation(req.params.id, req.user._id);
    res.status(200).json({ success: true, data: await conversationJsonFor(conv._id, req.user._id, realtime) });
  });

  const acceptRequest = catchAsync(async (req, res) => {
    const { conv, mine } = await loadMemberConversation(req.params.id, req.user._id);
    if (mine.status !== "pending") throw new AppError("There is no pending request to accept", 400);

    await ChatConversation.updateOne(
      { _id: conv._id, "members.user": req.user._id },
      { $set: { "members.$.status": "active" } },
    );
    await pushConversationUpdate(conv._id, realtime);
    res.status(200).json({ success: true, data: await conversationJsonFor(conv._id, req.user._id, realtime) });
  });

  const declineRequest = catchAsync(async (req, res) => {
    const { conv, mine } = await loadMemberConversation(req.params.id, req.user._id);
    if (mine.status !== "pending") throw new AppError("There is no pending request to decline", 400);

    const others = conv.members.filter((m) => String(m.user) !== String(req.user._id)).map((m) => m.user);
    const withMedia = await ChatMessage.find({ conversation: conv._id, media: { $exists: true } }).select("media");

    await Promise.all([ChatMessage.deleteMany({ conversation: conv._id }), conv.deleteOne()]);
    await media.remove(withMedia.map((m) => ({ type: "image", publicId: m.media.publicId })));

    if (req.body?.block === true) {
      await Promise.all(
        others.map((blocked) =>
          ChatBlock.updateOne(
            { blocker: req.user._id, blocked },
            { $setOnInsert: { blocker: req.user._id, blocked } },
            { upsert: true },
          ),
        ),
      );
    }
    realtime.emitToUsers(others, "conversation:removed", { conversationId: String(conv._id) });
    res.status(200).json({ success: true, message: "Request declined" });
  });

  return { listInbox, listRequests, startDirect, getConversation, acceptRequest, declineRequest };
}
