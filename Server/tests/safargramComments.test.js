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
import SafarComment from "../Models/safargramCommentModel.js";

let app;
before(async () => {
  await connectTestDb();
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media: createFakeMedia(), limits: testLimits }));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const base = "/api/v1/safargram";
const add = (id, auth, text) => request(app).post(`${base}/posts/${id}/comments`).set(auth || {}).send({ text });
const list = (id, auth, qs = "") => request(app).get(`${base}/posts/${id}/comments${qs}`).set(auth || {});
const remove = (id, auth) => request(app).delete(`${base}/comments/${id}`).set(auth || {});
const count = async (id) => (await SafarPost.findById(id)).commentsCount;

test("adding a comment returns it with its author and bumps the counter", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  const res = await add(p._id, me.auth, "  Beautiful!  ");
  assert.equal(res.status, 201);
  assert.equal(res.body.data.text, "Beautiful!");
  assert.equal(res.body.data.author.username, me.user.username);
  assert.equal(await count(p._id), 1);
});

test("invalid text, bad id, missing post and no login are rejected", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  assert.equal((await add(p._id, me.auth, "   ")).status, 400);
  assert.equal((await add(p._id, me.auth, "x".repeat(501))).status, 400);
  assert.equal((await add(p._id, me.auth, { $gt: "" })).status, 400);
  assert.equal((await add("abc", me.auth, "hi")).status, 400);
  assert.equal((await add(new mongoose.Types.ObjectId(), me.auth, "hi")).status, 404);
  assert.equal((await add(p._id, null, "hi")).status, 401);
  assert.equal(await count(p._id), 0);
});

test("comments list newest first with cursor paging", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  for (let i = 0; i < 25; i++) await SafarComment.create({ post: p._id, author: me.user._id, text: `c${i}` });

  const first = await list(p._id, me.auth);
  assert.equal(first.body.data.length, 20);
  assert.equal(first.body.data[0].text, "c24");
  const second = await list(p._id, me.auth, `?cursor=${first.body.nextCursor}`);
  assert.equal(second.body.data.length, 5);
  assert.equal(second.body.nextCursor, null);
  assert.equal((await list(new mongoose.Types.ObjectId(), me.auth)).status, 404);
});

test("comment author, post author and admin may delete; others may not", async () => {
  const postAuthor = await createUser();
  const commenter = await createUser();
  const stranger = await createUser();
  const admin = await createUser({ role: "admin" });
  const p = await seedPost(postAuthor);

  const make = async () => (await add(p._id, commenter.auth, "hi")).body.data._id;

  let id = await make();
  assert.equal((await remove(id, stranger.auth)).status, 403);
  assert.equal((await remove(id, commenter.auth)).status, 200);

  id = await make();
  assert.equal((await remove(id, postAuthor.auth)).status, 200);

  id = await make();
  assert.equal((await remove(id, admin.auth)).status, 200);

  assert.equal(await count(p._id), 0);
  assert.equal((await remove(id, admin.auth)).status, 404);
  assert.equal((await remove("abc", admin.auth)).status, 400);
});
