import express from "express";
import { verifyToken } from "../Middleware/authMiddleware.js";
import Notification from "../Models/notificationModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { assertObjectId, cursorFilter, parsePaging, toPage } from "../utils/cursor.js";
import { populateNotification, serializeNotification } from "../services/notifier.js";

// /api/v1/notifications - everything is scoped to the logged-in user.
export function createNotificationRouter() {
  const router = express.Router();
  router.use(verifyToken);

  // Newest first, 20 per page
  router.get(
    "/",
    catchAsync(async (req, res) => {
      const { limit, cursor } = parsePaging(req.query, { defaultLimit: 20, max: 50 });
      const rows = await populateNotification(
        Notification.find({ recipient: req.user._id, ...cursorFilter(cursor) })
          .sort({ _id: -1 })
          .limit(limit + 1),
      );
      const { page, nextCursor } = toPage(rows, limit);
      res.status(200).json({ success: true, data: page.map(serializeNotification), nextCursor });
    }),
  );

  router.get(
    "/unread-count",
    catchAsync(async (req, res) => {
      const total = await Notification.countDocuments({ recipient: req.user._id, readAt: null });
      res.status(200).json({ success: true, data: { total } });
    }),
  );

  router.post(
    "/read-all",
    catchAsync(async (req, res) => {
      await Notification.updateMany({ recipient: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
      res.status(200).json({ success: true });
    }),
  );

  router.post(
    "/:id/read",
    catchAsync(async (req, res) => {
      const id = assertObjectId(req.params.id, "notification id");
      const found = await Notification.findOneAndUpdate(
        { _id: id, recipient: req.user._id },
        { $set: { readAt: new Date() } },
      );
      if (!found) throw new AppError("Notification not found", 404);
      res.status(200).json({ success: true });
    }),
  );

  return router;
}

export default createNotificationRouter();
