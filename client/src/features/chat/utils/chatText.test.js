import { test } from "node:test";
import assert from "node:assert/strict";
import { dayLabel, displayName, isGrouped, previewText } from "./chatText.js";

const now = new Date("2026-09-19T15:00:00").getTime();

test("dayLabel: Today, Yesterday, then a date", () => {
  assert.equal(dayLabel("2026-09-19T01:00:00", now), "Today");
  assert.equal(dayLabel("2026-09-18T23:00:00", now), "Yesterday");
  assert.match(dayLabel("2026-09-01T10:00:00", now), /2026/);
  assert.equal(dayLabel("nope", now), "");
});

test("displayName prefers full name, then username", () => {
  assert.equal(displayName({ firstName: "Asha", lastName: "Rao", username: "asha" }), "Asha Rao");
  assert.equal(displayName({ username: "asha" }), "asha");
  assert.equal(displayName(null), "Deleted user");
});

test("previewText for the inbox line", () => {
  const me = "1";
  assert.equal(previewText({ text: "hello", kind: "text", sender: "1" }, me), "You: hello");
  assert.equal(previewText({ text: "hello", kind: "text", sender: "2" }, me), "hello");
  assert.equal(previewText({ text: "Photo", kind: "image", sender: "2" }, me), "📷 Photo");
  assert.equal(previewText({ text: "Asha added Ravi", kind: "system" }, me), "Asha added Ravi");
  assert.equal(previewText(null, me), "No messages yet");
});

test("isGrouped: same sender within 5 minutes and the same day", () => {
  const a = { sender: { _id: "1" }, createdAt: "2026-09-19T10:00:00" };
  const near = { sender: { _id: "1" }, createdAt: "2026-09-19T10:03:00" };
  const far = { sender: { _id: "1" }, createdAt: "2026-09-19T10:20:00" };
  const other = { sender: { _id: "2" }, createdAt: "2026-09-19T10:01:00" };
  const nextDay = { sender: { _id: "1" }, createdAt: "2026-09-20T00:01:00" };
  assert.equal(isGrouped(a, near), true);
  assert.equal(isGrouped(a, far), false);
  assert.equal(isGrouped(a, other), false);
  assert.equal(isGrouped(a, nextDay), false);
  assert.equal(isGrouped(null, near), false);
});
