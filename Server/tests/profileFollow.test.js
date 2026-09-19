import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import profileRoutes from "../Routes/profileRoutes.js";
import Profile from "../Models/profileModel.js";

let app;
before(async () => {
  await connectTestDb();
  app = buildApp("/api/v1/profile", profileRoutes);
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const follow = (id, u) => request(app).post(`/api/v1/profile/follow/${id}`).set(u?.auth || {});
const unfollow = (id, u) => request(app).delete(`/api/v1/profile/follow/${id}`).set(u?.auth || {});

test("following works even if neither person has opened their profile yet", async () => {
  const a = await createUser();
  const b = await createUser();
  assert.equal(await Profile.countDocuments(), 0);

  const res = await follow(b.user._id, a);
  assert.equal(res.status, 200, JSON.stringify(res.body));

  const mine = await Profile.findOne({ user: a.user._id });
  const theirs = await Profile.findOne({ user: b.user._id });
  assert.deepEqual(mine.following.map(String), [String(b.user._id)]);
  assert.deepEqual(theirs.followers.map(String), [String(a.user._id)]);
});

test("following twice is refused; unfollowing removes both sides and is safe to repeat", async () => {
  const a = await createUser();
  const b = await createUser();
  await follow(b.user._id, a);
  assert.equal((await follow(b.user._id, a)).status, 400);

  assert.equal((await unfollow(b.user._id, a)).status, 200);
  assert.equal((await Profile.findOne({ user: a.user._id })).following.length, 0);
  assert.equal((await Profile.findOne({ user: b.user._id })).followers.length, 0);
  assert.equal((await unfollow(b.user._id, a)).status, 200);
});

test("cannot follow yourself or someone who does not exist; login required", async () => {
  const a = await createUser();
  assert.equal((await follow(a.user._id, a)).status, 400);
  assert.equal((await follow(new mongoose.Types.ObjectId(), a)).status, 404);
  assert.equal((await follow(a.user._id)).status, 401);
});
