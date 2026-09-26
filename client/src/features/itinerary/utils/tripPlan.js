// The trip being edited on the itinerary page, as a list of "stops". Everything here is a pure
// function (tested in Node): the page only calls them and shows the result.

export const MAX_STOPS = 20;
export const MAX_ACTIVITIES = 10;
export const MAX_STOP_DAYS = 30;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const daysText = (n) => `${n} day${n === 1 ? "" : "s"}`;

// "2 days" / "1 day" / "3-4 days" / "" -> a whole number of days (at least 1)
export function parseDays(text) {
  const match = /\d+/.exec(String(text ?? ""));
  const n = match ? Number(match[0]) : 1;
  return Math.min(MAX_STOP_DAYS, Math.max(1, n));
}

let counter = 0;
const newKey = (id) => `${id}-${(counter += 1)}`; // stable keys for React lists even when a stop moves

// The planner's answer -> stops the person can edit.
export function planToStops(plan) {
  return (plan?.stops || []).map((stop) => ({
    key: newKey(stop.destination._id),
    destination: {
      _id: stop.destination._id,
      name: stop.destination.name,
      address: stop.destination.address || "",
      image: stop.destination.image || "",
    },
    days: stop.days,
    notes: stop.note || "",
    activities: [...(stop.activities || [])],
  }));
}

// A saved itinerary (from the server) -> stops. Stops whose destination was deleted are dropped.
export function itineraryToStops(itinerary) {
  return (itinerary?.destinations || [])
    .filter((entry) => entry.destination)
    .map((entry) => ({
      key: newKey(entry.destination._id),
      destination: {
        _id: entry.destination._id,
        name: entry.destination.name,
        address: entry.destination.address || "",
        image: entry.destination.images?.[0] || "",
      },
      days: entry.days || parseDays(entry.duration),
      notes: entry.notes || "",
      activities: [...(entry.activities || [])],
    }));
}

// A destination picked by hand -> a new stop.
export function newStop(destination) {
  return {
    key: newKey(destination._id),
    destination: {
      _id: destination._id,
      name: destination.name,
      address: destination.address || "",
      image: destination.images?.[0] || destination.image || "",
    },
    days: 1,
    notes: "",
    activities: [],
  };
}

export const totalDays = (stops) => stops.reduce((sum, s) => sum + s.days, 0);

// Moves a stop up (-1) or down (+1). Returns the same array when it cannot move.
export function moveStop(stops, index, delta) {
  const target = index + delta;
  if (index < 0 || index >= stops.length || target < 0 || target >= stops.length) return stops;
  const next = [...stops];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export const removeStop = (stops, index) => stops.filter((_, i) => i !== index);

export const updateStop = (stops, index, changes) => stops.map((s, i) => (i === index ? { ...s, ...changes } : s));

export const setStopDays = (stops, index, days) =>
  updateStop(stops, index, { days: Math.min(MAX_STOP_DAYS, Math.max(1, Math.round(Number(days)) || 1)) });

// Adds an activity to a stop (trimmed, no duplicates, at most MAX_ACTIVITIES).
export function addActivity(stops, index, name) {
  const value = String(name ?? "").trim().slice(0, 60);
  const stop = stops[index];
  if (!value || !stop || stop.activities.length >= MAX_ACTIVITIES) return stops;
  if (stop.activities.some((a) => a.toLowerCase() === value.toLowerCase())) return stops;
  return updateStop(stops, index, { activities: [...stop.activities, value] });
}

export const removeActivity = (stops, index, name) =>
  updateStop(stops, index, { activities: stops[index].activities.filter((a) => a !== name) });

// The day-by-day list shown next to the stops. It follows the stops, so it updates as they are edited.
export function buildDayList(stops) {
  const days = [];
  let day = 1;
  stops.forEach((stop, stopIndex) => {
    for (let i = 0; i < stop.days; i += 1) {
      const activities = stop.activities.slice(i * 2, i * 2 + 2);
      days.push({
        day,
        stopKey: stop.key,
        name: stop.destination.name,
        title: i === 0 ? (stopIndex === 0 ? `Arrive in ${stop.destination.name}` : `Travel to ${stop.destination.name}`) : `Explore ${stop.destination.name}`,
        activities: activities.length ? activities : [i === 0 ? "Settle in and explore on foot" : "Free day to explore"],
      });
      day += 1;
    }
  });
  return days;
}

// What to send to the server when saving.
export function tripToPayload({ title, stops, generated = false }) {
  let startDay = 1;
  const destinations = stops.map((stop) => {
    const entry = {
      destination: stop.destination._id,
      duration: daysText(stop.days),
      days: stop.days,
      startDay,
      notes: stop.notes.trim(),
      activities: stop.activities,
    };
    startDay += stop.days;
    return entry;
  });
  const total = totalDays(stops);
  return { title: title.trim(), destinations, tripDays: total, totalDuration: daysText(total), generated };
}

// What is wrong with the trip before saving (null = fine). The server checks again.
export function tripError({ title, stops }) {
  const t = (title || "").trim();
  if (t.length < 3) return "Give your trip a name (at least 3 characters)";
  if (t.length > 100) return "The trip name can be at most 100 characters";
  if (!stops.length) return "Add at least one destination";
  if (stops.length > MAX_STOPS) return `A trip can have at most ${MAX_STOPS} destinations`;
  if (stops.some((s) => s.notes.length > 500)) return "Notes can be at most 500 characters";
  return null;
}

// "Weekend in Auli"-style suggestion for the name box, from the first stop and length.
export function suggestTitle(stops) {
  if (!stops.length) return "";
  const days = totalDays(stops);
  const place = stops[0].destination.name;
  return stops.length === 1 ? `${daysText(days)} in ${place}` : `${daysText(days)}: ${place} and more`;
}
