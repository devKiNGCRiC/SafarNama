import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { createStoryRouter } from "../Routes/storyRoutes.js";
import Story from "../Models/storyModel.js";
import ProfileModel from "../Models/profileModel.js";

let app, media;
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  media = createFakeMedia();
  app = buildApp("/api/v1/stories", createStoryRouter({ media, limits: testLimits }));
});

const base = "/api/v1/stories";
const png = () => ({ buf: Buffer.from("img"), opts: { filename: "s.png", contentType: "image/png" } });

const api = {
  create: (u, fields = {}, files = [png()]) => {
    let r = request(app).post(base).set(u?.auth || {});
    for (const [k, v] of Object.entries(fields)) r = r.field(k, String(v));
    for (const f of files) r = r.attach("media", f.buf, f.opts);
    return r;
  },
  feed: (u) => request(app).get(`${base}/feed`).set(u?.auth || {}),
  mine: (u) => request(app).get(`${base}/mine`).set(u?.auth || {}),
  view: (id, u) => request(app).post(`${base}/${id}/view`).set(u?.auth || {}),
  viewers: (id, u) => request(app).get(`${base}/${id}/viewers`).set(u?.auth || {}),
  remove: (id, u) => request(app).delete(`${base}/${id}`).set(u?.auth || {}),
};

async function follow(follower, followed) {
  await ProfileModel.findOneAndUpdate({ user: follower.user._id }, { $addToSet: { following: followed.user._id } }, { upsert: true });
  await ProfileModel.findOneAndUpdate({ user: followed.user._id }, { $addToSet: { followers: follower.user._id } }, { upsert: true });
}

test("every route needs a login", async () => {
  for (const call of [api.feed, api.mine]) assert.equal((await call(null)).status, 401);
  assert.equal((await api.create(null)).status, 401);
});

test("creating a story needs a photo or video, checks the caption, and stores it for 24 hours", async () => {
  const a = await createUser();
  const noFile = await api.create(a, {}, []);
  assert.equal(noFile.status, 400);
  assert.match(noFile.body.message, /photo or video/i);

  const tooLong = await api.create(a, { caption: "x".repeat(201) });
  assert.equal(tooLong.status, 400);

  const res = await api.create(a, { caption: "  Sunrise over the ghats  " });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.caption, "Sunrise over the ghats");
  assert.equal(res.body.data.media.type, "image");
  assert.equal(res.body.data.viewerCount, 0);
  assert.equal(res.body.data.viewedByMe, false);
  assert.equal(res.body.data.author.username, a.user.username);

  const saved = await Story.findById(res.body.data._id);
  const hours = (saved.expiresAt - saved.createdAt) / 3_600_000;
  assert.ok(hours > 23.9 && hours < 24.1, `expiry was ${hours}h away`);

  const pdf = await request(app).post(base).set(a.auth).attach("media", Buffer.from("x"), { filename: "a.pdf", contentType: "application/pdf" });
  assert.equal(pdf.status, 400);
  assert.equal(await Story.countDocuments(), 1);
});

test("if saving fails after the upload, the uploaded file is cleaned up", async () => {
  const a = await createUser();
  const original = Story.create;
  Story.create = async () => {
    throw new Error("db down");
  };
  try {
    assert.equal((await api.create(a)).status, 500);
  } finally {
    Story.create = original;
  }
  assert.deepEqual(media.removed.map((m) => m.publicId), ["test/1"]);
});

test("the feed shows your own stories and the people you follow, grouped, in viewing order", async () => {
  const me = await createUser();
  const friend = await createUser();
  const stranger = await createUser();
  await follow(me, friend);

  await api.create(friend, { caption: "First" });
  await api.create(friend, { caption: "Second" });
  await api.create(me, { caption: "Mine" });
  await api.create(stranger, { caption: "Not followed" });

  const res = await api.feed(me);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 2); // me + friend, never the stranger
  assert.equal(res.body.data[0].author.username, me.user.username); // your own ring leads
  assert.deepEqual(res.body.data[1].stories.map((s) => s.caption), ["First", "Second"]); // oldest first within a group
  assert.equal(res.body.data[1].hasUnseen, true);
});

test("unseen authors are listed before already-seen ones (after your own)", async () => {
  const me = await createUser();
  const seen = await createUser();
  const unseen = await createUser();
  await follow(me, seen);
  await follow(me, unseen);
  const seenStory = (await api.create(seen, {})).body.data;
  await api.create(unseen, {});
  await api.view(seenStory._id, me);

  const order = (await api.feed(me)).body.data.map((g) => g.author.username);
  assert.deepEqual(order, [unseen.user.username, seen.user.username]);
});

test("expired stories never appear in the feed, in 'mine', or anywhere else", async () => {
  const me = await createUser();
  const created = (await api.create(me, {})).body.data;
  await Story.updateOne({ _id: created._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

  assert.equal((await api.feed(me)).body.data.length, 0);
  assert.equal((await api.mine(me)).body.data.length, 0);
  assert.equal((await api.view(created._id, me)).status, 404);
});

test("expired stories' media is cleaned up from storage, once, without double-removal", async () => {
  const me = await createUser();
  const created = (await api.create(me, {})).body.data;
  await Story.updateOne({ _id: created._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

  await api.feed(me); // triggers the opportunistic cleanup
  await new Promise((r) => setTimeout(r, 50)); // cleanup runs fire-and-forget
  assert.deepEqual(media.removed.map((m) => m.publicId), ["test/1"]);

  await api.feed(me); // a second pass must not remove it again
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(media.removed.length, 1);
});

test("watching a story records the viewer once, idempotently, and only the author sees who watched", async () => {
  const author = await createUser();
  const fan = await createUser();
  const other = await createUser();
  const story = (await api.create(author, {})).body.data;

  assert.equal((await api.view("64b7f0f5a3c1e2d4b5a6c7d8", fan)).status, 404);
  const first = await api.view(story._id, fan);
  assert.equal(first.status, 200);
  assert.equal(first.body.data.viewerCount, 1);
  const again = await api.view(story._id, fan);
  assert.equal(again.body.data.viewerCount, 1);

  assert.equal((await api.viewers(story._id, other)).status, 403);
  const list = await api.viewers(story._id, author);
  assert.equal(list.status, 200);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].user.username, fan.user.username);
});

test("the author (or an admin) can delete a story; everyone else is refused", async () => {
  const author = await createUser();
  const other = await createUser();
  const admin = await createUser({ role: "admin" });
  const s1 = (await api.create(author, {})).body.data;
  const s2 = (await api.create(author, {})).body.data;

  assert.equal((await api.remove(s1._id, other)).status, 403);
  assert.equal((await api.remove(s1._id, author)).status, 200);
  assert.deepEqual(media.removed.map((m) => m.publicId), ["test/1"]);
  assert.equal((await api.remove(s1._id, author)).status, 404);
  assert.equal((await api.remove(s2._id, admin)).status, 200);
});

test("'mine' lists only your own active stories, oldest first", async () => {
  const me = await createUser();
  const other = await createUser();
  await api.create(me, { caption: "One" });
  await api.create(me, { caption: "Two" });
  await api.create(other, { caption: "Not mine" });
  const res = await api.mine(me);
  assert.deepEqual(res.body.data.map((s) => s.caption), ["One", "Two"]);
});
