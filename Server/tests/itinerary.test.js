import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createItineraryRouter } from "../Routes/itineraryRoutes.js";
import Itinerary from "../Models/itineraryModel.js";
import Destination from "../Models/destinationModel.js";

let app;
const roomy = { general: { windowMs: 60_000, max: 100_000 }, generate: { windowMs: 60_000, max: 100_000 } };
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  app = buildApp("/api/v1/itineraries", createItineraryRouter({ limits: roomy }));
});

const base = "/api/v1/itineraries";
const oid = () => new mongoose.Types.ObjectId();

async function seedDestination(name, coords, extra = {}) {
  return Destination.create({
    name, address: `${name}, Uttarakhand, India`, description: "A place.", history: "Old.", significance: "Important.",
    category: ["Mountain"], rating: 4.5, images: [`https://cdn.test/${name}.jpg`],
    location: { type: "Point", coordinates: coords },
    activities: [{ name: "Trekking" }, { name: "Photography" }],
    bestTimeToVisit: { months: ["June", "July"] },
    ...extra,
  });
}

const api = {
  generate: (body) => request(app).post(`${base}/generate`).send(body),
  templates: () => request(app).get(base),
  one: (id, u) => request(app).get(`${base}/${id}`).set(u?.auth || {}),
  mine: (userId, u) => request(app).get(`${base}/user/${userId}`).set(u?.auth || {}),
  create: (u, body) => request(app).post(base).set(u?.auth || {}).send(body),
  update: (id, u, body) => request(app).put(`${base}/${id}`).set(u?.auth || {}).send(body),
  remove: (id, u) => request(app).delete(`${base}/${id}`).set(u?.auth || {}),
  all: (u) => request(app).get(`${base}/admin/all`).set(u?.auth || {}),
  byDestination: (id) => request(app).get(`${base}/destination/${id}`),
};

const stopFor = (d, extra = {}) => ({ destination: String(d._id), duration: "2 days", notes: "Carry warm clothes", activities: ["Trekking"], ...extra });

test("the planner is public, saves nothing, and answers with a full plan", async () => {
  await seedDestination("Valley of Flowers", [79.6, 30.4]);
  await seedDestination("Kedarnath", [79.06, 30.73]);
  await seedDestination("Auli", [79.57, 30.53]);

  const res = await api.generate({ days: 5, month: 6, interests: ["Trekking"], pace: "balanced" });
  assert.equal(res.status, 200);
  const plan = res.body.data;
  assert.equal(plan.days, 5);
  assert.equal(plan.dayPlans.length, 5);
  assert.ok(plan.stops.length >= 1);
  assert.ok(plan.stops[0].destination._id && plan.stops[0].destination.name);
  assert.equal(await Itinerary.countDocuments(), 0);

  const options = await request(app).get(`${base}/options`);
  assert.ok(options.body.data.interests.includes("Trekking"));
  assert.deepEqual(options.body.data.paces, ["relaxed", "balanced", "packed"]);
});

test("the planner rejects bad requests, and says so when there are no destinations", async () => {
  assert.equal((await api.generate({ days: 3 })).status, 404); // nothing in the database yet
  await seedDestination("Auli", [79.57, 30.53]);
  for (const body of [{}, { days: 0 }, { days: 99 }, { days: 3, month: 20 }, { days: 3, interests: ["Skydiving"] }, { days: 3, pace: "warp" }]) {
    assert.equal((await api.generate(body)).status, 400, JSON.stringify(body));
  }
  assert.equal((await api.generate({ days: 3 })).status, 200);
});

test("the planner is rate limited harder than the rest", async () => {
  const strict = buildApp("/api/v1/itineraries", createItineraryRouter({ limits: { general: roomy.general, generate: { windowMs: 60_000, max: 2 } } }));
  await seedDestination("Auli", [79.57, 30.53]);
  const codes = [];
  for (let i = 0; i < 3; i += 1) codes.push((await request(strict).post(`${base}/generate`).send({ days: 2 })).status);
  assert.deepEqual(codes, [200, 200, 429]);
});

test("saving needs a login, records the creator, and only accepts the fields it knows", async () => {
  const d = await seedDestination("Auli", [79.57, 30.53]);
  const me = await createUser();
  const other = await createUser();

  assert.equal((await api.create(null, { title: "Trip", destinations: [stopFor(d)] })).status, 401);

  const res = await api.create(me, {
    title: "  Hills in June  ",
    destinations: [stopFor(d, { startDay: 1, days: 2 })],
    tripDays: 2, generated: true, difficulty: "EASY",
    creator: String(other.user._id), isTemplate: true, sustainabilityScore: 5, estimatedBudget: { amount: 1 },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.title, "Hills in June");
  assert.equal(res.body.data.creator.username, me.user.username);
  assert.equal(res.body.data.isTemplate, false); // members cannot make templates
  assert.equal(res.body.data.generated, true);
  assert.equal(res.body.data.destinations[0].destination.name, "Auli");
  const saved = await Itinerary.findById(res.body.data._id).lean();
  assert.equal(String(saved.creator), String(me.user._id));
  assert.equal(saved.sustainabilityScore, undefined);
  assert.equal(saved.estimatedBudget, undefined);
});

test("saving is validated: name, stops, destination ids, text and list sizes", async () => {
  const d = await seedDestination("Auli", [79.57, 30.53]);
  const me = await createUser();
  const ok = { title: "My trip", destinations: [stopFor(d)] };
  const cases = [
    [{ ...ok, title: "ab" }, /Name/],
    [{ ...ok, title: { $ne: "" } }, /Name/],
    [{ ...ok, destinations: [] }, /1 to 20/],
    [{ ...ok, destinations: "Auli" }, /1 to 20/],
    [{ ...ok, destinations: Array.from({ length: 21 }, () => stopFor(d)) }, /1 to 20/],
    [{ ...ok, destinations: [{ destination: "nope" }] }, /valid destination/],
    [{ ...ok, destinations: [stopFor(d, { notes: "x".repeat(501) })] }, /notes/],
    [{ ...ok, destinations: [stopFor(d, { duration: "x".repeat(31) })] }, /duration/],
    [{ ...ok, destinations: [stopFor(d, { activities: Array.from({ length: 11 }, (_, i) => `a${i}`) })] }, /activities/],
    [{ ...ok, destinations: [stopFor(d, { activities: ["x".repeat(61)] })] }, /Activity|activity/],
    [{ ...ok, destinations: [stopFor(d, { days: 0 })] }, /days/],
    [{ ...ok, difficulty: "IMPOSSIBLE" }, /Difficulty/],
  ];
  for (const [body, message] of cases) {
    const res = await api.create(me, body);
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
    assert.match(res.body.message, message);
  }
  const ghost = await api.create(me, { title: "Ghost trip", destinations: [{ destination: String(oid()) }] });
  assert.equal(ghost.status, 400);
  assert.match(ghost.body.message, /does not exist/);
  assert.equal(await Itinerary.countDocuments(), 0);
});

test("one person cannot keep more than 100 itineraries", async () => {
  const d = await seedDestination("Auli", [79.57, 30.53]);
  const me = await createUser();
  await Itinerary.insertMany(Array.from({ length: 100 }, (_, i) => ({ title: `Trip ${i}`, creator: me.user._id, destinations: [{ destination: d._id }] })));
  const res = await api.create(me, { title: "One more", destinations: [stopFor(d)] });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /100/);
});

test("itineraries are private: others cannot list or open yours; templates are public", async () => {
  const d = await seedDestination("Auli", [79.57, 30.53]);
  const owner = await createUser();
  const stranger = await createUser();
  const admin = await createUser({ role: "admin" });
  const mine = await Itinerary.create({ title: "Private trip", creator: owner.user._id, destinations: [{ destination: d._id }] });
  const template = await Itinerary.create({ title: "Weekend in Auli", creator: admin.user._id, isTemplate: true, destinations: [{ destination: d._id }] });

  // public list: templates only
  const list = await api.templates();
  assert.deepEqual(list.body.data.map((i) => i.title), ["Weekend in Auli"]);
  assert.deepEqual((await api.byDestination(d._id)).body.data.map((i) => i.title), ["Weekend in Auli"]);

  // opening one
  assert.equal((await api.one(template._id)).status, 200); // anyone
  assert.equal((await api.one(mine._id)).status, 404); // logged out
  assert.equal((await api.one(mine._id, stranger)).status, 404); // a stranger sees "not found", not "forbidden"
  assert.equal((await api.one(mine._id, owner)).status, 200);
  assert.equal((await api.one(mine._id, admin)).status, 200);
  assert.equal((await api.one("nope")).status, 400);
  const bad = await request(app).get(`${base}/${template._id}`).set({ Authorization: "Bearer garbage" });
  assert.equal(bad.status, 200);

  // "my itineraries"
  assert.equal((await api.mine(owner.user._id, null)).status, 401);
  assert.equal((await api.mine(owner.user._id, stranger)).status, 403);
  assert.deepEqual((await api.mine(owner.user._id, owner)).body.data.map((i) => i.title), ["Private trip"]);
  assert.equal((await api.mine(owner.user._id, admin)).status, 200);

  // the full list is for admins only
  assert.equal((await api.all(owner)).status, 403);
  assert.equal((await api.all(admin)).body.data.length, 2);
});

test("only admins make templates", async () => {
  const d = await seedDestination("Auli", [79.57, 30.53]);
  const admin = await createUser({ role: "admin" });
  const res = await api.create(admin, { title: "Curated weekend", destinations: [stopFor(d)], isTemplate: true });
  assert.equal(res.body.data.isTemplate, true);
  assert.equal((await api.templates()).body.data.length, 1);
});

test("only the owner (or an admin) edits or deletes; edits are whitelisted; the creator can never change", async () => {
  const d1 = await seedDestination("Auli", [79.57, 30.53]);
  const d2 = await seedDestination("Kedarnath", [79.06, 30.73]);
  const owner = await createUser();
  const other = await createUser();
  const admin = await createUser({ role: "admin" });
  const trip = await Itinerary.create({ title: "Old name", creator: owner.user._id, destinations: [{ destination: d1._id, duration: "1 day" }] });

  assert.equal((await api.update(trip._id, null, { title: "Hacked" })).status, 401);
  assert.equal((await api.update(trip._id, other, { title: "Hacked" })).status, 403);

  const res = await api.update(trip._id, owner, {
    title: "New name", destinations: [stopFor(d2)], creator: String(other.user._id), isTemplate: true,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.title, "New name");
  assert.equal(res.body.data.destinations[0].destination.name, "Kedarnath");
  const saved = await Itinerary.findById(trip._id).lean();
  assert.equal(String(saved.creator), String(owner.user._id));
  assert.equal(saved.isTemplate, false);

  assert.equal((await api.update(trip._id, owner, { title: "x" })).status, 400);
  assert.equal((await api.update(trip._id, owner, { destinations: [{ destination: String(oid()) }] })).status, 400);
  assert.equal((await api.update(trip._id, owner, { difficulty: "EASY" })).status, 200); // partial update
  assert.equal((await api.update(String(oid()), owner, { title: "Nothing" })).status, 404);
  assert.equal((await api.update(trip._id, admin, { isTemplate: true })).body.data.isTemplate, true);

  assert.equal((await api.remove(trip._id, other)).status, 403);
  assert.equal((await api.remove(trip._id, owner)).status, 200);
  assert.equal((await api.remove(trip._id, owner)).status, 404);
  const another = await Itinerary.create({ title: "Another trip", creator: owner.user._id, destinations: [{ destination: d1._id }] });
  assert.equal((await api.remove(another._id, admin)).status, 200);
});

test("an itinerary whose creator is missing does not crash the server", async () => {
  const d = await seedDestination("Auli", [79.57, 30.53]);
  const me = await createUser();
  const orphan = await Itinerary.create({ title: "Orphan trip", destinations: [{ destination: d._id }] });
  assert.equal((await api.update(orphan._id, me, { title: "Mine now" })).status, 403);
  assert.equal((await api.remove(orphan._id, me)).status, 403);
  assert.equal((await api.one(orphan._id, me)).status, 404);
});
