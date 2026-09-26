import express from "express";
import rateLimit from "express-rate-limit";
import { makeSettingsController } from "../Controllers/settingsController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";

export const DEFAULT_SETTINGS_LIMITS = {
  // password change / sign-out-everywhere / deactivate: guessing the password here must not be easy
  sensitive: { windowMs: 15 * 60 * 1000, max: 10 },
};

// /api/v1/settings - everything here is about the logged-in person's own account.
export function createSettingsRouter({ limits = DEFAULT_SETTINGS_LIMITS } = {}) {
  const router = express.Router();
  const settings = makeSettingsController();

  const sensitive = rateLimit({
    ...limits.sensitive,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user._id), // runs after verifyToken
    message: { success: false, message: "Too many attempts. Please try again in a few minutes." },
  });

  router.use(verifyToken);
  router.get("/", settings.getSettings);
  router.put("/preferences", settings.updatePreferences);
  router.put("/password", sensitive, settings.changePassword);
  router.post("/sign-out-everywhere", sensitive, settings.signOutEverywhere);
  router.post("/deactivate", sensitive, settings.deactivate);

  return router;
}

export default createSettingsRouter();
