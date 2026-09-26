// Display helpers for events. Pure functions (unit-tested in Node).

export const TYPE_LABELS = {
  FESTIVAL: "Festival",
  ACTIVITY: "Activity",
  WORKSHOP: "Workshop",
  CLEANUP: "Clean-up drive",
  OTHER: "Event",
};

// What the register button should do for this event.
//   ended -> registered -> full -> open   (the first that applies wins)
export function eventState(event) {
  if (event.isPast) return "ended";
  if (event.registeredByMe) return "registered";
  if (event.isFull) return "full";
  return "open";
}

export function spotsText(event) {
  if (event.capacity === null || event.capacity === undefined) return "Open registration";
  if (event.isFull) return "Full";
  if (event.spotsLeft === 1) return "1 spot left";
  return `${event.spotsLeft} spots left`;
}

const fmt = (date, options, timeZone) =>
  new Intl.DateTimeFormat("en-GB", { ...options, ...(timeZone ? { timeZone } : {}) }).format(new Date(date));

// "Sat, 12 Oct 2026 · 10:00 – 13:00"  or  "12 Oct 2026, 10:00 → 14 Oct 2026, 16:00"
export function formatDateRange(start, end, timeZone) {
  const dayOnly = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
  const timeOnly = { hour: "2-digit", minute: "2-digit", hour12: false };
  const full = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false };

  const sameDay = fmt(start, dayOnly, timeZone) === fmt(end, dayOnly, timeZone);
  if (sameDay) {
    return `${fmt(start, dayOnly, timeZone)} · ${fmt(start, timeOnly, timeZone)} – ${fmt(end, timeOnly, timeZone)}`;
  }
  return `${fmt(start, full, timeZone)} → ${fmt(end, full, timeZone)}`;
}

// { day: "12", month: "OCT" } for the little calendar badge on cards
export function dateBadge(date, timeZone) {
  return {
    day: fmt(date, { day: "numeric" }, timeZone),
    month: fmt(date, { month: "short" }, timeZone).toUpperCase(),
  };
}

const pad = (n) => String(n).padStart(2, "0");

// <input type="datetime-local"> works in local time without a zone
export function toInputValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromInputValue(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
