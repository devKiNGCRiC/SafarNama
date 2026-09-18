import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import UserModel from "../../Models/userModel.js";
import ChatBlock from "../../Models/chatBlockModel.js";
import ChatConversation from "../../Models/chatConversationModel.js";
import { assertObjectId } from "../../utils/cursor.js";
import { directKeyFor } from "../../services/chatRules.js";
import { USER_FIELDS } from "../../services/chatSerializer.js";
import { pushConversationUpdate } from "../../services/chatAccess.js";

export function makeBlockController({ realtime }) {
  // Let both people's open chat windows re-check whether they can still talk.
  async function refreshDirectChat(meId, otherId) {
    const conv = await ChatConversation.findOne({ directKey: directKeyFor(meId, otherId) }).select("_id");
    if (conv) await pushConversationUpdate(conv._id, realtime);
  }

  const listBlocks = catchAsync(async (req, res) => {
    const rows = await ChatBlock.find({ blocker: req.user._id })
      .sort({ _id: -1 })
      .populate("blocked", USER_FIELDS);
    res.status(200).json({ success: true, data: rows.map((r) => r.blocked).filter(Boolean) });
  });

  const blockUser = catchAsync(async (req, res) => {
    const otherId = assertObjectId(req.params.userId, "user id");
    if (otherId === String(req.user._id)) throw new AppError("You cannot block yourself", 400);
    if (!(await UserModel.exists({ _id: otherId }))) throw new AppError("User not found", 404);

    await ChatBlock.updateOne(
      { blocker: req.user._id, blocked: otherId },
      { $setOnInsert: { blocker: req.user._id, blocked: otherId } },
      { upsert: true },
    );
    await refreshDirectChat(req.user._id, otherId);
    res.status(200).json({ success: true, data: { blocked: true } });
  });

  const unblockUser = catchAsync(async (req, res) => {
    const otherId = assertObjectId(req.params.userId, "user id");
    await ChatBlock.deleteOne({ blocker: req.user._id, blocked: otherId });
    await refreshDirectChat(req.user._id, otherId);
    res.status(200).json({ success: true, data: { blocked: false } });
  });

  return { listBlocks, blockUser, unblockUser };
}
