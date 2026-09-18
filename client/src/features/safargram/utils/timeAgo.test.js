import { test } from "node:test";
import assert from "node:assert/strict";
import { timeAgo } from "./timeAgo.js";

const now = new Date("2026-09-19T12:00:00Z").getTime();
const ago = (ms) => new Date(now - ms).toISOString();

test("relative times", () => {
  assert.equal(timeAgo(ago(10_000), now), "just now");
  assert.equal(timeAgo(ago(5 * 60_000), now), "5m");
  assert.equal(timeAgo(ago(3 * 3_600_000), now), "3h");
  assert.equal(timeAgo(ago(2 * 86_400_000), now), "2d");
  assert.equal(timeAgo(ago(15 * 86_400_000), now), "2w");
});

test("old or invalid dates fall back safely", () => {
  assert.match(timeAgo(ago(90 * 86_400_000), now), /\d{4}/);
  assert.equal(timeAgo("not a date", now), "");
});
