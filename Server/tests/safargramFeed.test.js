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
import Profile from "../Models/profileModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

let app;
before(async () => {
  await connectTestDb();
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media: createFakeMedia(), limits: testLimits }));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const get = (path, auth) => request(app).get(`/api/v1/safargram${path}`).set(auth || {});

test("every list endpoint requires a login", async () => {
  for (const path of ["/feed", "/saved", "/hashtags/x", "/users/a/posts"]) {
    assert.equal((await get(path)).status, 401, path);
  }
});

test("discover returns everyone's posts newest first with author and flags", async () => {
  const me = await createUser();
  const other = await createUser();
  const first = await seedPost(other, { caption: "first" });
  const second = await seedPost(me, { caption: "second" });
  await SafarLike.create({ post: first._id, user: me.user._id });
  await SafarSave.create({ post: first._id, user: me.user._id });

  const res = await get("/feed?tab=discover", me.auth);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["second", "first"]);
  assert.equal(res.body.data[1].author.username, other.user.username);
  assert.equal(res.body.data[1].likedByMe, true);
  assert.equal(res.body.data[1].savedByMe, true);
  assert.equal(res.body.data[0].likedByMe, false);
  assert.equal(res.body.nextCursor, null);
  assert.equal(String(res.body.data[0]._id), String(second._id));
});

test("cursor paging returns every post exactly once", async () => {
  const me = await createUser();
  for (let i = 0; i < 25; i++) await seedPost(me, { caption: `p${i}` });

  const seen = [];
  let cursor = null;
  let pages = 0;
  do {
    const res = await get(`/feed?limit=10${cursor ? `&cursor=${cursor}` : ""}`, me.auth);
    assert.equal(res.status, 200);
    seen.push(...res.body.data.map((p) => p._id));
    cursor = res.body.nextCursor;
    pages += 1;
  } while (cursor);

  assert.equal(pages, 3);
  assert.equal(seen.length, 25);
  assert.equal(new Set(seen).size, 25);
});

test("following tab shows only followed authors; no profile means empty", async () => {
  const me = await createUser();
  const friend = await createUser();
  const stranger = await createUser();
  await seedPost(friend, { caption: "friend" });
  await seedPost(stranger, { caption: "stranger" });

  const before = await get("/feed?tab=following", me.auth);
  assert.equal(before.status, 200);
  assert.deepEqual(before.body.data, []);

  await Profile.create({ user: me.user._id, following: [friend.user._id] });
  const after = await get("/feed?tab=following", me.auth);
  assert.deepEqual(after.body.data.map((p) => p.caption), ["friend"]);
});

test("bad tab, limit and cursor are rejected with 400", async () => {
  const me = await createUser();
  assert.equal((await get("/feed?tab=nope", me.auth)).status, 400);
  assert.equal((await get("/feed?limit=0", me.auth)).status, 400);
  assert.equal((await get("/feed?cursor=abc", me.auth)).status, 400);
});

test("profile grid by username; unknown user is 404", async () => {
  const me = await createUser();
  const other = await createUser();
  await seedPost(me, { caption: "mine" });
  await seedPost(other, { caption: "theirs" });

  const res = await get(`/users/${other.user.username}/posts`, me.auth);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["theirs"]);
  assert.equal((await get("/users/nobody_here/posts", me.auth)).status, 404);
});

test("hashtag page is case-insensitive and validates the tag", async () => {
  const me = await createUser();
  await seedPost(me, { caption: "#Spiti", hashtags: ["spiti"] });
  await seedPost(me, { caption: "other", hashtags: ["goa"] });

  const res = await get("/hashtags/SPITI", me.auth);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["#Spiti"]);
  assert.equal((await get("/hashtags/bad-tag!", me.auth)).status, 400);
});

test("destination page lists tagged posts and validates the id", async () => {
  const me = await createUser();
  const dest = new mongoose.Types.ObjectId();
  await seedPost(me, { caption: "at dest", destination: dest });
  await seedPost(me, { caption: "elsewhere" });

  const res = await get(`/destinations/${dest}/posts`, me.auth);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["at dest"]);
  assert.equal((await get("/destinations/xyz/posts", me.auth)).status, 400);
});

test("bucket list returns only the caller's saves, newest save first", async () => {
  const me = await createUser();
  const other = await createUser();
  const a = await seedPost(other, { caption: "a" });
  const b = await seedPost(other, { caption: "b" });
  await SafarSave.create({ post: a._id, user: me.user._id });
  await SafarSave.create({ post: b._id, user: me.user._id });
  await SafarSave.create({ post: a._id, user: other.user._id });

  const res = await get("/saved", me.auth);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["b", "a"]);
  assert.ok(res.body.data.every((p) => p.savedByMe));
  const otherRes = await get("/saved", other.auth);
  assert.deepEqual(otherRes.body.data.map((p) => p.caption), ["a"]);
});
