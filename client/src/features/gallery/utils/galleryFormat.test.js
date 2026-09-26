import { test } from "node:test";
import assert from "node:assert/strict";
import { fileProblem, formatDay, neighbour, photoAlt, tileRatio } from "./galleryFormat.js";

test("fileProblem accepts small JPG/PNG/WEBP and explains everything else", () => {
  assert.equal(fileProblem({ type: "image/png", size: 1000 }), null);
  assert.equal(fileProblem({ type: "image/jpeg", size: 8 * 1024 * 1024 }), null);
  assert.match(fileProblem({ type: "image/gif", size: 10 }), /JPG, PNG or WEBP/);
  assert.match(fileProblem({ type: "application/pdf", size: 10 }), /JPG, PNG or WEBP/);
  assert.match(fileProblem({ type: "image/png", size: 8 * 1024 * 1024 + 1 }), /8 MB/);
  assert.match(fileProblem(undefined), /choose/i);
});

test("tileRatio follows the picture but stays within limits, and copes with missing sizes", () => {
  assert.equal(tileRatio({ width: 800, height: 600 }), 0.75);
  assert.equal(tileRatio({ width: 100, height: 1000 }), 1.6);
  assert.equal(tileRatio({ width: 1000, height: 100 }), 0.6);
  assert.equal(tileRatio({}), 1);
  assert.equal(tileRatio(undefined), 1);
});

test("photoAlt builds a helpful description", () => {
  assert.equal(photoAlt({ caption: "Sunrise", location: "Darjeeling" }), "Sunrise in Darjeeling");
  assert.equal(photoAlt({ location: "Hampi" }), "in Hampi");
  assert.equal(photoAlt({}), "Travel photo");
});

test("neighbour finds the previous and next photo, or null at the ends", () => {
  const items = [{ _id: "a" }, { _id: "b" }, { _id: "c" }];
  assert.equal(neighbour(items, "b", 1), "c");
  assert.equal(neighbour(items, "b", -1), "a");
  assert.equal(neighbour(items, "a", -1), null);
  assert.equal(neighbour(items, "c", 1), null);
  assert.equal(neighbour(items, "zzz", 1), null);
});

test("formatDay formats a valid date and hides invalid ones", () => {
  assert.equal(formatDay("2026-10-12T10:00:00Z", "UTC"), "12 Oct 2026");
  assert.equal(formatDay("nope"), "");
});
