import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { createEventRouter } from "../Routes/eventRoutes.js";
import Event from "../Models/eventModel.js";

let app, media;
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  media = createFakeMedia();
  app = buildApp("/api/v1/events", createEventRouter({ media }));
});

const base = "/api/v1/events";
const day = 86_400_000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * day).toISOString();
const png = () => ({ buf: Buffer.from("img"), opts: { filename: "c.png", contentType: "image/png" } });

const valid = (extra = {}) => ({
  title: "Beach clean-up drive",
  type: "CLEANUP",
  description: "Join us to clean the beach and learn about plastic.",
  venue: "Juhu Beach, Mumbai",
  startDate: iso(10),
  endDate: iso(10.2),
  capacity: 5,
  ...extra,
});

// events are inserted directly so tests do not depend on the create endpoint
async function seedEvent(admin, extra = {}) {
  return Event.create({ ...valid(), organizer: admin.user._id, ...extra });
}
const api = {
  list: (qs = "", u) => request(app).get(`${base}${qs}`).set(u?.auth || {}),
  one: (id, u) => request(app).get(`${base}/${id}`).set(u?.auth || {}),
  create: (u, body, files = []) => {
    let r = request(app).post(base).set(u?.auth || {});
    for (const [k, v] of Object.entries(body)) r = r.field(k, String(v));
    for (const f of files) r = r.attach("image", f.buf, f.opts);
    return r;
  },
  update: (id, u, body) => request(app).put(`${base}/${id}`).set(u?.auth || {}).send(body),
  remove: (id, u) => request(app).delete(`${base}/${id}`).set(u?.auth || {}),
  register: (id, u) => request(app).post(`${base}/register/${id}`).set(u?.auth || {}),
  cancel: (id, u) => request(app).delete(`${base}/register/${id}`).set(u?.auth || {}),
  mine: (u) => request(app).get(`${base}/mine`).set(u?.auth || {}),
  attendees: (id, u) => request(app).get(`${base}/${id}/attendees`).set(u?.auth || {}),
};

test("the list is public, upcoming by default, and never exposes attendees", async () => {
  const admin = await createUser({ role: "admin" });
  const fan = await createUser();
  const future = await seedEvent(admin, { title: "Future" });
  await seedEvent(admin, { title: "Past", startDate: iso(-5), endDate: iso(-4.9) });
  await Event.updateOne({ _id: future._id }, { $push: { registeredUsers: { user: fan.user._id, registrationDate: new Date() } } });

  const res = await api.list();
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((e) => e.title), ["Future"]);
  const e = res.body.data[0];
  assert.equal(e.registeredCount, 1);
  assert.equal(e.spotsLeft, 4);
  assert.equal(e.isFull, false);
  assert.equal(e.isPast, false);
  assert.equal(e.registeredByMe, false);
  assert.equal(e.registeredUsers, undefined); // no attendee list
  assert.equal(e.organizer.email, undefined); // no organizer email
  assert.equal(e.organizer.username, admin.user.username);

  assert.equal((await api.list("", fan)).body.data[0].registeredByMe, true);
});

test("when=past / all, type filter, text search (safely) and bad filters", async () => {
  const admin = await createUser({ role: "admin" });
  await seedEvent(admin, { title: "Future workshop", type: "WORKSHOP" });
  await seedEvent(admin, { title: "Past festival", type: "FESTIVAL", startDate: iso(-5), endDate: iso(-4.9) });

  assert.deepEqual((await api.list("?when=past")).body.data.map((e) => e.title), ["Past festival"]);
  assert.equal((await api.list("?when=all")).body.data.length, 2);
  assert.deepEqual((await api.list("?when=all&type=WORKSHOP")).body.data.map((e) => e.title), ["Future workshop"]);
  assert.deepEqual((await api.list("?when=all&search=FESTIVAL")).body.data.map((e) => e.title), ["Past festival"]);
  assert.equal((await api.list("?when=all&search=.*(")).body.data.length, 0); // regex characters are literal
  assert.equal((await api.list("?type=NOPE")).status, 400);
  assert.equal((await api.list("?when=someday")).status, 400);
});

test("one event by id; unknown 404; malformed 400", async () => {
  const admin = await createUser({ role: "admin" });
  const ev = await seedEvent(admin);
  const ok = await api.one(ev._id);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.title, "Beach clean-up drive");
  assert.equal(ok.body.data.venue, "Juhu Beach, Mumbai");
  assert.equal((await api.one(new mongoose.Types.ObjectId())).status, 404);
  assert.equal((await api.one("abc")).status, 400);
});

test("only admins can create events; the organizer comes from the login, not the body", async () => {
  const admin = await createUser({ role: "admin" });
  const user = await createUser();
  assert.equal((await api.create(null, valid())).status, 401);
  assert.equal((await api.create(user, valid())).status, 403);

  const res = await api.create(admin, {
    ...valid(),
    organizer: String(user.user._id),
    registeredUsers: JSON.stringify([{ user: String(user.user._id) }]),
    impact: "Removes about 200 kg of plastic",
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const saved = await Event.findById(res.body.data._id);
  assert.equal(String(saved.organizer), String(admin.user._id));
  assert.equal(saved.registeredUsers.length, 0);
  assert.equal(saved.sustainabilityImpact.description, "Removes about 200 kg of plastic");
  assert.equal(saved.capacity, 5);
});

test("creating validates title, description, type, dates and capacity", async () => {
  const admin = await createUser({ role: "admin" });
  const bad = async (extra) => (await api.create(admin, valid(extra))).status;
  assert.equal(await bad({ title: "ab" }), 400);
  assert.equal(await bad({ title: "x".repeat(121) }), 400);
  assert.equal(await bad({ description: "short" }), 400);
  assert.equal(await bad({ type: "PARTY" }), 400);
  assert.equal(await bad({ startDate: "not a date" }), 400);
  assert.equal(await bad({ endDate: iso(9) }), 400); // ends before it starts
  assert.equal(await bad({ capacity: 0 }), 400);
  assert.equal(await bad({ capacity: 2.5 }), 400);
  assert.equal(await bad({ capacity: 100001 }), 400);
  assert.equal(await Event.countDocuments(), 0);
});

test("a cover photo is uploaded to the media service and stored", async () => {
  const admin = await createUser({ role: "admin" });
  const res = await api.create(admin, valid(), [png()]);
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(media.uploaded.length, 1);
  assert.deepEqual(res.body.data.images, [media.uploaded[0].url]);
  const bad = { buf: Buffer.from("x"), opts: { filename: "a.pdf", contentType: "application/pdf" } };
  assert.equal((await api.create(admin, valid(), [bad])).status, 400);
});

test("update: organizer/admin only, partial, cannot touch attendees, capacity cannot drop below registrations", async () => {
  const admin = await createUser({ role: "admin" });
  const other = await createUser({ role: "admin" });
  const user = await createUser();
  const ev = await seedEvent(admin);
  await api.register(ev._id, user);

  assert.equal((await api.update(ev._id, user, { title: "Hijacked" })).status, 403);
  const ok = await api.update(ev._id, admin, {
    title: "New title here",
    organizer: String(user.user._id),
    registeredUsers: [],
  });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const saved = await Event.findById(ev._id);
  assert.equal(saved.title, "New title here");
  assert.equal(String(saved.organizer), String(admin.user._id));
  assert.equal(saved.registeredUsers.length, 1);

  assert.equal((await api.update(ev._id, other, { capacity: 3 })).status, 200); // any admin may edit
  assert.equal((await api.update(ev._id, admin, { capacity: 0 })).status, 400);
  await api.register(ev._id, await createUser());
  assert.equal((await api.update(ev._id, admin, { capacity: 1 })).status, 400); // 2 already registered
  assert.equal((await api.update(ev._id, admin, { endDate: iso(1) })).status, 400); // before the start
  assert.equal((await api.update(new mongoose.Types.ObjectId(), admin, { title: "Nope nope" })).status, 404);
});

test("delete: organizer/admin only, removes the cover photo", async () => {
  const admin = await createUser({ role: "admin" });
  const user = await createUser();
  const created = await api.create(admin, valid(), [png()]);
  const id = created.body.data._id;

  assert.equal((await api.remove(id, user)).status, 403);
  assert.equal((await api.remove(id, admin)).status, 200);
  assert.equal(await Event.countDocuments(), 0);
  assert.equal(media.removed.length, 1);
  assert.equal((await api.remove(id, admin)).status, 404);
});

test("registering: works once, needs a login, respects ended events and unknown ids", async () => {
  const admin = await createUser({ role: "admin" });
  const user = await createUser();
  const ev = await seedEvent(admin);
  const ended = await seedEvent(admin, { startDate: iso(-3), endDate: iso(-2) });

  assert.equal((await api.register(ev._id)).status, 401);
  const first = await api.register(ev._id, user);
  assert.equal(first.status, 200);
  assert.equal(first.body.data.registeredCount, 1);
  assert.equal(first.body.data.registeredByMe, true);

  const again = await api.register(ev._id, user);
  assert.equal(again.status, 400);
  assert.match(again.body.message, /already/i);
  assert.equal((await api.register(ended._id, user)).status, 400);
  assert.match((await api.register(ended._id, user)).body.message, /ended/i);
  assert.equal((await api.register(new mongoose.Types.ObjectId(), user)).status, 404);
  assert.equal((await api.register("abc", user)).status, 400);
});

test("a full event refuses more people, and capacity holds under simultaneous sign-ups", async () => {
  const admin = await createUser({ role: "admin" });
  const ev = await seedEvent(admin, { capacity: 3 });
  const users = await Promise.all(Array.from({ length: 10 }, () => createUser()));

  const results = await Promise.all(users.map((u) => api.register(ev._id, u)));
  const ok = results.filter((r) => r.status === 200).length;
  assert.equal(ok, 3);
  assert.ok(results.filter((r) => r.status === 400).every((r) => /full/i.test(r.body.message)));
  assert.equal((await Event.findById(ev._id)).registeredUsers.length, 3);

  const listed = (await api.list()).body.data[0];
  assert.equal(listed.isFull, true);
  assert.equal(listed.spotsLeft, 0);
});

test("cancelling frees the spot and is safe to repeat", async () => {
  const admin = await createUser({ role: "admin" });
  const a = await createUser();
  const b = await createUser();
  const ev = await seedEvent(admin, { capacity: 1 });

  await api.register(ev._id, a);
  assert.equal((await api.register(ev._id, b)).status, 400);
  assert.equal((await api.cancel(ev._id, a)).status, 200);
  assert.equal((await api.cancel(ev._id, a)).status, 200);
  assert.equal((await api.register(ev._id, b)).status, 200);
  assert.equal((await api.cancel(ev._id)).status, 401);
});

test("'mine' lists the events I registered for, soonest first", async () => {
  const admin = await createUser({ role: "admin" });
  const me = await createUser();
  const later = await seedEvent(admin, { title: "Later", startDate: iso(20), endDate: iso(20.1) });
  const sooner = await seedEvent(admin, { title: "Sooner", startDate: iso(5), endDate: iso(5.1) });
  await seedEvent(admin, { title: "Not mine" });
  await api.register(later._id, me);
  await api.register(sooner._id, me);

  const res = await api.mine(me);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((e) => e.title), ["Sooner", "Later"]);
  assert.ok(res.body.data.every((e) => e.registeredByMe));
  assert.equal((await api.mine()).status, 401);
});

test("only the organizer/admin can see who registered (names and emails)", async () => {
  const admin = await createUser({ role: "admin" });
  const user = await createUser({ firstName: "Asha", lastName: "Rao" });
  const stranger = await createUser();
  const ev = await seedEvent(admin);
  await api.register(ev._id, user);

  assert.equal((await api.attendees(ev._id, stranger)).status, 403);
  assert.equal((await api.attendees(ev._id)).status, 401);
  const res = await api.attendees(ev._id, admin);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].username, user.user.username);
  assert.equal(res.body.data[0].email, user.user.email);
  assert.ok(res.body.data[0].registeredAt);
});

test("a logged-in user with a bad token still sees the public list", async () => {
  const admin = await createUser({ role: "admin" });
  await seedEvent(admin);
  const res = await request(app).get(base).set({ Authorization: "Bearer not-a-token" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 1);
});
