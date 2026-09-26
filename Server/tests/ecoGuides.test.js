import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { createEcoGuideRouter } from "../Routes/ecoGuideRoutes.js";
import EcoGuide from "../Models/ecoGuideModel.js";

let app, media;
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  media = createFakeMedia();
  app = buildApp("/api/v1/eco-guides", createEcoGuideRouter({ media, limits: testLimits }));
});

const base = "/api/v1/eco-guides";
const png = () => ({ buf: Buffer.from("img"), opts: { filename: "c.png", contentType: "image/png" } });
const body = "Pack light, carry a refillable bottle and say no to single-use plastic wherever you go. ".repeat(4);

const valid = (extra = {}) => ({
  title: "Sustainable packing guide",
  category: "SUSTAINABLE_TIPS",
  content: body,
  tags: "Packing, Plastic-Free",
  ...extra,
});

async function seedGuide(admin, extra = {}) {
  return EcoGuide.create({ ...valid(), tags: ["packing"], author: admin.user._id, ...extra });
}

const api = {
  list: (qs = "", u) => request(app).get(`${base}${qs}`).set(u?.auth || {}),
  one: (id, u) => request(app).get(`${base}/${id}`).set(u?.auth || {}),
  create: (u, fields, files = []) => {
    let r = request(app).post(base).set(u?.auth || {});
    for (const [k, v] of Object.entries(fields)) r = r.field(k, String(v));
    for (const f of files) r = r.attach("image", f.buf, f.opts);
    return r;
  },
  update: (id, u, fields) => request(app).put(`${base}/${id}`).set(u?.auth || {}).send(fields),
  remove: (id, u) => request(app).delete(`${base}/${id}`).set(u?.auth || {}),
  like: (id, u) => request(app).post(`${base}/${id}/like`).set(u?.auth || {}),
  unlike: (id, u) => request(app).delete(`${base}/${id}/like`).set(u?.auth || {}),
  comment: (id, u, content) => request(app).post(`${base}/${id}/comments`).set(u?.auth || {}).send({ content }),
  uncomment: (id, cid, u) => request(app).delete(`${base}/${id}/comments/${cid}`).set(u?.auth || {}),
};

test("the list is public, newest first, and sends a short excerpt instead of the whole article", async () => {
  const admin = await createUser({ role: "admin" });
  await seedGuide(admin, { title: "Older guide", createdAt: new Date(Date.now() - 86_400_000) });
  await seedGuide(admin, { title: "Newer guide" });

  const res = await api.list();
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((g) => g.title), ["Newer guide", "Older guide"]);
  const card = res.body.data[0];
  assert.equal("content" in card, false);
  assert.ok(card.excerpt.length <= 200);
  assert.equal(card.author.username, admin.user.username);
  assert.equal(card.likeCount, 0);
  assert.equal(card.commentCount, 0);
  assert.ok(card.readMinutes >= 1);
  assert.equal(res.body.nextCursor, null);
});

test("the list can be filtered by category, tag and search, and search text is not a regex", async () => {
  const admin = await createUser({ role: "admin" });
  await seedGuide(admin, { title: "Reef friendly diving", category: "BEST_PRACTICES", tags: ["diving"] });
  await seedGuide(admin, { title: "Hidden Goa trails", category: "LOCAL_GUIDE", tags: ["goa"] });

  assert.deepEqual((await api.list("?category=BEST_PRACTICES")).body.data.map((g) => g.title), ["Reef friendly diving"]);
  assert.deepEqual((await api.list("?tag=goa")).body.data.map((g) => g.title), ["Hidden Goa trails"]);
  assert.deepEqual((await api.list("?search=REEF")).body.data.map((g) => g.title), ["Reef friendly diving"]);
  assert.equal((await api.list("?search=.*")).body.data.length, 0);
  assert.equal((await api.list("?category=NOPE")).status, 400);
});

test("the list is paged with a cursor", async () => {
  const admin = await createUser({ role: "admin" });
  for (let i = 0; i < 5; i += 1) await seedGuide(admin, { title: `Guide ${i}` });

  const first = await api.list("?limit=2");
  assert.equal(first.body.data.length, 2);
  assert.ok(first.body.nextCursor);
  const second = await api.list(`?limit=2&cursor=${first.body.nextCursor}`);
  assert.equal(second.body.data.length, 2);
  const third = await api.list(`?limit=2&cursor=${second.body.nextCursor}`);
  assert.equal(third.body.data.length, 1);
  assert.equal(third.body.nextCursor, null);
  const all = [...first.body.data, ...second.body.data, ...third.body.data].map((g) => g._id);
  assert.equal(new Set(all).size, 5);
});

test("one guide shows the full text and comments; bad or unknown ids are rejected", async () => {
  const admin = await createUser({ role: "admin" });
  const reader = await createUser();
  const guide = await seedGuide(admin, { comments: [{ user: reader.user._id, content: "Great tips" }] });

  const res = await api.one(guide._id);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.content, guide.content);
  assert.equal(res.body.data.comments[0].content, "Great tips");
  assert.equal(res.body.data.comments[0].user.username, reader.user.username);
  assert.equal(res.body.data.likedByMe, false);

  assert.equal((await api.one("nope")).status, 400);
  assert.equal((await api.one("64b7f0f5a3c1e2d4b5a6c7d8")).status, 404);
  // a bad token just means "not logged in" on public pages
  const bad = await request(app).get(`${base}/${guide._id}`).set({ Authorization: "Bearer garbage" });
  assert.equal(bad.status, 200);
});

test("only admins create guides; the author comes from the login and tags are cleaned", async () => {
  const admin = await createUser({ role: "admin" });
  const member = await createUser();

  assert.equal((await api.create(null, valid())).status, 401);
  assert.equal((await api.create(member, valid())).status, 403);

  const res = await api.create(admin, valid({ author: member.user._id, likes: "x" }));
  assert.equal(res.status, 201);
  assert.equal(res.body.data.author.username, admin.user.username);
  assert.deepEqual(res.body.data.tags, ["packing", "plastic-free"]);
  assert.equal(res.body.data.likeCount, 0);
});

test("create rejects bad input with a clear message", async () => {
  const admin = await createUser({ role: "admin" });
  for (const [extra, part] of [
    [{ title: "ab" }, "Title"],
    [{ category: "NOPE" }, "category"],
    [{ content: "too short" }, "Content"],
    [{ summary: "x".repeat(201) }, "Summary"],
    [{ tags: "a,b,c,d,e,f,g,h,i" }, "tags"],
  ]) {
    const res = await api.create(admin, valid(extra));
    assert.equal(res.status, 400, JSON.stringify(extra));
    assert.match(res.body.message, new RegExp(part, "i"));
  }
  assert.equal(await EcoGuide.countDocuments(), 0);
});

test("a cover photo is uploaded, replaced and removed with the guide", async () => {
  const admin = await createUser({ role: "admin" });
  const created = await api.create(admin, valid(), [png()]);
  assert.equal(created.status, 201);
  assert.equal(created.body.data.cover, "https://cdn.test/1");

  const id = created.body.data._id;
  const replaced = await api.create(admin, valid({ title: "Second guide" }), [png()]);
  assert.equal(replaced.status, 201);

  const text = await request(app).post(base).set(admin.auth).field("title", "Bad cover").attach("image", Buffer.from("x"), { filename: "a.pdf", contentType: "application/pdf" });
  assert.equal(text.status, 400);

  const del = await api.remove(id, admin);
  assert.equal(del.status, 200);
  assert.deepEqual(media.removed.map((m) => m.publicId), ["test/1"]);
  assert.equal(await EcoGuide.countDocuments({ _id: id }), 0);
});

test("admins can edit a guide but nobody can overwrite likes, comments or author", async () => {
  const admin = await createUser({ role: "admin" });
  const member = await createUser();
  const guide = await seedGuide(admin, { likes: [member.user._id] });

  assert.equal((await api.update(guide._id, member, { title: "Hacked title" })).status, 403);
  assert.equal((await api.update(guide._id, null, { title: "Hacked title" })).status, 401);

  const res = await api.update(guide._id, admin, { title: "Better title", likes: [], author: member.user._id, tags: "one,two" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.title, "Better title");
  assert.deepEqual(res.body.data.tags, ["one", "two"]);
  const saved = await EcoGuide.findById(guide._id);
  assert.equal(saved.likes.length, 1);
  assert.equal(String(saved.author), String(admin.user._id));
  assert.equal((await api.update(guide._id, admin, { title: "x" })).status, 400);
});

test("only admins delete guides", async () => {
  const admin = await createUser({ role: "admin" });
  const member = await createUser();
  const guide = await seedGuide(admin);
  assert.equal((await api.remove(guide._id, member)).status, 403);
  assert.equal((await api.remove(guide._id, admin)).status, 200);
  assert.equal((await api.remove(guide._id, admin)).status, 404);
});

test("likes are per person, idempotent, and counted correctly under a rush", async () => {
  const admin = await createUser({ role: "admin" });
  const guide = await seedGuide(admin);
  const fans = await Promise.all(Array.from({ length: 8 }, () => createUser()));

  assert.equal((await api.like(guide._id, null)).status, 401);
  await Promise.all(fans.flatMap((f) => [api.like(guide._id, f), api.like(guide._id, f)]));

  const res = await api.one(guide._id, fans[0]);
  assert.equal(res.body.data.likeCount, 8);
  assert.equal(res.body.data.likedByMe, true);

  const un = await api.unlike(guide._id, fans[0]);
  assert.equal(un.body.data.likeCount, 7);
  assert.equal(un.body.data.likedByMe, false);
  assert.equal((await api.unlike(guide._id, fans[0])).body.data.likeCount, 7);
  assert.equal((await api.like("64b7f0f5a3c1e2d4b5a6c7d8", fans[0])).status, 404);
});

test("logged-in people can comment; the author or an admin can remove a comment", async () => {
  const admin = await createUser({ role: "admin" });
  const a = await createUser();
  const b = await createUser();
  const guide = await seedGuide(admin);

  assert.equal((await api.comment(guide._id, null, "hi")).status, 401);
  assert.equal((await api.comment(guide._id, a, "   ")).status, 400);
  assert.equal((await api.comment(guide._id, a, "x".repeat(501))).status, 400);

  const made = await api.comment(guide._id, a, "  Very useful <b>tips</b>  ");
  assert.equal(made.status, 201);
  assert.equal(made.body.data.content, "Very useful <b>tips</b>"); // stored as text; the page shows it as text
  assert.equal(made.body.data.user.username, a.user.username);
  const commentId = made.body.data._id;

  assert.equal((await api.uncomment(guide._id, commentId, b)).status, 403);
  assert.equal((await api.uncomment(guide._id, commentId, a)).status, 200);
  assert.equal((await api.uncomment(guide._id, commentId, a)).status, 404);

  const second = await api.comment(guide._id, b, "Nice");
  assert.equal((await api.uncomment(guide._id, second.body.data._id, admin)).status, 200);
  assert.equal((await api.one(guide._id)).body.data.comments.length, 0);
});

test("a guide cannot collect more than 200 comments", async () => {
  const admin = await createUser({ role: "admin" });
  const a = await createUser();
  const guide = await seedGuide(admin, {
    comments: Array.from({ length: 200 }, (_, i) => ({ user: a.user._id, content: `c${i}` })),
  });
  const res = await api.comment(guide._id, a, "one too many");
  assert.equal(res.status, 400);
  assert.match(res.body.message, /200/);
});
