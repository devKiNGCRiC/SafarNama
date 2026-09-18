import { test } from "node:test";
import assert from "node:assert/strict";
import { extractHashtags } from "../utils/safargramText.js";

test("extracts lowercase unique hashtags in order", () => {
  assert.deepEqual(extractHashtags("Trek #Spiti and #spiti #Snow!"), ["spiti", "snow"]);
});

test("supports unicode tags and underscores", () => {
  assert.deepEqual(extractHashtags("#यात्रा #eco_stay"), ["यात्रा", "eco_stay"]);
});

test("ignores tags longer than 50 characters", () => {
  assert.deepEqual(extractHashtags(`#${"a".repeat(51)} #ok`), ["ok"]);
});

test("caps at 30 tags", () => {
  const caption = Array.from({ length: 40 }, (_, i) => `#t${i}`).join(" ");
  assert.equal(extractHashtags(caption).length, 30);
});

test("returns empty array for no tags or non-string input", () => {
  assert.deepEqual(extractHashtags("no tags here"), []);
  assert.deepEqual(extractHashtags(undefined), []);
});
