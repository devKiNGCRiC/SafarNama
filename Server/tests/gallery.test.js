import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { createGalleryRouter } from "../Routes/galleryRoutes.js";
import GalleryPhoto from "../Models/galleryPhotoModel.js";

let app, media;
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  media = createFakeMedia();
  app = buildApp("/api/v1/gallery", createGalleryRouter({ media, limits: testLimits }));
});

const base = "/api/v1/gallery";
const png = () => ({ buf: Buffer.from("img"), opts: { filename: "p.png", contentType: "image/png" } });

async function seedPhoto(owner, extra = {}) {
  return GalleryPhoto.create({
    owner: owner.user._id,
    url: "https://cdn.test/seed",
    publicId: `seed/${Math.random()}`,
    width: 800,
    height: 600,
    caption: "Sunrise at Tiger Hill",
    location: "Darjeeling",
    ...extra,
  });
}

const api = {
  list: (qs = "", u) => request(app).get(`${base}${qs}`).set(u?.auth || {}),
  one: (id, u) => request(app).get(`${base}/${id}`).set(u?.auth || {}),
  upload: (u, fields = {}, files = [png()]) => {
    let r = request(app).post(base).set(u?.auth || {});
    for (const [k, v] of Object.entries(fields)) r = r.field(k, String(v));
    for (const f of files) r = r.attach("photo", f.buf, f.opts);
    return r;
  },
  update: (id, u, body) => request(app).put(`${base}/${id}`).set(u?.auth || {}).send(body),
  remove: (id, u) => request(app).delete(`${base}/${id}`).set(u?.auth || {}),
  like: (id, u) => request(app).post(`${base}/${id}/like`).set(u?.auth || {}),
  unlike: (id, u) => request(app).delete(`${base}/${id}/like`).set(u?.auth || {}),
  comment: (id, u, content) => request(app).post(`${base}/${id}/comments`).set(u?.auth || {}).send({ content }),
  uncomment: (id, cid, u) => request(app).delete(`${base}/${id}/comments/${cid}`).set(u?.auth || {}),
};

test("the wall is public, newest first, and shows owner, counts and the picture shape", async () => {
  const a = await createUser();
  await seedPhoto(a, { caption: "First" });
  await seedPhoto(a, { caption: "Second" });

  const res = await api.list();
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["Second", "First"]);
  const p = res.body.data[0];
  assert.equal(p.owner.username, a.user.username);
  assert.equal(p.likeCount, 0);
  assert.equal(p.commentCount, 0);
  assert.equal(p.likedByMe, false);
  assert.equal(p.width, 800);
  assert.equal("publicId" in p, false); // storage details stay private
  assert.equal(res.body.nextCursor, null);
});

test("the wall can show one person's album, and can be searched (text is not a regex)", async () => {
  const a = await createUser({ username: "asha_trails" });
  const b = await createUser({ username: "ben_treks" });
  await seedPhoto(a, { caption: "Backwaters", location: "Alleppey" });
  await seedPhoto(b, { caption: "Snow", location: "Manali" });

  assert.deepEqual((await api.list("?user=asha_trails")).body.data.map((p) => p.caption), ["Backwaters"]);
  assert.equal((await api.list("?user=nobody_here")).body.data.length, 0);
  assert.deepEqual((await api.list("?search=manali")).body.data.map((p) => p.caption), ["Snow"]);
  assert.deepEqual((await api.list("?search=BACKW")).body.data.map((p) => p.caption), ["Backwaters"]);
  assert.equal((await api.list("?search=.*")).body.data.length, 0);
});

test("the wall is paged with a cursor and never repeats a photo", async () => {
  const a = await createUser();
  for (let i = 0; i < 5; i += 1) await seedPhoto(a, { caption: `P${i}` });
  const first = await api.list("?limit=2");
  const second = await api.list(`?limit=2&cursor=${first.body.nextCursor}`);
  const third = await api.list(`?limit=2&cursor=${second.body.nextCursor}`);
  assert.deepEqual([first, second, third].map((r) => r.body.data.length), [2, 2, 1]);
  assert.equal(third.body.nextCursor, null);
  const ids = [first, second, third].flatMap((r) => r.body.data.map((p) => p._id));
  assert.equal(new Set(ids).size, 5);
  assert.equal((await api.list("?limit=0")).status, 400);
});

test("one photo shows its comments; bad or unknown ids are rejected; a bad token is just 'logged out'", async () => {
  const a = await createUser();
  const b = await createUser();
  const photo = await seedPhoto(a, { comments: [{ user: b.user._id, content: "Stunning" }] });

  const res = await api.one(photo._id);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.comments[0].content, "Stunning");
  assert.equal(res.body.data.comments[0].user.username, b.user.username);
  assert.equal((await api.one("nope")).status, 400);
  assert.equal((await api.one("64b7f0f5a3c1e2d4b5a6c7d8")).status, 404);
  const bad = await request(app).get(`${base}/${photo._id}`).set({ Authorization: "Bearer garbage" });
  assert.equal(bad.status, 200);
});

test("only logged-in people upload; the owner comes from the login; caption and place are checked", async () => {
  assert.equal((await api.upload(null, { caption: "x" })).status, 401);

  const a = await createUser();
  const ok = await api.upload(a, { caption: "  Golden hour  ", location: "Hampi", owner: "someone-else" });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.data.caption, "Golden hour");
  assert.equal(ok.body.data.location, "Hampi");
  assert.equal(ok.body.data.owner.username, a.user.username);
  assert.equal(ok.body.data.url, "https://cdn.test/1");
  assert.equal(ok.body.data.width, 100);

  assert.equal((await api.upload(a, { caption: "x".repeat(301) })).status, 400);
  assert.equal((await api.upload(a, { location: "x".repeat(81) })).status, 400);
  assert.equal((await api.upload(a, {}, [])).status, 400); // no file

  const pdf = await request(app).post(base).set(a.auth).attach("photo", Buffer.from("x"), { filename: "a.pdf", contentType: "application/pdf" });
  assert.equal(pdf.status, 400);
  assert.equal(await GalleryPhoto.countDocuments(), 1);
});

test("if saving fails after the upload, the uploaded picture is cleaned up", async () => {
  const a = await createUser();
  const original = GalleryPhoto.create;
  GalleryPhoto.create = async () => {
    throw new Error("db down");
  };
  try {
    const res = await api.upload(a, { caption: "x" });
    assert.equal(res.status, 500);
  } finally {
    GalleryPhoto.create = original;
  }
  assert.deepEqual(media.removed.map((m) => m.publicId), ["test/1"]);
});

test("one person cannot hold more than 300 photos", async () => {
  const a = await createUser();
  await GalleryPhoto.insertMany(
    Array.from({ length: 300 }, (_, i) => ({ owner: a.user._id, url: `https://cdn.test/${i}`, publicId: `p/${i}` })),
  );
  const res = await api.upload(a, { caption: "one more" });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /300/);
  assert.equal(media.uploaded.length, 0); // rejected before anything was uploaded
});

test("only the owner edits caption and place; nothing else can be overwritten", async () => {
  const a = await createUser();
  const b = await createUser();
  const photo = await seedPhoto(a, { likes: [b.user._id] });

  assert.equal((await api.update(photo._id, null, { caption: "Hi" })).status, 401);
  assert.equal((await api.update(photo._id, b, { caption: "Hacked" })).status, 403);

  const res = await api.update(photo._id, a, { caption: "Better caption", location: "Hampi", owner: b.user._id, likes: [], url: "http://evil" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.caption, "Better caption");
  const saved = await GalleryPhoto.findById(photo._id);
  assert.equal(saved.likes.length, 1);
  assert.equal(String(saved.owner), String(a.user._id));
  assert.equal(saved.url, "https://cdn.test/seed");
  assert.equal((await api.update(photo._id, a, { caption: "x".repeat(301) })).status, 400);
  assert.equal((await api.update(photo._id, a, { caption: "" })).status, 200); // captions are optional
});

test("the owner or an admin deletes a photo, and the stored picture goes too", async () => {
  const a = await createUser();
  const b = await createUser();
  const admin = await createUser({ role: "admin" });
  const p1 = await seedPhoto(a, { publicId: "seed/one" });
  const p2 = await seedPhoto(a, { publicId: "seed/two" });

  assert.equal((await api.remove(p1._id, b)).status, 403);
  assert.equal((await api.remove(p1._id, a)).status, 200);
  assert.equal((await api.remove(p2._id, admin)).status, 200);
  assert.deepEqual(media.removed.map((m) => m.publicId), ["seed/one", "seed/two"]);
  assert.equal((await api.remove(p1._id, a)).status, 404);
});

test("likes are per person, idempotent, and exact under a rush", async () => {
  const a = await createUser();
  const photo = await seedPhoto(a);
  const fans = await Promise.all(Array.from({ length: 8 }, () => createUser()));

  assert.equal((await api.like(photo._id, null)).status, 401);
  await Promise.all(fans.flatMap((f) => [api.like(photo._id, f), api.like(photo._id, f)]));
  const res = await api.one(photo._id, fans[0]);
  assert.equal(res.body.data.likeCount, 8);
  assert.equal(res.body.data.likedByMe, true);

  const un = await api.unlike(photo._id, fans[0]);
  assert.equal(un.body.data.likeCount, 7);
  assert.equal((await api.unlike(photo._id, fans[0])).body.data.likeCount, 7);
  assert.equal((await api.like("64b7f0f5a3c1e2d4b5a6c7d8", fans[0])).status, 404);
});

test("anyone logged in can comment on anyone's photo; owner, author or admin can remove a comment", async () => {
  const owner = await createUser();
  const a = await createUser();
  const b = await createUser();
  const admin = await createUser({ role: "admin" });
  const photo = await seedPhoto(owner);

  assert.equal((await api.comment(photo._id, null, "hi")).status, 401);
  assert.equal((await api.comment(photo._id, a, "   ")).status, 400);
  assert.equal((await api.comment(photo._id, a, "x".repeat(501))).status, 400);

  const c1 = await api.comment(photo._id, a, "  Lovely <i>shot</i>  ");
  assert.equal(c1.status, 201);
  assert.equal(c1.body.data.content, "Lovely <i>shot</i>");
  assert.equal(c1.body.data.user.username, a.user.username);

  assert.equal((await api.uncomment(photo._id, c1.body.data._id, b)).status, 403);
  assert.equal((await api.uncomment(photo._id, c1.body.data._id, a)).status, 200);
  assert.equal((await api.uncomment(photo._id, c1.body.data._id, a)).status, 404);

  const c2 = await api.comment(photo._id, b, "Nice");
  assert.equal((await api.uncomment(photo._id, c2.body.data._id, owner)).status, 200); // photo owner moderates
  const c3 = await api.comment(photo._id, b, "Again");
  assert.equal((await api.uncomment(photo._id, c3.body.data._id, admin)).status, 200);
  assert.equal((await api.one(photo._id)).body.data.comments.length, 0);
});

test("a photo cannot collect more than 200 comments", async () => {
  const a = await createUser();
  const photo = await seedPhoto(a, { comments: Array.from({ length: 200 }, (_, i) => ({ user: a.user._id, content: `c${i}` })) });
  const res = await api.comment(photo._id, a, "one too many");
  assert.equal(res.status, 400);
  assert.match(res.body.message, /200/);
});
