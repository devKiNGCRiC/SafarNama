import express from "express";
import { makeEventController } from "../Controllers/eventController.js";
import { verifyToken, isAdmin, optionalAuth } from "../Middleware/authMiddleware.js";
import { uploadEventImage } from "../Middleware/eventUpload.js";
import { createCloudinaryMediaService } from "../services/safargramMedia.js";

// /api/v1/events. `media` is injectable so tests can fake Cloudinary.
export function createEventRouter({
  media = createCloudinaryMediaService(undefined, { folder: "safarnama/events" }),
} = {}) {
  const router = express.Router();
  const events = makeEventController({ media });

  // Public (a valid login only adds "registeredByMe"; a bad token is ignored)
  router.get("/", optionalAuth, events.listEvents);

  // Fixed paths before '/:id'
  router.get("/mine", verifyToken, events.myEvents);
  router.post("/register/:id", verifyToken, events.register);
  router.delete("/register/:id", verifyToken, events.cancelRegistration);

  router.get("/:id", optionalAuth, events.getEvent);
  router.get("/:id/attendees", verifyToken, events.attendees);

  // Only admins create events; the organizer or any admin edits/deletes them
  router.post("/", verifyToken, isAdmin, uploadEventImage, events.createEvent);
  router.put("/:id", verifyToken, uploadEventImage, events.updateEvent);
  router.delete("/:id", verifyToken, events.deleteEvent);

  return router;
}

export default createEventRouter();
