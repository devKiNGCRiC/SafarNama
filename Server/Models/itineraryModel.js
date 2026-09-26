// itineraryModel.js
import mongoose from "mongoose";

const stopSchema = new mongoose.Schema(
  {
    destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", required: true },
    duration: { type: String, maxlength: 30 }, // "2 days"
    notes: { type: String, maxlength: 500 },
    activities: [{ type: String, maxlength: 60 }],
    startDay: { type: Number, min: 1 }, // set by the planner: which day of the trip this stop begins
    days: { type: Number, min: 1 },
  },
  { _id: true },
);

const itinerarySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Templates are curated by admins and shown to everyone; everything else is private to its creator.
    isTemplate: { type: Boolean, default: false },
    destinations: [stopSchema],
    totalDuration: String,
    tripDays: { type: Number, min: 1 },
    generated: { type: Boolean, default: false }, // started from "Plan my trip"
    difficulty: { type: String, enum: ["EASY", "MODERATE", "CHALLENGING"] },
    bestSeasons: [String],
    estimatedBudget: { amount: Number, currency: String },
    sustainabilityScore: { type: Number, min: 0, max: 5 },
  },
  { timestamps: true },
);

itinerarySchema.index({ creator: 1, _id: -1 });
itinerarySchema.index({ isTemplate: 1, _id: -1 });
itinerarySchema.index({ "destinations.destination": 1 });

const Itinerary = mongoose.models.Itinerary || mongoose.model("Itinerary", itinerarySchema);
export default Itinerary;
