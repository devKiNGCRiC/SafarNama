// Validation for the itinerary features. Only the fields listed here can ever be set by a client.
import mongoose from "mongoose";
import { INTEREST_NAMES, PACES } from "../services/itineraryGenerator.js";

const text = (value) => (typeof value === "string" ? value.trim() : undefined);
const isId = (value) => typeof value === "string" && mongoose.isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value);

export const LIMITS = { title: [3, 100], stops: 20, notes: 500, duration: 30, activitiesPerStop: 10, activity: 60, days: 14 };
export const DIFFICULTIES = ["EASY", "MODERATE", "CHALLENGING"];

// What the "Plan my trip" form may send.
export function parseGenerateInput(body = {}) {
  const errors = [];
  const days = Number(body.days);
  if (!Number.isInteger(days) || days < 1 || days > LIMITS.days) errors.push(`Choose between 1 and ${LIMITS.days} days`);

  let month = null;
  if (body.month !== undefined && body.month !== null && body.month !== "") {
    month = Number(body.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) errors.push("Month must be a number from 1 to 12");
  }

  const interests = [];
  if (body.interests !== undefined) {
    if (!Array.isArray(body.interests) || body.interests.length > INTEREST_NAMES.length) errors.push("Interests must be a short list");
    else {
      for (const item of body.interests) {
        if (!INTEREST_NAMES.includes(item)) {
          errors.push(`Unknown interest: ${String(item).slice(0, 30)}`);
          break;
        }
        if (!interests.includes(item)) interests.push(item);
      }
    }
  }

  const pace = body.pace === undefined ? "balanced" : body.pace;
  if (!Object.keys(PACES).includes(pace)) errors.push("Pace must be relaxed, balanced or packed");

  const region = body.region === undefined ? "" : text(body.region);
  if (region === undefined || region.length > 60) errors.push("Region can be at most 60 characters");

  return { data: { days, month, interests, pace, region: region || "" }, errors };
}

// A stop in an itinerary. Returns { stop } or { error }.
function parseStop(raw) {
  if (!raw || typeof raw !== "object") return { error: "Each stop must be a destination" };
  if (!isId(raw.destination)) return { error: "Each stop needs a valid destination" };
  const stop = { destination: raw.destination };

  if (raw.duration !== undefined) {
    const duration = text(raw.duration);
    if (duration === undefined || duration.length > LIMITS.duration) return { error: `A stop's duration can be at most ${LIMITS.duration} characters` };
    stop.duration = duration;
  }
  if (raw.notes !== undefined) {
    const notes = text(raw.notes);
    if (notes === undefined || notes.length > LIMITS.notes) return { error: `A stop's notes can be at most ${LIMITS.notes} characters` };
    stop.notes = notes;
  }
  if (raw.activities !== undefined) {
    if (!Array.isArray(raw.activities) || raw.activities.length > LIMITS.activitiesPerStop) return { error: `A stop can have at most ${LIMITS.activitiesPerStop} activities` };
    const activities = [];
    for (const a of raw.activities) {
      const name = text(a);
      if (!name || name.length > LIMITS.activity) return { error: `An activity must be 1 to ${LIMITS.activity} characters` };
      activities.push(name);
    }
    stop.activities = activities;
  }
  for (const key of ["startDay", "days"]) {
    if (raw[key] !== undefined) {
      const n = Number(raw[key]);
      if (!Number.isInteger(n) || n < 1 || n > 365) return { error: `A stop's ${key} must be a whole number` };
      stop[key] = n;
    }
  }
  return { stop };
}

// Create (`existing` = null) or update an itinerary. `isAdmin` decides whether "template" can be set.
export function parseItineraryInput(body = {}, { existing = null, isAdmin = false } = {}) {
  const errors = [];
  const data = {};
  const creating = existing === null;
  const has = (key) => body[key] !== undefined;

  if (creating || has("title")) {
    const title = text(body.title);
    if (!title || title.length < LIMITS.title[0] || title.length > LIMITS.title[1]) errors.push(`Name must be ${LIMITS.title[0]} to ${LIMITS.title[1]} characters`);
    else data.title = title;
  }

  if (creating || has("destinations")) {
    if (!Array.isArray(body.destinations) || body.destinations.length < 1 || body.destinations.length > LIMITS.stops) {
      errors.push(`An itinerary needs 1 to ${LIMITS.stops} destinations`);
    } else {
      const stops = [];
      for (const raw of body.destinations) {
        const { stop, error } = parseStop(raw);
        if (error) {
          errors.push(error);
          break;
        }
        stops.push(stop);
      }
      if (!errors.length) data.destinations = stops;
    }
  }

  if (has("totalDuration")) {
    const value = text(body.totalDuration);
    if (value === undefined || value.length > LIMITS.duration) errors.push("Total duration is too long");
    else data.totalDuration = value;
  }
  if (has("tripDays")) {
    const n = Number(body.tripDays);
    if (!Number.isInteger(n) || n < 1 || n > 365) errors.push("Trip days must be a whole number");
    else data.tripDays = n;
  }
  if (has("difficulty")) {
    if (!DIFFICULTIES.includes(body.difficulty)) errors.push("Difficulty must be EASY, MODERATE or CHALLENGING");
    else data.difficulty = body.difficulty;
  }
  if (has("generated")) data.generated = body.generated === true;
  if (isAdmin && has("isTemplate")) data.isTemplate = body.isTemplate === true;

  return { data, errors };
}
