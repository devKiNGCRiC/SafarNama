import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMediaFiles, mediaKind, MEDIA_LIMITS } from "../utils/safargramMediaRules.js";

const img = (n = 1, extra = {}) =>
  Array.from({ length: n }, (_, i) => ({ mimetype: "image/png", originalname: `a${i}.png`, size: 1000, ...extra }));
const vid = (extra = {}) => ({ mimetype: "video/mp4", originalname: "v.mp4", size: 1000, ...extra });

test("mediaKind checks mimetype and extension together", () => {
  assert.equal(mediaKind("image/jpeg", "x.JPG"), "image");
  assert.equal(mediaKind("video/quicktime", "x.mov"), "video");
  assert.equal(mediaKind("image/png", "x.exe"), null);
  assert.equal(mediaKind("image/svg+xml", "x.svg"), null);
});

test("accepts 1-5 images or a single video", () => {
  assert.equal(validateMediaFiles(img(1)), null);
  assert.equal(validateMediaFiles(img(5)), null);
  assert.equal(validateMediaFiles([vid()]), null);
});

test("rejects empty, too many, mixed, multiple videos and unsupported files", () => {
  assert.match(validateMediaFiles([]), /at least one/i);
  assert.match(validateMediaFiles(img(6)), /up to 5/i);
  assert.match(validateMediaFiles([...img(1), vid()]), /not both/i);
  assert.match(validateMediaFiles([vid(), vid()]), /only one video/i);
  assert.match(validateMediaFiles([{ mimetype: "application/pdf", originalname: "a.pdf", size: 1 }]), /allowed/i);
});

test("enforces size limits", () => {
  assert.match(validateMediaFiles(img(1, { size: MEDIA_LIMITS.maxImageBytes + 1 })), /8 MB/);
  assert.match(validateMediaFiles([vid({ size: MEDIA_LIMITS.maxVideoBytes + 1 })]), /50 MB/);
});
