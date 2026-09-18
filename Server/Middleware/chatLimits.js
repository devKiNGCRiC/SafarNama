import rateLimit from "express-rate-limit";

export const DEFAULT_CHAT_LIMITS = {
  message: { windowMs: 60 * 1000, max: 60 },
  groupCreate: { windowMs: 60 * 60 * 1000, max: 10 },
};

const perUser = ({ windowMs, max }, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Must run after verifyToken so req.user exists.
    keyGenerator: (req) => String(req.user._id),
    message: { success: false, message },
  });

export function createChatLimiters(limits = DEFAULT_CHAT_LIMITS) {
  return {
    message: perUser(limits.message, "You are sending messages too fast. Please slow down."),
    groupCreate: perUser(limits.groupCreate, "You are creating groups too fast. Please try again later."),
  };
}
