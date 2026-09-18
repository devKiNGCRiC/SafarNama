import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import SafarPost from "../Models/safargramPostModel.js";
import Destination from "../Models/destinationModel.js";

before(connectTestDb);
after(disconnectTestDb);
beforeEach(clearTestDb);

const png = (name = "a.png") => ({ buf: Buffer.from("fake-image"), opts: { filename: name, contentType: "image/png" } });
const mp4 = () => ({ buf: Buffer.from("fake-video"), opts: { filename: "v.mp4", contentType: "video/mp4" } });

function makeApp(media = createFakeMedia(), limits = testLimits) {
  return { media, app: buildApp("/api/v1/safargram", createSafargramRouter({ media, limits })) };
}

function post(app, auth, files, fields = {}) {
  let req = request(app).post("/api/v1/safargram/posts").set(auth || {});
  for (const [k, v] of Object.entries(fields)) req = req.field(k, v);
  for (const f of files) req = req.attach("media", f.buf, f.opts);
  return req;
}

const leftoverTempFiles = () => fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith("safargram-"));

test("requires a login", async () => {
  const { app } = makeApp();
  assert.equal((await post(app, null, [png()])).status, 401);
});

test("creates a post with photos, extracts hashtags, tags a destination", async () => {
  const { app, media } = makeApp();
  const me = await createUser();
  const dest = await Destination.collection.insertOne({ name: "Spiti Valley" });

  const res = await post(app, me.auth, [png("1.png"), png("2.png")], {
    caption: "Cold desert #Spiti #trek",
    category: "Trekking",
    destinationId: String(dest.insertedId),
  });

  assert.equal(res.status, 201, JSON.stringify(res.body));
  const p = res.body.data;
  assert.equal(p.media.length, 2);
  assert.deepEqual(p.hashtags, ["spiti", "trek"]);
  assert.equal(p.category, "Trekking");
  assert.equal(p.author.username, me.user.username);
  assert.equal(p.destination.name, "Spiti Valley");
  assert.equal(p.likedByMe, false);
  assert.equal(media.uploaded.length, 2);
  assert.equal(await SafarPost.countDocuments(), 1);
});

test("creates a video post; rejects mixed media and too many photos", async () => {
  const { app } = makeApp();
  const me = await createUser();
  assert.equal((await post(app, me.auth, [mp4()])).status, 201);
  assert.equal((await post(app, me.auth, [png(), mp4()])).status, 400);
  const six = Array.from({ length: 6 }, (_, i) => png(`${i}.png`));
  assert.equal((await post(app, me.auth, six)).status, 400);
});

test("rejects missing media, unsupported types, bad category, long caption, unknown destination", async () => {
  const { app } = makeApp();
  const me = await createUser();
  assert.equal((await post(app, me.auth, [])).status, 400);
  const pdf = { buf: Buffer.from("x"), opts: { filename: "a.pdf", contentType: "application/pdf" } };
  assert.equal((await post(app, me.auth, [pdf])).status, 400);
  assert.equal((await post(app, me.auth, [png()], { category: "Nope" })).status, 400);
  assert.equal((await post(app, me.auth, [png()], { caption: "x".repeat(2201) })).status, 400);
  const missing = String(new mongoose.Types.ObjectId());
  assert.equal((await post(app, me.auth, [png()], { destinationId: missing })).status, 400);
  assert.equal((await post(app, me.auth, [png()], { destinationId: "bad" })).status, 400);
  assert.equal(await SafarPost.countDocuments(), 0);
});

test("if one upload fails, already-uploaded files are removed and nothing is saved", async () => {
  const media = createFakeMedia({ failOnSecond: true });
  const { app } = makeApp(media);
  const me = await createUser();
  const res = await post(app, me.auth, [png("1.png"), png("2.png")]);
  assert.ok(res.status >= 400);
  assert.equal(media.removed.length, 1);
  assert.equal(await SafarPost.countDocuments(), 0);
});

test("temporary upload files are always deleted", async () => {
  const { app } = makeApp();
  const me = await createUser();
  const before = leftoverTempFiles().length;
  await post(app, me.auth, [png()]);
  await post(app, me.auth, [png()], { category: "Nope" });
  assert.equal(leftoverTempFiles().length, before);
});

test("rate limit: the third post within the window gets 429", async () => {
  const limits = { ...testLimits, createPost: { windowMs: 60_000, max: 2 } };
  const { app } = makeApp(createFakeMedia(), limits);
  const me = await createUser();
  assert.equal((await post(app, me.auth, [png()])).status, 201);
  assert.equal((await post(app, me.auth, [png()])).status, 201);
  assert.equal((await post(app, me.auth, [png()])).status, 429);
});
