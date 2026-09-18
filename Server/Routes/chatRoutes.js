import express from "express";
import { verifyToken } from "../Middleware/authMiddleware.js";
import { DEFAULT_CHAT_LIMITS, createChatLimiters } from "../Middleware/chatLimits.js";
import { createCloudinaryMediaService } from "../services/safargramMedia.js";
import { uploadChatImage } from "../Middleware/chatUpload.js";
import { makeConversationController } from "../Controllers/chat/conversationController.js";
import { makeMessageController } from "../Controllers/chat/messageController.js";
import { makeBlockController } from "../Controllers/chat/blockController.js";
import { makeGroupController } from "../Controllers/chat/groupController.js";
import { makeMetaController } from "../Controllers/chat/metaController.js";

// `realtime` = { emitToUsers(userIds, event, payload), onlineIds(ids) } from chatSocket.js
// (or a fake in tests). `media` and `limits` are injectable for the same reason.
export function createChatRouter({
  realtime,
  media = createCloudinaryMediaService(undefined, { folder: "safarnama/chat" }),
  limits = DEFAULT_CHAT_LIMITS,
}) {
  const router = express.Router();
  const limiters = createChatLimiters(limits);

  const conversations = makeConversationController({ realtime, media });
  const messages = makeMessageController({ realtime, media });
  const blocks = makeBlockController({ realtime });
  const groups = makeGroupController({ realtime, media });
  const meta = makeMetaController({ realtime });

  router.use(verifyToken);

  // fixed paths before '/conversations/:id'
  router.get("/conversations", conversations.listInbox);
  router.get("/conversations/requests", conversations.listRequests);
  router.post("/conversations/direct", conversations.startDirect);
  router.post("/conversations/group", limiters.groupCreate, groups.createGroup);
  router.get("/conversations/:id", conversations.getConversation);
  router.patch("/conversations/:id", groups.renameGroup);
  router.post("/conversations/:id/members", groups.addMembers);
  router.delete("/conversations/:id/members/:userId", groups.removeMember);
  router.post("/conversations/:id/accept", conversations.acceptRequest);
  router.delete("/conversations/:id/request", conversations.declineRequest);

  router.get("/conversations/:id/messages", messages.listMessages);
  router.post("/conversations/:id/messages", limiters.message, uploadChatImage, messages.sendMessage);
  router.post("/conversations/:id/read", messages.markRead);

  router.get("/blocks", blocks.listBlocks);
  router.post("/blocks/:userId", blocks.blockUser);
  router.delete("/blocks/:userId", blocks.unblockUser);

  router.get("/unread-count", meta.unreadCount);
  router.get("/users/search", meta.searchUsers);
  router.get("/presence", meta.presence);

  return router;
}
