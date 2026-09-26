import { test } from "node:test";
import assert from "node:assert/strict";
import { dateBadge, eventState, formatDateRange, fromInputValue, spotsText, toInputValue } from "./eventFormat.js";

test("eventState picks ended, registered, full, then open", () => {
  assert.equal(eventState({ isPast: true, registeredByMe: true, isFull: true }), "ended");
  assert.equal(eventState({ isPast: false, registeredByMe: true, isFull: true }), "registered");
  assert.equal(eventState({ isPast: false, registeredByMe: false, isFull: true }), "full");
  assert.equal(eventState({ isPast: false, registeredByMe: false, isFull: false }), "open");
});

test("spotsText handles unlimited, full, one and many spots (never 'NaN')", () => {
  assert.equal(spotsText({ capacity: null }), "Open registration");
  assert.equal(spotsText({}), "Open registration");
  assert.equal(spotsText({ capacity: 10, isFull: true, spotsLeft: 0 }), "Full");
  assert.equal(spotsText({ capacity: 10, isFull: false, spotsLeft: 1 }), "1 spot left");
  assert.equal(spotsText({ capacity: 10, isFull: false, spotsLeft: 7 }), "7 spots left");
});

test("formatDateRange: same day shows one date with a time span", () => {
  const out = formatDateRange("2026-10-12T04:30:00Z", "2026-10-12T07:30:00Z", "UTC");
  assert.match(out, /12 Oct 2026/);
  assert.match(out, /04:30 – 07:30/);
  assert.equal(out.includes("→"), false);
});

test("formatDateRange: multi-day shows both ends", () => {
  const out = formatDateRange("2026-10-12T04:30:00Z", "2026-10-14T16:00:00Z", "UTC");
  assert.match(out, /12 Oct 2026, 04:30 → 14 Oct 2026, 16:00/);
});

test("dateBadge gives day and upper-case month", () => {
  assert.deepEqual(dateBadge("2026-10-05T10:00:00Z", "UTC"), { day: "5", month: "OCT" });
});

test("datetime-local values round-trip and bad input is empty", () => {
  const iso = "2026-10-12T04:30:00.000Z";
  assert.equal(fromInputValue(toInputValue(iso)), iso);
  assert.equal(toInputValue("nope"), "");
  assert.equal(fromInputValue(""), "");
});
