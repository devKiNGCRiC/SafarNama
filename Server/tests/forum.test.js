import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeRealtime } from "./helpers/fakeRealtime.js";
import { testLimits } from "./helpers/limits.js";
import { createForumRouter } from "../Routes/forumRoutes.js";
import { configureNotifier } from "../services/notifier.js";
import ForumThread from "../Models/forumThreadModel.js";
import ForumReply from "../Models/forumReplyModel.js";
import Notification from "../Models/notificationModel.js";
import { createNotificationRouter } from "../Routes/notificationRoutes.js";
import express from "express";
import errorHandler from "../Middleware/errorHandler.js";

let app, realtime;
before(async () => {
  await connectTestDb();
  await Notification.init();
});
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  realtime = createFakeRealtime();
  configureNotifier(realtime);
  app = express();
  app.use(express.json());
  app.use("/api/v1/forum", createForumRouter({ limits: testLimits }));
  app.use("/api/v1/notifications", createNotificationRouter());
  app.use(errorHandler);
});

const base = "/api/v1/forum";
const valid = (extra = {}) => ({
  title: "Best time to visit Coorg?",
  content: "Planning a trip with two kids. When is the weather good and the crowds small?",
  category: "TRIP_HELP",
  tags: "Coorg, Monsoon",
  ...extra,
});

async function seedThread(author, extra = {}) {
  return ForumThread.create({ ...valid(), tags: ["coorg"], author: author.user._id, ...extra });
}

const api = {
  list: (qs = "", u) => request(app).get(`${base}/threads${qs}`).set(u?.auth || {}),
  one: (id, u) => request(app).get(`${base}/threads/${id}`).set(u?.auth || {}),
  create: (u, body) => request(app).post(`${base}/threads`).set(u?.auth || {}).send(body),
  edit: (id, u, body) => request(app).patch(`${base}/threads/${id}`).set(u?.auth || {}).send(body),
  remove: (id, u) => request(app).delete(`${base}/threads/${id}`).set(u?.auth || {}),
  like: (id, u) => request(app).post(`${base}/threads/${id}/like`).set(u?.auth || {}),
  unlike: (id, u) => request(app).delete(`${base}/threads/${id}/like`).set(u?.auth || {}),
  save: (id, u) => request(app).post(`${base}/threads/${id}/save`).set(u?.auth || {}),
  unsave: (id, u) => request(app).delete(`${base}/threads/${id}/save`).set(u?.auth || {}),
  pin: (id, u) => request(app).post(`${base}/threads/${id}/pin`).set(u?.auth || {}),
  unpin: (id, u) => request(app).delete(`${base}/threads/${id}/pin`).set(u?.auth || {}),
  lock: (id, u) => request(app).post(`${base}/threads/${id}/lock`).set(u?.auth || {}),
  unlock: (id, u) => request(app).delete(`${base}/threads/${id}/lock`).set(u?.auth || {}),
  replies: (id, qs = "", u) => request(app).get(`${base}/threads/${id}/replies${qs}`).set(u?.auth || {}),
  reply: (id, u, content) => request(app).post(`${base}/threads/${id}/replies`).set(u?.auth || {}).send({ content }),
  editReply: (rid, u, content) => request(app).patch(`${base}/replies/${rid}`).set(u?.auth || {}).send({ content }),
  removeReply: (rid, u) => request(app).delete(`${base}/replies/${rid}`).set(u?.auth || {}),
  likeReply: (rid, u) => request(app).post(`${base}/replies/${rid}/like`).set(u?.auth || {}),
  unlikeReply: (rid, u) => request(app).delete(`${base}/replies/${rid}/like`).set(u?.auth || {}),
  accept: (id, rid, u) => request(app).post(`${base}/threads/${id}/accept/${rid}`).set(u?.auth || {}),
  unaccept: (id, u) => request(app).delete(`${base}/threads/${id}/accept`).set(u?.auth || {}),
};

test("the thread list is public, newest first, with short excerpts and counts", async () => {
  const a = await createUser();
  await seedThread(a, { title: "Older" });
  await seedThread(a, { title: "Newer", content: "x".repeat(600) });

  const res = await api.list();
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((t) => t.title), ["Newer", "Older"]);
  const card = res.body.data[0];
  assert.equal("content" in card, false);
  assert.ok(card.excerpt.length <= 200);
  assert.equal(card.author.username, a.user.username);
  assert.equal(card.replyCount, 0);
  assert.equal(card.likeCount, 0);
  assert.equal(card.isPinned, false);
  assert.equal(card.hasAcceptedAnswer, false);
  assert.equal(res.body.nextCursor, null);
});

test("the list filters by category, tag and search (not a regex), and shows saved and own threads", async () => {
  const a = await createUser();
  const b = await createUser();
  const t1 = await seedThread(a, { title: "Plastic free trekking", category: "ECO_PRACTICES", tags: ["plastic"] });
  await seedThread(b, { title: "Goa meetup", category: "MEETUPS", tags: ["goa"] });

  const titles = async (qs, u) => (await api.list(qs, u)).body.data.map((t) => t.title);
  assert.deepEqual(await titles("?category=MEETUPS"), ["Goa meetup"]);
  assert.deepEqual(await titles("?tag=plastic"), ["Plastic free trekking"]);
  assert.deepEqual(await titles("?search=TREKKING"), ["Plastic free trekking"]);
  assert.deepEqual(await titles("?search=.*"), []);
  assert.equal((await api.list("?category=NOPE")).status, 400);

  await api.save(t1._id, b);
  assert.deepEqual(await titles("?saved=1", b), ["Plastic free trekking"]);
  assert.equal((await api.list("?saved=1")).status, 401); // saved list needs a login
  assert.deepEqual(await titles("?mine=1", b), ["Goa meetup"]);
});

test("pinned threads come first on the first page only; the rest are paged without repeats", async () => {
  const admin = await createUser({ role: "admin" });
  const a = await createUser();
  for (let i = 0; i < 4; i += 1) await seedThread(a, { title: `T${i}` });
  const pinned = await seedThread(a, { title: "Rules", pinned: true });

  const first = await api.list("?limit=2");
  assert.deepEqual(first.body.data.map((t) => t.title), ["Rules", "T3", "T2"]);
  const second = await api.list(`?limit=2&cursor=${first.body.nextCursor}`);
  assert.deepEqual(second.body.data.map((t) => t.title), ["T1", "T0"]);
  assert.equal(second.body.nextCursor, null);
  assert.equal(first.body.data[0]._id, String(pinned._id));
  assert.equal(first.body.data[0].isPinned, true);
  assert.ok(admin);
});

test("one thread shows its full text; bad ids and unknown threads are handled; a bad token is 'logged out'", async () => {
  const a = await createUser();
  const t = await seedThread(a);
  const res = await api.one(t._id);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.content, t.content);
  assert.equal(res.body.data.likedByMe, false);
  assert.equal(res.body.data.savedByMe, false);
  assert.equal((await api.one("nope")).status, 400);
  assert.equal((await api.one("64b7f0f5a3c1e2d4b5a6c7d8")).status, 404);
  const bad = await request(app).get(`${base}/threads/${t._id}`).set({ Authorization: "Bearer garbage" });
  assert.equal(bad.status, 200);
});

test("logged-in people start threads; author comes from the login; input is cleaned and checked", async () => {
  assert.equal((await api.create(null, valid())).status, 401);
  const a = await createUser();
  const ok = await api.create(a, valid({ author: "someone", likes: ["x"], pinned: true, locked: true, replyCount: 99 }));
  assert.equal(ok.status, 201);
  assert.equal(ok.body.data.author.username, a.user.username);
  assert.deepEqual(ok.body.data.tags, ["coorg", "monsoon"]);
  assert.equal(ok.body.data.isPinned, false);
  assert.equal(ok.body.data.isLocked, false);
  assert.equal(ok.body.data.replyCount, 0);

  for (const [extra, part] of [
    [{ title: "ab" }, "Title"],
    [{ content: "short" }, "Content"],
    [{ category: "NOPE" }, "category"],
    [{ tags: "a,b,c,d,e,f" }, "tags"],
    [{ title: { $ne: "" } }, "Title"],
  ]) {
    const res = await api.create(a, valid(extra));
    assert.equal(res.status, 400, JSON.stringify(extra));
    assert.match(res.body.message, new RegExp(part, "i"));
  }
  assert.equal(await ForumThread.countDocuments(), 1);
});

test("authors edit their thread, others cannot, admins can; protected fields never change", async () => {
  const a = await createUser();
  const b = await createUser();
  const admin = await createUser({ role: "admin" });
  const t = await seedThread(a);

  assert.equal((await api.edit(t._id, null, { title: "New title here" })).status, 401);
  assert.equal((await api.edit(t._id, b, { title: "Hijacked title" })).status, 403);

  const res = await api.edit(t._id, a, { title: "Updated title here", pinned: true, author: b.user._id, replyCount: 50 });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.title, "Updated title here");
  assert.equal(res.body.data.isPinned, false);
  const saved = await ForumThread.findById(t._id);
  assert.equal(String(saved.author), String(a.user._id));
  assert.equal(saved.replyCount, 0);
  assert.ok(res.body.data.editedAt);

  assert.equal((await api.edit(t._id, admin, { content: "Edited by a moderator for clarity." })).status, 200);
  assert.equal((await api.edit(t._id, a, { title: "x" })).status, 400);
});

test("authors and admins delete a thread and all its replies; others cannot", async () => {
  const a = await createUser();
  const b = await createUser();
  const admin = await createUser({ role: "admin" });
  const t1 = await seedThread(a);
  const t2 = await seedThread(a);
  await api.reply(t1._id, b, "An answer");

  assert.equal((await api.remove(t1._id, b)).status, 403);
  assert.equal((await api.remove(t1._id, a)).status, 200);
  assert.equal(await ForumReply.countDocuments({ thread: t1._id }), 0);
  assert.equal(await Notification.countDocuments({ thread: t1._id }), 0);
  assert.equal((await api.remove(t2._id, admin)).status, 200);
  assert.equal((await api.remove(t2._id, admin)).status, 404);
});

test("likes and saves are per person, idempotent and exact under a rush", async () => {
  const a = await createUser();
  const t = await seedThread(a);
  const fans = await Promise.all(Array.from({ length: 8 }, () => createUser()));

  assert.equal((await api.like(t._id, null)).status, 401);
  await Promise.all(fans.flatMap((f) => [api.like(t._id, f), api.like(t._id, f)]));
  const res = await api.one(t._id, fans[0]);
  assert.equal(res.body.data.likeCount, 8);
  assert.equal(res.body.data.likedByMe, true);
  assert.equal((await api.unlike(t._id, fans[0])).body.data.likeCount, 7);
  assert.equal((await api.unlike(t._id, fans[0])).body.data.likeCount, 7);

  assert.equal((await api.save(t._id, fans[1])).body.data.savedByMe, true);
  assert.equal((await api.save(t._id, fans[1])).body.data.savedByMe, true);
  assert.equal((await ForumThread.findById(t._id)).bookmarks.length, 1);
  assert.equal((await api.unsave(t._id, fans[1])).body.data.savedByMe, false);
  assert.equal((await api.like("64b7f0f5a3c1e2d4b5a6c7d8", fans[0])).status, 404);
});

test("only admins pin and lock threads", async () => {
  const admin = await createUser({ role: "admin" });
  const a = await createUser();
  const t = await seedThread(a);

  for (const call of [api.pin, api.lock, api.unpin, api.unlock]) {
    assert.equal((await call(t._id, null)).status, 401);
    assert.equal((await call(t._id, a)).status, 403);
  }
  assert.equal((await api.pin(t._id, admin)).body.data.isPinned, true);
  assert.equal((await api.lock(t._id, admin)).body.data.isLocked, true);
  assert.equal((await api.unpin(t._id, admin)).body.data.isPinned, false);
  assert.equal((await api.unlock(t._id, admin)).body.data.isLocked, false);
});

test("replying: logged-in only, counted exactly, thread author is notified, oldest first", async () => {
  const a = await createUser();
  const b = await createUser();
  const t = await seedThread(a);

  assert.equal((await api.reply(t._id, null, "hello")).status, 401);
  assert.equal((await api.reply(t._id, b, "   ")).status, 400);
  assert.equal((await api.reply(t._id, b, "x".repeat(2001))).status, 400);
  assert.equal((await api.reply("64b7f0f5a3c1e2d4b5a6c7d8", b, "hi")).status, 404);

  const r1 = await api.reply(t._id, b, "  Go in October, <b>fewer crowds</b>  ");
  assert.equal(r1.status, 201);
  assert.equal(r1.body.data.content, "Go in October, <b>fewer crowds</b>");
  assert.equal(r1.body.data.author.username, b.user.username);
  await api.reply(t._id, a, "Thanks!"); // own reply must not notify yourself

  const many = await Promise.all(Array.from({ length: 6 }, () => createUser()));
  await Promise.all(many.map((u) => api.reply(t._id, u, "Me too")));
  const saved = await ForumThread.findById(t._id);
  assert.equal(saved.replyCount, 8);
  assert.ok(saved.lastReplyAt);
  assert.equal((await api.one(t._id)).body.data.replyCount, 8);

  const list = await api.replies(t._id);
  assert.equal(list.body.data[0].content, "Go in October, <b>fewer crowds</b>");
  assert.equal(list.body.data.length, 8);

  // the thread author is told about replies from others, never about their own
  const notes = await Notification.find({ recipient: a.user._id, type: "reply" });
  assert.equal(notes.length, 7);
  assert.ok(notes.every((n) => String(n.thread) === String(t._id)));
  assert.equal(realtime.recipientsOf("notification:new").length, 7);
  const inbox = await request(app).get("/api/v1/notifications").set(a.auth);
  assert.equal(inbox.body.data[0].thread.title, t.title);
});

test("replies are paged oldest-first with a cursor", async () => {
  const a = await createUser();
  const t = await seedThread(a);
  for (let i = 0; i < 5; i += 1) await ForumReply.create({ thread: t._id, author: a.user._id, content: `R${i}` });

  const first = await api.replies(t._id, "?limit=2");
  assert.deepEqual(first.body.data.map((r) => r.content), ["R0", "R1"]);
  const second = await api.replies(t._id, `?limit=2&cursor=${first.body.nextCursor}`);
  assert.deepEqual(second.body.data.map((r) => r.content), ["R2", "R3"]);
  const third = await api.replies(t._id, `?limit=2&cursor=${second.body.nextCursor}`);
  assert.deepEqual(third.body.data.map((r) => r.content), ["R4"]);
  assert.equal(third.body.nextCursor, null);
  assert.equal((await api.replies("nope")).status, 400);
  assert.equal((await api.replies("64b7f0f5a3c1e2d4b5a6c7d8")).status, 404);
});

test("a locked thread accepts no new replies, but still shows the old ones", async () => {
  const admin = await createUser({ role: "admin" });
  const a = await createUser();
  const t = await seedThread(a);
  await api.reply(t._id, a, "first");
  await api.lock(t._id, admin);

  const res = await api.reply(t._id, a, "second");
  assert.equal(res.status, 403);
  assert.match(res.body.message, /locked/i);
  assert.equal((await api.replies(t._id)).body.data.length, 1);
  assert.equal((await ForumThread.findById(t._id)).replyCount, 1);
  await api.unlock(t._id, admin);
  assert.equal((await api.reply(t._id, a, "second")).status, 201);
});

test("reply authors edit and delete their own; thread owner and admins can delete too; counts stay right", async () => {
  const owner = await createUser();
  const a = await createUser();
  const b = await createUser();
  const admin = await createUser({ role: "admin" });
  const t = await seedThread(owner);
  const r1 = (await api.reply(t._id, a, "Reply one")).body.data;
  const r2 = (await api.reply(t._id, a, "Reply two")).body.data;
  const r3 = (await api.reply(t._id, a, "Reply three")).body.data;

  assert.equal((await api.editReply(r1._id, b, "Hijacked reply")).status, 403);
  const edited = await api.editReply(r1._id, a, "Reply one, edited");
  assert.equal(edited.status, 200);
  assert.equal(edited.body.data.content, "Reply one, edited");
  assert.ok(edited.body.data.editedAt);
  assert.equal((await api.editReply(r1._id, a, "  ")).status, 400);

  assert.equal((await api.removeReply(r1._id, b)).status, 403);
  assert.equal((await api.removeReply(r1._id, a)).status, 200);
  assert.equal((await api.removeReply(r2._id, owner)).status, 200); // thread owner moderates
  assert.equal((await api.removeReply(r3._id, admin)).status, 200);
  assert.equal((await api.removeReply(r3._id, admin)).status, 404);
  assert.equal((await ForumThread.findById(t._id)).replyCount, 0);
  assert.equal(await Notification.countDocuments({ thread: t._id }), 0); // notifications for deleted replies go too
});

test("reply likes are per person and idempotent", async () => {
  const a = await createUser();
  const b = await createUser();
  const t = await seedThread(a);
  const r = (await api.reply(t._id, a, "Helpful answer")).body.data;

  assert.equal((await api.likeReply(r._id, null)).status, 401);
  await Promise.all([api.likeReply(r._id, b), api.likeReply(r._id, b)]);
  assert.equal((await api.replies(t._id, "", b)).body.data[0].likeCount, 1);
  assert.equal((await api.replies(t._id, "", b)).body.data[0].likedByMe, true);
  assert.equal((await api.unlikeReply(r._id, b)).body.data.likeCount, 0);
  assert.equal((await api.likeReply("64b7f0f5a3c1e2d4b5a6c7d8", b)).status, 404);
});

test("the thread author (or an admin) marks one reply as the accepted answer", async () => {
  const owner = await createUser();
  const helper = await createUser();
  const other = await createUser();
  const admin = await createUser({ role: "admin" });
  const t = await seedThread(owner);
  const r1 = (await api.reply(t._id, helper, "Try October")).body.data;
  const r2 = (await api.reply(t._id, other, "Try March")).body.data;
  const otherThread = await seedThread(owner, { title: "Another thread" });
  const foreign = (await api.reply(otherThread._id, helper, "Elsewhere")).body.data;

  assert.equal((await api.accept(t._id, r1._id, null)).status, 401);
  assert.equal((await api.accept(t._id, r1._id, other)).status, 403);
  assert.equal((await api.accept(t._id, foreign._id, owner)).status, 404); // reply of another thread

  assert.equal((await api.accept(t._id, r1._id, owner)).status, 200);
  assert.equal((await api.accept(t._id, r2._id, admin)).status, 200); // switching answer
  const list = await api.replies(t._id);
  assert.deepEqual(list.body.data.map((r) => r.isAccepted), [false, true]);
  const card = (await api.list("?search=Coorg")).body.data.find((x) => x._id === String(t._id));
  assert.equal(card.hasAcceptedAnswer, true);
  assert.equal((await api.one(t._id)).body.data.acceptedReplyId, r2._id);

  // deleting the accepted reply clears the mark
  await api.removeReply(r2._id, other);
  assert.equal((await api.one(t._id)).body.data.acceptedReplyId, null);
  await api.accept(t._id, r1._id, owner);
  assert.equal((await api.unaccept(t._id, other)).status, 403);
  assert.equal((await api.unaccept(t._id, owner)).status, 200);
  assert.equal((await api.one(t._id)).body.data.hasAcceptedAnswer, false);
});
