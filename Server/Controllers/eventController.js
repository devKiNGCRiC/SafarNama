import "../Models/userModel.js"; // populate() needs it registered
import Event from "../Models/eventModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { assertObjectId } from "../utils/cursor.js";
import { escapeRegex } from "../utils/regex.js";
import { EVENT_TYPES, parseEventInput } from "../utils/eventInput.js";
import { removeTempFiles } from "../Middleware/safargramUpload.js";

// What the public gets to see: counts, never who registered (that is private).
export function serializeEvent(doc, viewerId, now = new Date()) {
  const e = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const registered = e.registeredUsers || [];
  const capacity = e.capacity ?? null;
  return {
    _id: e._id,
    title: e.title,
    type: e.type || "OTHER",
    description: e.description,
    venue: e.venue || "",
    startDate: e.startDate,
    endDate: e.endDate,
    images: e.images || [],
    capacity,
    registeredCount: registered.length,
    spotsLeft: capacity === null ? null : Math.max(0, capacity - registered.length),
    isFull: capacity !== null && registered.length >= capacity,
    isPast: new Date(e.endDate) < now,
    registeredByMe: viewerId ? registered.some((r) => String(r.user?._id ?? r.user) === String(viewerId)) : false,
    impact: e.sustainabilityImpact?.description || "",
    organizer: e.organizer ? { _id: e.organizer._id, username: e.organizer.username } : null,
    createdAt: e.createdAt,
  };
}

const withOrganizer = (query) => query.populate("organizer", "username");
const isManager = (event, user) =>
  user.role === "admin" || (event.organizer && String(event.organizer) === String(user._id));

async function loadEvent(rawId) {
  const id = assertObjectId(rawId, "event id");
  const event = await Event.findById(id);
  if (!event) throw new AppError("Event not found", 404);
  return event;
}

export function makeEventController({ media }) {
  // Uploads the optional cover; returns { url, publicId } or null.
  async function uploadCover(file) {
    if (!file) return null;
    try {
      return await media.upload(file);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Could not upload the cover photo. Please try again.", 502);
    }
  }

  const listEvents = catchAsync(async (req, res) => {
    const when = req.query.when ?? "upcoming";
    if (!["upcoming", "past", "all"].includes(when)) throw new AppError("when must be upcoming, past or all", 400);

    const { type, search } = req.query;
    if (type && type !== "ALL" && !EVENT_TYPES.includes(type)) throw new AppError("Unknown event type", 400);

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "60", 10) || 60, 1), 100);
    const now = new Date();
    const filter = {};
    if (when === "upcoming") filter.endDate = { $gte: now }; // ongoing events still count
    if (when === "past") filter.endDate = { $lt: now };
    if (type && type !== "ALL") filter.type = type;
    if (typeof search === "string" && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ title: rx }, { description: rx }, { venue: rx }];
    }

    const events = await withOrganizer(Event.find(filter).sort({ startDate: when === "upcoming" ? 1 : -1 }).limit(limit));
    res.status(200).json({ success: true, data: events.map((e) => serializeEvent(e, req.user?._id, now)) });
  });

  const getEvent = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "event id");
    const event = await withOrganizer(Event.findById(id));
    if (!event) throw new AppError("Event not found", 404);
    res.status(200).json({ success: true, data: serializeEvent(event, req.user?._id) });
  });

  const myEvents = catchAsync(async (req, res) => {
    const events = await withOrganizer(
      Event.find({ "registeredUsers.user": req.user._id }).sort({ startDate: 1 }),
    );
    res.status(200).json({ success: true, data: events.map((e) => serializeEvent(e, req.user._id)) });
  });

  const createEvent = catchAsync(async (req, res) => {
    try {
      const { data, errors } = parseEventInput(req.body);
      if (errors.length) throw new AppError(errors[0], 400);

      const cover = await uploadCover(req.file);
      let event;
      try {
        event = await Event.create({
          ...data,
          organizer: req.user._id,
          ...(cover ? { images: [cover.url], imagePublicId: cover.publicId } : {}),
        });
      } catch (error) {
        if (cover) await media.remove([cover]);
        throw error;
      }
      const populated = await withOrganizer(Event.findById(event._id));
      res.status(201).json({ success: true, message: "Event created", data: serializeEvent(populated, req.user._id) });
    } finally {
      if (req.file) await removeTempFiles([req.file]);
    }
  });

  const updateEvent = catchAsync(async (req, res) => {
    try {
      const event = await loadEvent(req.params.id);
      if (!isManager(event, req.user)) throw new AppError("Not authorized to update this event", 403);

      const { data, errors } = parseEventInput(req.body, event);
      if (errors.length) throw new AppError(errors[0], 400);
      if (data.capacity !== undefined && data.capacity < event.registeredUsers.length) {
        throw new AppError(
          `Capacity cannot be lower than the ${event.registeredUsers.length} people already registered`,
          400,
        );
      }

      const cover = await uploadCover(req.file);
      const oldCover = event.imagePublicId;
      Object.assign(event, data);
      if (cover) {
        event.images = [cover.url];
        event.imagePublicId = cover.publicId;
      }
      try {
        await event.save();
      } catch (error) {
        if (cover) await media.remove([cover]);
        throw error;
      }
      if (cover && oldCover) await media.remove([{ type: "image", publicId: oldCover }]);

      const populated = await withOrganizer(Event.findById(event._id));
      res.status(200).json({ success: true, message: "Event updated", data: serializeEvent(populated, req.user._id) });
    } finally {
      if (req.file) await removeTempFiles([req.file]);
    }
  });

  const deleteEvent = catchAsync(async (req, res) => {
    const event = await loadEvent(req.params.id);
    if (!isManager(event, req.user)) throw new AppError("Not authorized to delete this event", 403);
    await event.deleteOne();
    if (event.imagePublicId) await media.remove([{ type: "image", publicId: event.imagePublicId }]);
    res.status(200).json({ success: true, message: "Event deleted" });
  });

  // Registration is one atomic update, so two people signing up at the same moment can
  // never both take the last spot, and nobody can register twice.
  const register = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "event id");
    const now = new Date();
    const result = await Event.updateOne(
      {
        _id: id,
        endDate: { $gt: now },
        "registeredUsers.user": { $ne: req.user._id },
        $expr: { $lt: [{ $size: "$registeredUsers" }, { $ifNull: ["$capacity", 1000000000] }] },
      },
      { $push: { registeredUsers: { user: req.user._id, registrationDate: now } } },
    );

    if (result.modifiedCount === 0) {
      // work out why, to tell the user something useful
      const event = await Event.findById(id);
      if (!event) throw new AppError("Event not found", 404);
      if (event.endDate <= now) throw new AppError("This event has already ended", 400);
      if (event.registeredUsers.some((r) => String(r.user) === String(req.user._id))) {
        throw new AppError("You are already registered for this event", 400);
      }
      throw new AppError("Sorry, this event is full", 400);
    }

    const event = await withOrganizer(Event.findById(id));
    res.status(200).json({ success: true, message: "You are registered!", data: serializeEvent(event, req.user._id) });
  });

  const cancelRegistration = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "event id");
    await Event.updateOne({ _id: id }, { $pull: { registeredUsers: { user: req.user._id } } });
    res.status(200).json({ success: true, message: "Registration cancelled" });
  });

  const attendees = catchAsync(async (req, res) => {
    const event = await loadEvent(req.params.id);
    if (!isManager(event, req.user)) throw new AppError("Only the organizer or an admin can see the attendee list", 403);
    await event.populate("registeredUsers.user", "username firstName lastName email");
    const data = event.registeredUsers
      .filter((r) => r.user)
      .map((r) => ({
        _id: r.user._id,
        username: r.user.username,
        name: [r.user.firstName, r.user.lastName].filter(Boolean).join(" "),
        email: r.user.email,
        registeredAt: r.registrationDate,
      }));
    res.status(200).json({ success: true, data });
  });

  return { listEvents, getEvent, myEvents, createEvent, updateEvent, deleteEvent, register, cancelRegistration, attendees };
}
