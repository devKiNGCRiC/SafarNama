import express from "express";
import rateLimit from "express-rate-limit";
import Subscriber from "../Models/subscriberModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// POST /api/v1/newsletter { email } - public, rate limited per visitor.
export function createNewsletterRouter({ limit = { windowMs: 60 * 60 * 1000, max: 10 } } = {}) {
  const router = express.Router();

  const limiter = rateLimit({
    ...limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many sign-ups. Please try again later." },
  });

  router.post(
    "/",
    limiter,
    catchAsync(async (req, res) => {
      const raw = req.body?.email;
      const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
      if (!email || email.length > 254 || !EMAIL.test(email)) {
        throw new AppError("Please enter a valid email address", 400);
      }

      // Upsert keeps this safe when two identical requests race
      const result = await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
      if (result.upsertedCount === 0) {
        return res.status(200).json({ success: true, message: "You are already subscribed. Thank you!" });
      }
      res.status(201).json({ success: true, message: "Thanks for subscribing!" });
    }),
  );

  return router;
}

export default createNewsletterRouter();
