import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import UserModel from "../../Models/userModel.js";
import ChatBlock from "../../Models/chatBlockModel.js";
import ChatConversation from "../../Models/chatConversationModel.js";
import ChatMessage from "../../Models/chatMessageModel.js";
import { assertObjectId } from "../../utils/cursor.js";
import { USER_FIELDS } from "../../services/chatSerializer.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function makeMetaController({ realtime }) {
  // Total unread messages across my active chats (requests do not count).
  const unreadCount = catchAsync(async (req, res) => {
    const convs = await ChatConversation.find({
      members: { $elemMatch: { user: req.user._id, status: "active" } },
    }).select("members");

    const counts = await Promise.all(
      convs.map((conv) => {
        const mine = conv.members.find((m) => String(m.user) === String(req.user._id));
        return ChatMessage.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          kind: { $ne: "system" },
          createdAt: { $gt: mine.lastReadAt },
        });
      }),
    );
    res.status(200).json({ success: true, data: { total: counts.reduce((a, b) => a + b, 0) } });
  });

  const searchUsers = catchAsync(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) throw new AppError("Type at least 2 characters to search", 400);

    const blockers = await ChatBlock.find({ blocked: req.user._id }).distinct("blocker");
    const users = await UserModel.find({
      username: { $regex: `^${escapeRegex(q)}`, $options: "i" },
      _id: { $ne: req.user._id, $nin: blockers },
      active: { $ne: false },
    })
      .select(USER_FIELDS)
      .sort({ username: 1 })
      .limit(10);
    res.status(200).json({ success: true, data: users });
  });

  const presence = catchAsync(async (req, res) => {
    const raw = typeof req.query.ids === "string" ? req.query.ids : "";
    const ids = raw.split(",").filter(Boolean);
    if (ids.length === 0 || ids.length > 100) throw new AppError("Provide between 1 and 100 user ids", 400);
    ids.forEach((id) => assertObjectId(id, "user id"));
    res.status(200).json({ success: true, data: { online: realtime.onlineIds(ids) } });
  });

  return { unreadCount, searchUsers, presence };
}
