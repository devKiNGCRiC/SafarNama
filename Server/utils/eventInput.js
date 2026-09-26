// Validates and whitelists event fields from a request body (JSON or multipart).
// Only these fields can ever be set by a client - never organizer, registeredUsers, etc.

export const EVENT_TYPES = ["FESTIVAL", "ACTIVITY", "WORKSHOP", "CLEANUP", "OTHER"];

const text = (value) => (typeof value === "string" ? value.trim() : undefined);
const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// `existing` (a saved event) switches to "update" mode: only supplied fields are checked and
// the start/end order is verified against the values already stored.
export function parseEventInput(body = {}, existing = null) {
  const errors = [];
  const data = {};
  const creating = existing === null;
  const has = (key) => body[key] !== undefined;

  if (creating || has("title")) {
    const title = text(body.title);
    if (!title || title.length < 3 || title.length > 120) errors.push("Title must be 3 to 120 characters");
    else data.title = title;
  }

  if (creating || has("description")) {
    const description = text(body.description);
    if (!description || description.length < 10 || description.length > 2000) {
      errors.push("Description must be 10 to 2000 characters");
    } else data.description = description;
  }

  if (creating || has("type")) {
    const type = has("type") ? body.type : "OTHER";
    if (!EVENT_TYPES.includes(type)) errors.push("Unknown event type");
    else data.type = type;
  }

  if (has("venue")) {
    const venue = text(body.venue) ?? "";
    if (venue.length > 120) errors.push("Venue can be at most 120 characters");
    else data.venue = venue;
  }

  for (const key of ["startDate", "endDate"]) {
    if (creating || has(key)) {
      const date = has(key) ? toDate(body[key]) : null;
      if (!date) errors.push(`${key === "startDate" ? "Start" : "End"} date is not a valid date`);
      else data[key] = date;
    }
  }

  if (creating || has("capacity")) {
    const capacity = Number(body.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
      errors.push("Capacity must be a whole number between 1 and 100000");
    } else data.capacity = capacity;
  }

  if (has("impact")) {
    const impact = text(body.impact) ?? "";
    if (impact.length > 500) errors.push("The environmental impact note can be at most 500 characters");
    else data.sustainabilityImpact = { description: impact };
  }

  const start = data.startDate ?? existing?.startDate;
  const end = data.endDate ?? existing?.endDate;
  if (start && end && new Date(end) < new Date(start)) errors.push("The event cannot end before it starts");

  return { data, errors };
}
