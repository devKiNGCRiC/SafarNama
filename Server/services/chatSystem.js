import ChatConversation from "../Models/chatConversationModel.js";
import ChatMessage from "../Models/chatMessageModel.js";
import { populateConversation, serializeConversations, serializeMessage } from "./chatSerializer.js";

export const nameOf = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Someone";

// Records an event line ("Asha added Ravi") in the thread and pushes it live to every
// current member, each with their own view of the conversation.
export async function postSystemMessage(conversationId, text, realtime) {
  const message = await ChatMessage.create({
    conversation: conversationId,
    sender: null,
    kind: "system",
    text,
  });
  await ChatConversation.updateOne(
    { _id: conversationId },
    { $set: { lastMessage: { text, kind: "system", at: message.createdAt } } },
  );

  const conv = await populateConversation(ChatConversation.findById(conversationId));
  if (!conv) return message;
  const json = serializeMessage(message);
  await Promise.all(
    conv.members.map(async (m) => {
      const [conversation] = await serializeConversations([conv], m.user._id, realtime);
      realtime.emitToUsers([m.user._id], "message:new", { message: json, conversation });
    }),
  );
  return message;
}
