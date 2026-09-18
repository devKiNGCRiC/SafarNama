import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import SafarPost, { CATEGORIES } from "../Models/safargramPostModel.js";
import SafarComment from "../Models/safargramCommentModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

before(async () => {
  await connectTestDb();
  await Promise.all([SafarPost, SafarComment, SafarLike, SafarSave].map((m) => m.init()));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const oid = () => new mongoose.Types.ObjectId();
const image = (n = 1) => ({ type: "image", url: `https://cdn.test/${n}.jpg`, publicId: `p${n}` });
const video = () => ({ type: "video", url: "https://cdn.test/v.mp4", publicId: "v1", duration: 12 });

test("a valid post gets sensible defaults", async () => {
  const post = await SafarPost.create({ author: oid(), media: [image()] });
  assert.equal(post.category, "Other");
  assert.equal(post.caption, "");
  assert.deepEqual([...post.hashtags], []);
  assert.equal(post.likesCount, 0);
  assert.equal(post.commentsCount, 0);
  assert.equal(post.destination, null);
  assert.ok(CATEGORIES.includes("Eco-stay"));
});

test("media shape rules: 1-5 images or a single video, never mixed", async () => {
  const author = oid();
  await assert.rejects(SafarPost.create({ author, media: [] }), /1 to 5/);
  await assert.rejects(SafarPost.create({ author, media: [1, 2, 3, 4, 5, 6].map(image) }), /1 to 5/);
  await assert.rejects(SafarPost.create({ author, media: [image(1), video()] }), /not both/);
  await assert.rejects(SafarPost.create({ author, media: [video(), video()] }), /not both/);
  await SafarPost.create({ author, media: [video()] });
  await SafarPost.create({ author, media: [1, 2, 3, 4, 5].map(image) });
});

test("caption length and category are validated", async () => {
  const author = oid();
  await assert.rejects(SafarPost.create({ author, media: [image()], caption: "x".repeat(2201) }));
  await assert.rejects(SafarPost.create({ author, media: [image()], category: "Nope" }));
});

test("comment text is trimmed and limited to 1-500 chars", async () => {
  const base = { post: oid(), author: oid() };
  const c = await SafarComment.create({ ...base, text: "  nice  " });
  assert.equal(c.text, "nice");
  await assert.rejects(SafarComment.create({ ...base, text: "   " }));
  await assert.rejects(SafarComment.create({ ...base, text: "x".repeat(501) }));
});

test("a user can like or save a post only once (unique index)", async () => {
  const pair = { post: oid(), user: oid() };
  await SafarLike.create(pair);
  await assert.rejects(SafarLike.create(pair), (e) => e.code === 11000);
  await SafarSave.create(pair);
  await assert.rejects(SafarSave.create(pair), (e) => e.code === 11000);
});
