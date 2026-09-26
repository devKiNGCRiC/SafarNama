import express from "express";
import rateLimit from "express-rate-limit";
import { makeReportController } from "../Controllers/reportController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";

export const DEFAULT_REPORT_LIMITS = {
  report: { windowMs: 60 * 60 * 1000, max: 20 }, // a person cannot flood the admins' queue
};

// /api/v1/reports - any logged-in person can report content that breaks the rules.
export function createReportRouter({ limits = DEFAULT_REPORT_LIMITS } = {}) {
  const router = express.Router();
  const reports = makeReportController();

  router.post(
    "/",
    verifyToken,
    rateLimit({
      ...limits.report,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => String(req.user._id),
      message: { success: false, message: "You are sending reports too fast. Please try again later." },
    }),
    reports.createReport,
  );

  return router;
}

export default createReportRouter();
