import rateLimit from "express-rate-limit";

export const DEFAULT_LIMITS = {
  createPost: { windowMs: 60 * 60 * 1000, max: 20 },
  comment: { windowMs: 10 * 60 * 1000, max: 30 },
  reaction: { windowMs: 10 * 60 * 1000, max: 200 },
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

export function createLimiters(limits = DEFAULT_LIMITS) {
  return {
    createPost: perUser(limits.createPost, "You are posting too fast. Please try again later."),
    comment: perUser(limits.comment, "You are commenting too fast. Please slow down."),
    reaction: perUser(limits.reaction, "Too many actions. Please slow down."),
  };
}
