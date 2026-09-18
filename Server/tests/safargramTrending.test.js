import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { seedPost } from "./helpers/seed.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import { clearTrendingCache } from "../services/safargramTrending.js";
import Destination from "../Models/destinationModel.js";

let app;
before(async () => {
  await connectTestDb();
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media: createFakeMedia(), limits: testLimits }));
});
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  clearTrendingCache();
});

const trending = (auth) => request(app).get("/api/v1/safargram/trending").set(auth || {});
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);

test("requires a login", async () => {
  assert.equal((await trending()).status, 401);
});

test("hashtags are ranked by number of posts, ties alphabetically, old posts ignored", async () => {
  const me = await createUser();
  await seedPost(me, { hashtags: ["spiti", "trek"] });
  await seedPost(me, { hashtags: ["spiti", "goa"] });
  await seedPost(me, { hashtags: ["spiti"] });
  await seedPost(me, { hashtags: ["trek"] });
  await seedPost(me, { hashtags: ["ancient"], createdAt: daysAgo(45) });

  const res = await trending(me.auth);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.hashtags, [
    { tag: "spiti", count: 3 },
    { tag: "trek", count: 2 },
    { tag: "goa", count: 1 },
  ]);
});

test("at most 8 hashtags and 5 destinations are returned", async () => {
  const me = await createUser();
  const tags = Array.from({ length: 12 }, (_, i) => `tag${String(i).padStart(2, "0")}`);
  await seedPost(me, { hashtags: tags });
  for (let i = 0; i < 7; i++) {
    const d = await Destination.collection.insertOne({ name: `Place ${i}` });
    await seedPost(me, { destination: d.insertedId });
  }
  const res = await trending(me.auth);
  assert.equal(res.body.data.hashtags.length, 8);
  assert.equal(res.body.data.destinations.length, 5);
});

test("destinations are ranked with names and counts; posts without one are ignored", async () => {
  const me = await createUser();
  const spiti = (await Destination.collection.insertOne({ name: "Spiti Valley" })).insertedId;
  const munnar = (await Destination.collection.insertOne({ name: "Munnar" })).insertedId;
  await seedPost(me, { destination: spiti });
  await seedPost(me, { destination: spiti });
  await seedPost(me, { destination: munnar });
  await seedPost(me, {});

  const res = await trending(me.auth);
  assert.deepEqual(
    res.body.data.destinations.map(({ name, count }) => ({ name, count })),
    [
      { name: "Spiti Valley", count: 2 },
      { name: "Munnar", count: 1 },
    ],
  );
  assert.equal(String(res.body.data.destinations[0]._id), String(spiti));
});

test("results are cached for a minute", async () => {
  const me = await createUser();
  await seedPost(me, { hashtags: ["first"] });
  const one = await trending(me.auth);
  await seedPost(me, { hashtags: ["second"] });
  const two = await trending(me.auth);
  assert.deepEqual(two.body.data, one.body.data);

  clearTrendingCache();
  const three = await trending(me.auth);
  assert.equal(three.body.data.hashtags.length, 2);
});
