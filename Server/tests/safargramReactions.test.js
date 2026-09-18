import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { seedPost } from "./helpers/seed.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import SafarPost from "../Models/safargramPostModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

let app;
before(async () => {
  await connectTestDb();
  await Promise.all([SafarLike.init(), SafarSave.init()]);
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media: createFakeMedia(), limits: testLimits }));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const like = (id, auth, method = "post") => request(app)[method](`/api/v1/safargram/posts/${id}/like`).set(auth || {});
const save = (id, auth, method = "post") => request(app)[method](`/api/v1/safargram/posts/${id}/save`).set(auth || {});
const likesCount = async (id) => (await SafarPost.findById(id)).likesCount;

test("like is idempotent: liking twice counts once", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  const first = await like(p._id, me.auth);
  assert.equal(first.status, 200);
  assert.deepEqual(first.body.data, { likesCount: 1, likedByMe: true });
  const second = await like(p._id, me.auth);
  assert.deepEqual(second.body.data, { likesCount: 1, likedByMe: true });
  assert.equal(await SafarLike.countDocuments(), 1);
});

test("unlike is idempotent and never goes below zero", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  await like(p._id, me.auth);
  const first = await like(p._id, me.auth, "delete");
  assert.deepEqual(first.body.data, { likesCount: 0, likedByMe: false });
  const second = await like(p._id, me.auth, "delete");
  assert.deepEqual(second.body.data, { likesCount: 0, likedByMe: false });
  assert.equal(await likesCount(p._id), 0);
});

test("different users add up", async () => {
  const a = await createUser();
  const b = await createUser();
  const p = await seedPost(a);
  await like(p._id, a.auth);
  await like(p._id, b.auth);
  assert.equal(await likesCount(p._id), 2);
});

test("ten simultaneous likes by one user still count once", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  const results = await Promise.all(Array.from({ length: 10 }, () => like(p._id, me.auth)));
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(await SafarLike.countDocuments({ post: p._id }), 1);
  assert.equal(await likesCount(p._id), 1);
});

test("save and unsave are idempotent", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  assert.deepEqual((await save(p._id, me.auth)).body.data, { savedByMe: true });
  assert.deepEqual((await save(p._id, me.auth)).body.data, { savedByMe: true });
  assert.equal(await SafarSave.countDocuments(), 1);
  assert.deepEqual((await save(p._id, me.auth, "delete")).body.data, { savedByMe: false });
  assert.deepEqual((await save(p._id, me.auth, "delete")).body.data, { savedByMe: false });
  assert.equal(await SafarSave.countDocuments(), 0);
});

test("bad id 400, missing post 404, no login 401", async () => {
  const me = await createUser();
  assert.equal((await like("abc", me.auth)).status, 400);
  assert.equal((await like(new mongoose.Types.ObjectId(), me.auth)).status, 404);
  assert.equal((await save(new mongoose.Types.ObjectId(), me.auth)).status, 404);
  const p = await seedPost(me);
  assert.equal((await like(p._id)).status, 401);
});
