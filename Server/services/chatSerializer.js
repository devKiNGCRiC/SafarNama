import "../Models/userModel.js"; // populate() needs the User model registered
import ChatMessage from "../Models/chatMessageModel.js";
import { blockState } from "./chatRules.js";

export const USER_FIELDS = "username firstName lastName avatar";

export const populateConversation = (query) => query.populate("members.user", USER_FIELDS);

export const populateMessage = (query) => query.populate("sender", USER_FIELDS);

export function serializeMessage(doc) {
  const m = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: m._id,
    conversation: m.conversation,
    sender: m.sender || null,
    kind: m.kind,
    text: m.text,
    media: m.media || null,
    createdAt: m.createdAt,
  };
}

const idOf = (userLike) => String(userLike?._id ?? userLike);

// `convs` must have `members.user` populated (see populateConversation).
export async function serializeConversations(convs, meId, realtime) {
  const me = String(meId);

  return Promise.all(
    convs.map(async (conv) => {
      const c = typeof conv.toObject === "function" ? conv.toObject() : conv;
      const mine = c.members.find((m) => idOf(m.user) === me);

      const unreadCount = mine
        ? await ChatMessage.countDocuments({
            conversation: c._id,
            sender: { $ne: meId },
            kind: { $ne: "system" },
            createdAt: { $gt: mine.lastReadAt },
          })
        : 0;

      const json = {
        _id: c._id,
        type: c.type,
        name: c.name || null,
        avatar: c.avatar || null,
        members: c.members.map((m) => ({
          user: m.user,
          role: m.role,
          status: m.status,
          lastReadAt: m.lastReadAt, // lets clients show "Seen"
        })),
        lastMessage: c.lastMessage || null,
        unreadCount,
        isRequest: mine?.status === "pending",
        updatedAt: c.updatedAt,
      };

      if (c.type === "direct") {
        const partner = c.members.find((m) => idOf(m.user) !== me)?.user || null;
        json.partner = partner;
        if (partner) {
          const partnerId = idOf(partner);
          Object.assign(json, await blockState(meId, partnerId));
          json.online = realtime.onlineIds([partnerId]).includes(partnerId);
        }
      }
      return json;
    }),
  );
}
