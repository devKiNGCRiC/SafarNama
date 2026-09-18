import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import ChatConversation from "../../Models/chatConversationModel.js";
import ChatMessage from "../../Models/chatMessageModel.js";
import { cursorFilter, parsePaging, toPage } from "../../utils/cursor.js";
import { removeTempFiles } from "../../Middleware/safargramUpload.js";
import { blockState, PENDING_MESSAGE_LIMIT } from "../../services/chatRules.js";
import { populateMessage, serializeConversations, serializeMessage, populateConversation } from "../../services/chatSerializer.js";
import { conversationJsonFor, loadMemberConversation } from "../../services/chatAccess.js";

export function makeMessageController({ realtime, media }) {
  // Sending: REST does the work; sockets only push the result to everyone else.
  const sendMessage = catchAsync(async (req, res) => {
    const file = req.file;
    try {
      const { conv, mine } = await loadMemberConversation(req.params.id, req.user._id);
      const others = conv.members.filter((m) => String(m.user) !== String(req.user._id));

      if (mine.status === "pending") {
        throw new AppError("Accept the request before replying", 403);
      }

      if (conv.type === "direct") {
        const partner = others[0];
        const { blockedByMe, blockedMe } = await blockState(req.user._id, partner.user);
        if (blockedByMe || blockedMe) throw new AppError("You can't message this user", 403);

        if (partner.status === "pending") {
          const sent = await ChatMessage.countDocuments({ conversation: conv._id, sender: req.user._id });
          if (sent >= PENDING_MESSAGE_LIMIT) {
            throw new AppError("Wait for them to accept your request before sending more", 403);
          }
        }
      }

      const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
      if (text.length > 2000) throw new AppError("Messages can be at most 2000 characters", 400);
      if (!text && !file) throw new AppError("Write a message or add a photo", 400);

      let uploaded = null;
      if (file) {
        try {
          uploaded = await media.upload(file);
        } catch (error) {
          throw error instanceof AppError ? error : new AppError("Could not upload the photo. Please try again.", 502);
        }
      }

      let message;
      try {
        message = await ChatMessage.create({
          conversation: conv._id,
          sender: req.user._id,
          kind: uploaded ? "image" : "text",
          text,
          ...(uploaded
            ? { media: { url: uploaded.url, publicId: uploaded.publicId, width: uploaded.width, height: uploaded.height } }
            : {}),
        });
      } catch (error) {
        if (uploaded) await media.remove([uploaded]);
        throw error;
      }

      const now = new Date();
      await ChatConversation.updateOne(
        { _id: conv._id },
        {
          $set: {
            lastMessage: { text: text || "Photo", kind: message.kind, sender: req.user._id, at: message.createdAt },
            "members.$[me].lastReadAt": now, // sending implies you have read everything so far
          },
        },
        { arrayFilters: [{ "me.user": req.user._id }] },
      );

      const populated = await populateMessage(ChatMessage.findById(message._id));
      const json = serializeMessage(populated);

      // Push to everyone else, each with their own view of the conversation (unread etc.)
      const fresh = await populateConversation(ChatConversation.findById(conv._id));
      await Promise.all(
        others.map(async (m) => {
          const [conversation] = await serializeConversations([fresh], m.user, realtime);
          realtime.emitToUsers([m.user], "message:new", { message: json, conversation });
        }),
      );

      res.status(201).json({ success: true, data: json });
    } finally {
      if (file) await removeTempFiles([file]);
    }
  });

  const listMessages = catchAsync(async (req, res) => {
    const { conv } = await loadMemberConversation(req.params.id, req.user._id);
    const { limit, cursor } = parsePaging(req.query, { defaultLimit: 30, max: 50 });
    const rows = await populateMessage(
      ChatMessage.find({ conversation: conv._id, ...cursorFilter(cursor) })
        .sort({ _id: -1 })
        .limit(limit + 1),
    );
    const { page, nextCursor } = toPage(rows, limit);
    res.status(200).json({ success: true, data: page.map(serializeMessage), nextCursor });
  });

  const markRead = catchAsync(async (req, res) => {
    const { conv } = await loadMemberConversation(req.params.id, req.user._id);
    const at = new Date();
    await ChatConversation.updateOne(
      { _id: conv._id, "members.user": req.user._id },
      { $set: { "members.$.lastReadAt": at } },
    );

    const others = conv.members.filter((m) => String(m.user) !== String(req.user._id)).map((m) => m.user);
    realtime.emitToUsers(others, "message:read", {
      conversationId: String(conv._id),
      userId: String(req.user._id),
      at: at.toISOString(),
    });
    // My other tabs/devices refresh their unread badge from this.
    realtime.emitToUsers([req.user._id], "conversation:updated", {
      conversation: await conversationJsonFor(conv._id, req.user._id, realtime),
    });
    res.status(200).json({ success: true });
  });

  return { sendMessage, listMessages, markRead };
}
