import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createPublicStatsRouter, clearPublicStatsCache } from "../Routes/publicStatsRoutes.js";
import Destination from "../Models/destinationModel.js";
import Tour from "../Models/TourModel.js";
import blogModel from "../Models/blogModel.js";
import UserModel from "../Models/userModel.js";

let app;
before(async () => {
  await connectTestDb();
  app = buildApp("/api/v1/public-stats", createPublicStatsRouter());
});
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  clearPublicStatsCache();
});

const get = () => request(app).get("/api/v1/public-stats");

test("an empty site reports zeros (no invented numbers)", async () => {
  const res = await get();
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, { destinations: 0, tours: 0, blogs: 0, travellers: 0 });
});

test("counts real records, and only active travellers", async () => {
  await Destination.collection.insertMany([{ name: "A" }, { name: "B" }]);
  await Tour.collection.insertMany([{ name: "T1" }, { name: "T2" }, { name: "T3" }]);
  await blogModel.collection.insertOne({ title: "x" });
  const a = await createUser();
  const b = await createUser();
  await createUser();
  await UserModel.updateOne({ _id: b.user._id }, { $set: { active: false } });

  const res = await get();
  assert.deepEqual(res.body.data, { destinations: 2, tours: 3, blogs: 1, travellers: 2 });
  assert.ok(a);
});

test("no login is needed, and the numbers are cached for a few minutes", async () => {
  await Destination.collection.insertOne({ name: "A" });
  assert.equal((await get()).body.data.destinations, 1);
  await Destination.collection.insertOne({ name: "B" });
  assert.equal((await get()).body.data.destinations, 1); // still the cached value
  clearPublicStatsCache();
  assert.equal((await get()).body.data.destinations, 2);
});
