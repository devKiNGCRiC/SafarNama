// controllers/itineraryController.js
import "../Models/userModel.js"; // populate() needs it registered
import Itinerary from "../Models/itineraryModel.js";
import Destination from "../Models/destinationModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { assertObjectId } from "../utils/cursor.js";
import { generateItinerary, INTEREST_NAMES, PACES } from "../services/itineraryGenerator.js";
import { parseGenerateInput, parseItineraryInput } from "../utils/itineraryInput.js";

export const MAX_ITINERARIES_PER_PERSON = 100;

const STOP_FIELDS = "name images address category";
const withDetails = (query) => query.populate("destinations.destination", STOP_FIELDS).populate("creator", "username");

const PLANNER_FIELDS =
  "name address images category rating featured activities location bestTimeToVisit seasonality.peakSeason.months seasonality.offSeason.months";

const isOwner = (itinerary, user) => Boolean(user) && itinerary.creator && String(itinerary.creator._id ?? itinerary.creator) === String(user._id);
const canSee = (itinerary, user) => itinerary.isTemplate || isOwner(itinerary, user) || user?.role === "admin";

async function assertDestinationsExist(stops) {
  const ids = [...new Set(stops.map((s) => String(s.destination)))];
  if ((await Destination.countDocuments({ _id: { $in: ids } })) !== ids.length) {
    throw new AppError("One of the destinations does not exist (any more)", 400);
  }
}

export const makeItineraryController = () => ({
  // "Plan my trip": nothing is saved; the visitor gets a plan they can edit and save.
  generate: catchAsync(async (req, res) => {
    const { data, errors } = parseGenerateInput(req.body);
    if (errors.length) throw new AppError(errors[0], 400);

    const destinations = await Destination.find({}).select(PLANNER_FIELDS).lean();
    const { plan, error } = generateItinerary(destinations, data);
    if (error) throw new AppError(error, 404);
    res.status(200).json({ success: true, data: plan });
  }),

  // What the "Plan my trip" form can offer (kept here so the page never drifts from the rules)
  options: catchAsync(async (req, res) => {
    res.status(200).json({ success: true, data: { interests: INTEREST_NAMES, paces: Object.keys(PACES), maxDays: 14 } });
  }),

  // Curated templates: public. Everyone else's itineraries are private.
  listTemplates: catchAsync(async (req, res) => {
    const rows = await withDetails(Itinerary.find({ isTemplate: true }).sort({ _id: -1 }).limit(50));
    res.status(200).json({ success: true, data: rows });
  }),

  listAll: catchAsync(async (req, res) => {
    const rows = await withDetails(Itinerary.find().sort({ _id: -1 }).limit(200));
    res.status(200).json({ success: true, data: rows });
  }),

  getOne: catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "itinerary id");
    const itinerary = await withDetails(Itinerary.findById(id));
    // someone else's private itinerary looks exactly like one that does not exist
    if (!itinerary || !canSee(itinerary, req.user)) throw new AppError("Itinerary not found", 404);
    res.status(200).json({ success: true, data: itinerary });
  }),

  byDestination: catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.destinationId, "destination id");
    const rows = await withDetails(Itinerary.find({ isTemplate: true, "destinations.destination": id }).sort({ _id: -1 }).limit(50));
    res.status(200).json({ success: true, data: rows });
  }),

  mine: catchAsync(async (req, res) => {
    const userId = assertObjectId(req.params.userId, "user id");
    if (userId !== String(req.user._id) && req.user.role !== "admin") {
      throw new AppError("You can only view your own itineraries", 403);
    }
    const rows = await withDetails(Itinerary.find({ creator: userId }).sort({ _id: -1 }).limit(MAX_ITINERARIES_PER_PERSON));
    res.status(200).json({ success: true, data: rows });
  }),

  create: catchAsync(async (req, res) => {
    const { data, errors } = parseItineraryInput(req.body, { isAdmin: req.user.role === "admin" });
    if (errors.length) throw new AppError(errors[0], 400);
    if ((await Itinerary.countDocuments({ creator: req.user._id })) >= MAX_ITINERARIES_PER_PERSON) {
      throw new AppError(`You can keep up to ${MAX_ITINERARIES_PER_PERSON} itineraries. Delete some to add more.`, 400);
    }
    await assertDestinationsExist(data.destinations);

    const saved = await Itinerary.create({ ...data, creator: req.user._id });
    const populated = await withDetails(Itinerary.findById(saved._id));
    res.status(201).json({ success: true, message: "Itinerary created successfully", data: populated });
  }),

  update: catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "itinerary id");
    const itinerary = await Itinerary.findById(id);
    if (!itinerary) throw new AppError("Itinerary not found", 404);
    if (!isOwner(itinerary, req.user) && req.user.role !== "admin") throw new AppError("You can only update your own itineraries", 403);

    const { data, errors } = parseItineraryInput(req.body, { existing: itinerary, isAdmin: req.user.role === "admin" });
    if (errors.length) throw new AppError(errors[0], 400);
    if (data.destinations) await assertDestinationsExist(data.destinations);

    Object.assign(itinerary, data); // only whitelisted fields; creator can never change
    await itinerary.save();
    const populated = await withDetails(Itinerary.findById(itinerary._id));
    res.status(200).json({ success: true, message: "Successfully updated itinerary", data: populated });
  }),

  remove: catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "itinerary id");
    const itinerary = await Itinerary.findById(id);
    if (!itinerary) throw new AppError("Itinerary not found", 404);
    if (!isOwner(itinerary, req.user) && req.user.role !== "admin") throw new AppError("You can only delete your own itineraries", 403);
    await itinerary.deleteOne();
    res.status(200).json({ success: true, message: "Successfully deleted itinerary" });
  }),
});
