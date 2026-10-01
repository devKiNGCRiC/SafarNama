import { test } from "node:test";
import assert from "node:assert/strict";
import { advance, openAt, storyDurationMs, storyFileProblem, timeLeftLabel } from "./storyFormat.js";

test("storyFileProblem accepts photos and video, rejects everything else and anything too big", () => {
  assert.equal(storyFileProblem({ type: "image/png", size: 1000 }), null);
  assert.equal(storyFileProblem({ type: "video/mp4", size: 1000 }), null);
  assert.match(storyFileProblem({ type: "application/pdf", size: 10 }), /JPG, PNG, WEBP/);
  assert.match(storyFileProblem({ type: "image/png", size: 51 * 1024 * 1024 }), /50 MB/);
  assert.match(storyFileProblem(undefined), /choose/i);
});

test("storyDurationMs: a fixed time for photos, the clip length for video (clamped)", () => {
  assert.equal(storyDurationMs({ media: { type: "image" } }), 5000);
  assert.equal(storyDurationMs({ media: { type: "video", duration: 8 } }), 8000);
  assert.equal(storyDurationMs({ media: { type: "video", duration: 0.5 } }), 3000);
  assert.equal(storyDurationMs({ media: { type: "video", duration: 999 } }), 60000);
  assert.equal(storyDurationMs({ media: { type: "video" } }), 5000);
});

test("timeLeftLabel reads in hours, then minutes, then 'Expired'", () => {
  const now = Date.now();
  assert.equal(timeLeftLabel(now + 5 * 3_600_000, now), "5h left");
  assert.equal(timeLeftLabel(now + 40 * 60_000, now), "40m left");
  assert.equal(timeLeftLabel(now - 1000, now), "Expired");
  assert.equal(timeLeftLabel(now + 10_000, now), "1m left");
});

const groups = [
  { author: { _id: "a" }, stories: [{ id: "a1" }, { id: "a2" }] },
  { author: { _id: "b" }, stories: [{ id: "b1" }] },
  { author: { _id: "c" }, stories: [{ id: "c1" }, { id: "c2" }] },
];

test("openAt finds the tapped ring's first story", () => {
  assert.deepEqual(openAt(groups, "b"), { groupIndex: 1, storyIndex: 0 });
  assert.equal(openAt(groups, "zzz"), null);
});

test("advance moves within a group, then crosses into the next person's ring", () => {
  assert.deepEqual(advance(groups, { groupIndex: 0, storyIndex: 0 }, 1), { groupIndex: 0, storyIndex: 1 });
  assert.deepEqual(advance(groups, { groupIndex: 0, storyIndex: 1 }, 1), { groupIndex: 1, storyIndex: 0 });
  assert.deepEqual(advance(groups, { groupIndex: 1, storyIndex: 0 }, 1), { groupIndex: 2, storyIndex: 0 });
  assert.equal(advance(groups, { groupIndex: 2, storyIndex: 1 }, 1), null);
});

test("advance going backwards lands on the previous person's last story", () => {
  assert.deepEqual(advance(groups, { groupIndex: 1, storyIndex: 0 }, -1), { groupIndex: 0, storyIndex: 1 });
  assert.equal(advance(groups, { groupIndex: 0, storyIndex: 0 }, -1), null);
});

test("advance is safe with empty groups or no position", () => {
  assert.equal(advance([], { groupIndex: 0, storyIndex: 0 }, 1), null);
  assert.equal(advance(groups, null, 1), null);
});
