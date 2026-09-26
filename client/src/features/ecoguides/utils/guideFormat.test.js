import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryLabel, formatDay, readTimeText, splitParagraphs, tagsToInput } from "./guideFormat.js";

test("categoryLabel knows the three categories and falls back safely", () => {
  assert.equal(categoryLabel("SUSTAINABLE_TIPS"), "Sustainable tips");
  assert.equal(categoryLabel("BEST_PRACTICES"), "Best practices");
  assert.equal(categoryLabel("LOCAL_GUIDE"), "Local guides");
  assert.equal(categoryLabel("WHATEVER"), "Guide");
  assert.equal(categoryLabel(undefined), "Guide");
});

test("readTimeText is never zero or NaN", () => {
  assert.equal(readTimeText(3), "3 min read");
  assert.equal(readTimeText(0), "1 min read");
  assert.equal(readTimeText(undefined), "1 min read");
});

test("splitParagraphs splits on blank lines, trims, and keeps markup as text", () => {
  assert.deepEqual(splitParagraphs("One\n\nTwo\nstill two\n\n\n  Three  "), ["One", "Two\nstill two", "Three"]);
  assert.deepEqual(splitParagraphs("<b>hi</b>"), ["<b>hi</b>"]);
  assert.deepEqual(splitParagraphs(""), []);
  assert.deepEqual(splitParagraphs(null), []);
});

test("tagsToInput joins tags for the edit form", () => {
  assert.equal(tagsToInput(["a", "b"]), "a, b");
  assert.equal(tagsToInput(undefined), "");
});

test("formatDay formats a valid date and hides invalid ones", () => {
  assert.equal(formatDay("2026-10-12T10:00:00Z", "UTC"), "12 Oct 2026");
  assert.equal(formatDay("nope"), "");
});
