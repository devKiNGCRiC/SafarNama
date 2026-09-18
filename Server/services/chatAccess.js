import AppError from "../utils/AppError.js";
import ChatConversation from "../Models/chatConversationModel.js";
import { assertObjectId } from "../utils/cursor.js";
import { populateConversation, serializeConversations } from "./chatSerializer.js";

// Loads a conversation and proves the user is a member (any status).
export async function loadMemberConversation(rawId, userId) {
  const id = assertObjectId(rawId, "conversation id");
  const conv = await ChatConversation.findById(id);
  if (!conv) throw new AppError("Conversation not found", 404);
  const mine = conv.members.find((m) => String(m.user) === String(userId));
  if (!mine) throw new AppError("You are not part of this conversation", 403);
  return { conv, mine };
}

// One conversation as `viewerId` should see it.
export async function conversationJsonFor(conversationId, viewerId, realtime) {
  const conv = await populateConversation(ChatConversation.findById(conversationId));
  const [json] = await serializeConversations([conv], viewerId, realtime);
  return json;
}

// Sends every member their own view of the conversation (unread, partner, ...).
export async function pushConversationUpdate(conversationId, realtime, event = "conversation:updated", extra = {}) {
  const conv = await populateConversation(ChatConversation.findById(conversationId));
  if (!conv) return;
  await Promise.all(
    conv.members.map(async (m) => {
      const [json] = await serializeConversations([conv], m.user._id, realtime);
      realtime.emitToUsers([m.user._id], event, { conversation: json, ...extra });
    }),
  );
}
