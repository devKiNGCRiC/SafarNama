import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import profileRoutes from "../Routes/profileRoutes.js";
import Destination from "../Models/destinationModel.js";
import UserModel from "../Models/userModel.js";

let app;
before(async () => {
  await connectTestDb();
  app = buildApp("/api/v1/profile", profileRoutes);
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const list = (u) => request(app).get("/api/v1/profile/saved-destinations").set(u?.auth || {});
const save = (id, u) => request(app).post(`/api/v1/profile/saved-destinations/${id}`).set(u?.auth || {});
const unsave = (id, u) => request(app).delete(`/api/v1/profile/saved-destinations/${id}`).set(u?.auth || {});
const place = async (name) =>
  (await Destination.collection.insertOne({ name, address: `${name} address`, images: [`https://img.test/${name}.jpg`] })).insertedId;

test("requires a login", async () => {
  assert.equal((await list()).status, 401);
  assert.equal((await save(new mongoose.Types.ObjectId())).status, 401);
});

test("starts empty, then a saved destination shows up with its details", async () => {
  const me = await createUser();
  assert.deepEqual((await list(me)).body.data, []);

  const spiti = await place("Spiti");
  const res = await save(spiti, me);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.saved, true);

  const after = (await list(me)).body.data;
  assert.equal(after.length, 1);
  assert.equal(after[0].name, "Spiti");
  assert.equal(after[0].address, "Spiti address");
  assert.deepEqual(after[0].images, ["https://img.test/Spiti.jpg"]);
});

test("saving twice keeps one entry; each user has their own list", async () => {
  const a = await createUser();
  const b = await createUser();
  const spiti = await place("Spiti");
  await save(spiti, a);
  await save(spiti, a);
  assert.equal((await list(a)).body.data.length, 1);
  assert.equal((await list(b)).body.data.length, 0);
});

test("removing works and is safe to repeat", async () => {
  const me = await createUser();
  const spiti = await place("Spiti");
  await save(spiti, me);
  assert.equal((await unsave(spiti, me)).status, 200);
  assert.equal((await unsave(spiti, me)).status, 200);
  assert.equal((await list(me)).body.data.length, 0);
});

test("unknown or malformed destination ids are rejected", async () => {
  const me = await createUser();
  assert.equal((await save(new mongoose.Types.ObjectId(), me)).status, 404);
  assert.equal((await save("abc", me)).status, 400);
  assert.equal((await unsave("abc", me)).status, 400);
});

test("a destination that was deleted disappears from the list", async () => {
  const me = await createUser();
  const gone = await place("Gone");
  const kept = await place("Kept");
  await save(gone, me);
  await save(kept, me);
  await Destination.collection.deleteOne({ _id: gone });
  const data = (await list(me)).body.data;
  assert.deepEqual(data.map((d) => d.name), ["Kept"]);
  assert.ok(await UserModel.findById(me.user._id));
});
