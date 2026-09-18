import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import UserModel from "../../Models/userModel.js";
import ChatBlock from "../../Models/chatBlockModel.js";
import ChatConversation from "../../Models/chatConversationModel.js";
import ChatMessage from "../../Models/chatMessageModel.js";
import { assertObjectId } from "../../utils/cursor.js";
import { USER_FIELDS } from "../../services/chatSerializer.js";
import { conversationJsonFor, loadMemberConversation, pushConversationUpdate } from "../../services/chatAccess.js";
import { nameOf, postSystemMessage } from "../../services/chatSystem.js";

const MAX_MEMBERS = 50;

// Parse and de-duplicate an array of user ids from the request body.
function parseIds(raw, meId, label = "member id") {
  const list = Array.isArray(raw) ? raw : [];
  return [...new Set(list.map((id) => assertObjectId(id, label)))].filter((id) => id !== String(meId));
}

// Refuse if either side blocked the other (group invites must respect blocks).
async function assertNoBlocks(meId, otherIds) {
  const hit = await ChatBlock.exists({
    $or: [
      { blocker: meId, blocked: { $in: otherIds } },
      { blocker: { $in: otherIds }, blocked: meId },
    ],
  });
  if (hit) throw new AppError("You can't add someone you blocked or who blocked you", 403);
}

async function loadUsers(ids) {
  const users = await UserModel.find({ _id: { $in: ids } }).select(USER_FIELDS);
  if (users.length !== ids.length) throw new AppError("Some of those people were not found", 404);
  return users;
}

function requireGroupAdmin({ conv, mine }) {
  if (conv.type !== "group") throw new AppError("This is not a group chat", 400);
  if (mine.role !== "admin") throw new AppError("Only group admins can do that", 403);
}

export function makeGroupController({ realtime, media }) {
  const createGroup = catchAsync(async (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 50) throw new AppError("Group name must be 1 to 50 characters", 400);

    const memberIds = parseIds(req.body.memberIds, req.user._id);
    if (memberIds.length < 2 || memberIds.length + 1 > MAX_MEMBERS) {
      throw new AppError("A group needs between 3 and 50 people including you", 400);
    }
    await loadUsers(memberIds);
    await assertNoBlocks(req.user._id, memberIds);

    const conv = await ChatConversation.create({
      type: "group",
      name,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: "admin" }, ...memberIds.map((user) => ({ user }))],
    });
    await pushConversationUpdate(conv._id, realtime);
    await postSystemMessage(conv._id, `${nameOf(req.user)} created the group "${name}"`, realtime);
    res.status(201).json({ success: true, data: await conversationJsonFor(conv._id, req.user._id, realtime) });
  });

  const renameGroup = catchAsync(async (req, res) => {
    const access = await loadMemberConversation(req.params.id, req.user._id);
    requireGroupAdmin(access);
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 50) throw new AppError("Group name must be 1 to 50 characters", 400);

    await ChatConversation.updateOne({ _id: access.conv._id }, { $set: { name } });
    await postSystemMessage(access.conv._id, `${nameOf(req.user)} renamed the group to "${name}"`, realtime);
    res.status(200).json({ success: true, data: await conversationJsonFor(access.conv._id, req.user._id, realtime) });
  });

  const addMembers = catchAsync(async (req, res) => {
    const access = await loadMemberConversation(req.params.id, req.user._id);
    requireGroupAdmin(access);
    const { conv } = access;

    const existing = new Set(conv.members.map((m) => String(m.user)));
    const newIds = parseIds(req.body.userIds, req.user._id, "user id").filter((id) => !existing.has(id));
    if (newIds.length > 0) {
      if (conv.members.length + newIds.length > MAX_MEMBERS) {
        throw new AppError(`A group can have at most ${MAX_MEMBERS} members`, 400);
      }
      const users = await loadUsers(newIds);
      await assertNoBlocks(req.user._id, newIds);

      const now = new Date();
      await ChatConversation.updateOne(
        { _id: conv._id },
        {
          $push: {
            members: {
              $each: newIds.map((user) => ({ user, role: "member", status: "active", lastReadAt: now, joinedAt: now })),
            },
          },
        },
      );
      await postSystemMessage(conv._id, `${nameOf(req.user)} added ${users.map(nameOf).join(", ")}`, realtime);
    }
    res.status(200).json({ success: true, data: await conversationJsonFor(conv._id, req.user._id, realtime) });
  });

  // DELETE /conversations/:id/members/:userId - remove someone (admin) or leave (yourself)
  const removeMember = catchAsync(async (req, res) => {
    const access = await loadMemberConversation(req.params.id, req.user._id);
    const { conv, mine } = access;
    if (conv.type !== "group") throw new AppError("This is not a group chat", 400);

    const targetId = assertObjectId(req.params.userId, "user id");
    const isSelf = targetId === String(req.user._id);
    const target = conv.members.find((m) => String(m.user) === targetId);
    if (!target) throw new AppError("That person is not in this group", 404);
    if (!isSelf) {
      if (mine.role !== "admin") throw new AppError("Only group admins can remove members", 403);
      if (target.role === "admin") throw new AppError("Admins can only be removed by leaving", 403);
    }

    const targetUser = isSelf ? req.user : await UserModel.findById(targetId).select(USER_FIELDS);
    await ChatConversation.updateOne({ _id: conv._id }, { $pull: { members: { user: targetId } } });
    const fresh = await ChatConversation.findById(conv._id);

    // Nobody left: remove the chat, its messages and photos.
    if (fresh.members.length === 0) {
      const photos = await ChatMessage.find({ conversation: conv._id, media: { $exists: true } }).select("media");
      await Promise.all([ChatMessage.deleteMany({ conversation: conv._id }), fresh.deleteOne()]);
      await media.remove(photos.map((m) => ({ type: "image", publicId: m.media.publicId })));
      realtime.emitToUsers([targetId], "conversation:removed", { conversationId: String(conv._id) });
      return res.status(200).json({ success: true });
    }

    // Keep the group governed: promote the earliest-joined member if no admin remains.
    if (!fresh.members.some((m) => m.role === "admin")) {
      const next = [...fresh.members].sort((a, b) => a.joinedAt - b.joinedAt)[0];
      await ChatConversation.updateOne(
        { _id: conv._id },
        { $set: { "members.$[m].role": "admin" } },
        { arrayFilters: [{ "m.user": next.user }] },
      );
    }

    realtime.emitToUsers([targetId], "conversation:removed", { conversationId: String(conv._id) });
    await postSystemMessage(
      conv._id,
      isSelf ? `${nameOf(req.user)} left` : `${nameOf(req.user)} removed ${nameOf(targetUser)}`,
      realtime,
    );
    res.status(200).json({ success: true });
  });

  return { createGroup, renameGroup, addMembers, removeMember };
}
