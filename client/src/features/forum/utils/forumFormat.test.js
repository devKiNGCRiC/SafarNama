import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryLabel, replyCountText, splitParagraphs, tagsToInput, threadBadges, threadFormError, withAcceptedFirst } from "./forumFormat.js";

test("categoryLabel knows all categories and falls back", () => {
  assert.equal(categoryLabel("TRIP_HELP"), "Trip help");
  assert.equal(categoryLabel("MEETUPS"), "Meetups");
  assert.equal(categoryLabel("???"), "General");
});

test("replyCountText handles none, one, many and bad values", () => {
  assert.equal(replyCountText(0), "No replies yet");
  assert.equal(replyCountText(1), "1 reply");
  assert.equal(replyCountText(12), "12 replies");
  assert.equal(replyCountText(undefined), "No replies yet");
});

test("threadBadges lists pinned, answered, locked in that order", () => {
  assert.deepEqual(threadBadges({}), []);
  assert.deepEqual(
    threadBadges({ isLocked: true, hasAcceptedAnswer: true, isPinned: true }).map((b) => b.id),
    ["pinned", "answered", "locked"],
  );
});

test("threadFormError mirrors the server limits", () => {
  const ok = { title: "Best time for Coorg?", content: "Planning a trip with kids." };
  assert.equal(threadFormError(ok), null);
  assert.match(threadFormError({ ...ok, title: "abc" }), /title/i);
  assert.match(threadFormError({ ...ok, title: "x".repeat(141) }), /140/);
  assert.match(threadFormError({ ...ok, content: "short" }), /10 characters/);
  assert.match(threadFormError({ ...ok, content: "x".repeat(5001) }), /5000/);
  assert.match(threadFormError({ title: "   ", content: "" }), /title/i);
});

test("splitParagraphs and tagsToInput", () => {
  assert.deepEqual(splitParagraphs("One\n\nTwo\nstill two\n\n\n Three "), ["One", "Two\nstill two", "Three"]);
  assert.deepEqual(splitParagraphs("<b>x</b>"), ["<b>x</b>"]);
  assert.deepEqual(splitParagraphs(null), []);
  assert.equal(tagsToInput(["a", "b"]), "a, b");
  assert.equal(tagsToInput(undefined), "");
});

test("withAcceptedFirst moves the accepted answer up and keeps the order of the rest", () => {
  const list = [{ _id: 1 }, { _id: 2, isAccepted: true }, { _id: 3 }];
  assert.deepEqual(withAcceptedFirst(list).map((r) => r._id), [2, 1, 3]);
  assert.deepEqual(withAcceptedFirst([{ _id: 1 }]).map((r) => r._id), [1]);
});
