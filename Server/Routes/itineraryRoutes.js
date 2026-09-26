// routes/itineraryRoutes.js
import express from "express";
import rateLimit from "express-rate-limit";
import { makeItineraryController } from "../Controllers/itineraryController.js";
import { verifyToken, isAdmin, optionalAuth } from "../Middleware/authMiddleware.js";

export const DEFAULT_ITINERARY_LIMITS = {
  general: { windowMs: 15 * 60 * 1000, max: 200 },
  generate: { windowMs: 15 * 60 * 1000, max: 30 }, // planning reads every destination, so it is limited harder
};

const limiter = (config, message) =>
  rateLimit({ ...config, standardHeaders: true, legacyHeaders: false, message: { success: false, message } });

// /api/v1/itineraries. `limits` is injectable so tests are not slowed by rate limits.
export function createItineraryRouter({ limits = DEFAULT_ITINERARY_LIMITS } = {}) {
  const router = express.Router();
  const itineraries = makeItineraryController();

  router.use(limiter(limits.general, "Too many requests. Please try again later."));

  // Public: the planner, its options, and admin-curated templates
  router.post("/generate", limiter(limits.generate, "You are planning too fast. Please try again in a few minutes."), itineraries.generate);
  router.get("/options", itineraries.options);
  router.get("/", itineraries.listTemplates);
  router.get("/destination/:destinationId", itineraries.byDestination);

  // Logged-in people: their own itineraries
  router.get("/user/:userId", verifyToken, itineraries.mine);
  router.post("/", verifyToken, itineraries.create);

  // Admin list of everything (fixed path, so it must come before "/:id")
  router.get("/admin/all", verifyToken, isAdmin, itineraries.listAll);
  router.delete("/admin/:id", verifyToken, isAdmin, itineraries.remove);

  // One itinerary: public templates, or your own (a bad token just means "logged out")
  router.get("/:id", optionalAuth, itineraries.getOne);
  router.put("/:id", verifyToken, itineraries.update);
  router.delete("/:id", verifyToken, itineraries.remove);

  return router;
}

export default createItineraryRouter();
