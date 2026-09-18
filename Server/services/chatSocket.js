import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import UserModel from "../Models/userModel.js";
import ChatConversation from "../Models/chatConversationModel.js";

const OBJECT_ID = /^[a-f\d]{24}$/i;
const MAX_WATCH = 100;

// Live layer for chat. It only PUSHES events and relays typing/presence; every change to
// data goes through the REST API. Presence is an in-memory count of open sockets per user,
// so this supports a single server instance.
export function attachChatSocket(httpServer, { origins = [] } = {}) {
  const io = new Server(httpServer, { cors: { origin: origins, credentials: true } });
  const openSockets = new Map(); // userId -> number of connected sockets

  // Same checks as the REST verifyToken middleware.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await UserModel.findById(decoded.id).select("-password +active");
      if (
        !user ||
        !user.active ||
        user.accountStatus === "suspended" ||
        (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat))
      ) {
        return next(new Error("Unauthorized"));
      }
      socket.data.userId = String(user._id);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const me = socket.data.userId;
    socket.join(`user:${me}`);

    const count = (openSockets.get(me) || 0) + 1;
    openSockets.set(me, count);
    if (count === 1) io.to(`presence:${me}`).emit("presence", { userId: me, online: true });

    // Client asks to be told about these users' online status.
    socket.on("presence:watch", (payload) => {
      const ids = payload?.userIds;
      if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_WATCH) return;
      const valid = ids.filter((id) => typeof id === "string" && OBJECT_ID.test(id));
      valid.forEach((id) => socket.join(`presence:${id}`));
      socket.emit("presence:state", { online: valid.filter((id) => openSockets.has(id)) });
    });

    // Relay "typing…" to the other members of a conversation the sender belongs to.
    socket.on("typing", async (payload) => {
      try {
        const conversationId = payload?.conversationId;
        if (typeof conversationId !== "string" || !OBJECT_ID.test(conversationId)) return;
        const conv = await ChatConversation.findOne({
          _id: conversationId,
          members: { $elemMatch: { user: me } },
        }).select("members");
        if (!conv) return; // not a member: ignore silently

        const others = conv.members.map((m) => String(m.user)).filter((id) => id !== me);
        for (const id of others) {
          io.to(`user:${id}`).emit("typing", {
            conversationId,
            userId: me,
            isTyping: !!payload.isTyping,
          });
        }
      } catch {
        /* a failed relay must never crash the server */
      }
    });

    socket.on("disconnect", () => {
      const left = (openSockets.get(me) || 1) - 1;
      if (left <= 0) {
        openSockets.delete(me);
        io.to(`presence:${me}`).emit("presence", { userId: me, online: false });
      } else {
        openSockets.set(me, left);
      }
    });
  });

  return {
    io,
    emitToUsers(userIds, event, payload) {
      for (const id of userIds) io.to(`user:${String(id)}`).emit(event, payload);
    },
    onlineIds(ids) {
      return ids.map(String).filter((id) => openSockets.has(id));
    },
    close: () => new Promise((resolve) => io.close(resolve)),
  };
}
