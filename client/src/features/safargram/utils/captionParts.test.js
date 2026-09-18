import { test } from "node:test";
import assert from "node:assert/strict";
import { splitCaption } from "./captionParts.js";

test("splits text and hashtags in order", () => {
  assert.deepEqual(splitCaption("Trek to #Spiti today #snow"), [
    { type: "text", value: "Trek to " },
    { type: "tag", value: "Spiti" },
    { type: "text", value: " today " },
    { type: "tag", value: "snow" },
  ]);
});

test("plain text, empty and unicode tags", () => {
  assert.deepEqual(splitCaption("just words"), [{ type: "text", value: "just words" }]);
  assert.deepEqual(splitCaption(""), []);
  assert.deepEqual(splitCaption("#यात्रा"), [{ type: "tag", value: "यात्रा" }]);
});

test("never treats markup as anything but text", () => {
  const parts = splitCaption("<img src=x onerror=alert(1)> #ok");
  assert.equal(parts[0].type, "text");
  assert.equal(parts[0].value, "<img src=x onerror=alert(1)> ");
});
