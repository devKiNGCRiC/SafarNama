import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { createFakeRealtime } from "./helpers/fakeRealtime.js";
import { testLimits } from "./helpers/limits.js";
import { seedPost } from "./helpers/seed.js";
import errorHandler from "../Middleware/errorHandler.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import profileRoutes from "../Routes/profileRoutes.js";
import { createNotificationRouter } from "../Routes/notificationRoutes.js";
import { configureNotifier } from "../services/notifier.js";
import Notification from "../Models/notificationModel.js";
import ChatBlock from "../Models/chatBlockModel.js";
import SafarPost from "../Models/safargramPostModel.js";

let app, realtime;
before(async () => {
  await connectTestDb();
  await Notification.init();
  app = express();
  app.use(express.json());
  app.use("/api/v1/safargram", createSafargramRouter({ media: createFakeMedia(), limits: testLimits }));
  app.use("/api/v1/profile", profileRoutes);
  app.use("/api/v1/notifications", createNotificationRouter());
  app.use(errorHandler);
});
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  realtime = createFakeRealtime();
  configureNotifier(realtime);
});

const sg = "/api/v1/safargram";
const like = (id, u) => request(app).post(`${sg}/posts/${id}/like`).set(u.auth);
const unlike = (id, u) => request(app).delete(`${sg}/posts/${id}/like`).set(u.auth);
const comment = (id, u, text = "Nice!") => request(app).post(`${sg}/posts/${id}/comments`).set(u.auth).send({ text });
const delComment = (id, u) => request(app).delete(`${sg}/comments/${id}`).set(u.auth);
const delPost = (id, u) => request(app).delete(`${sg}/posts/${id}`).set(u.auth);
const follow = (id, u) => request(app).post(`/api/v1/profile/follow/${id}`).set(u.auth);
const unfollow = (id, u) => request(app).delete(`/api/v1/profile/follow/${id}`).set(u.auth);
const notes = (u, qs = "") => request(app).get(`/api/v1/notifications${qs}`).set(u?.auth || {});
const count = (filter = {}) => Notification.countDocuments(filter);

test("a like notifies the post's author once; liking your own post or re-liking adds nothing", async () => {
  const author = await createUser();
  const fan = await createUser();
  const post = await seedPost(author);

  await like(post._id, fan);
  await like(post._id, fan);
  await like(post._id, author);
  assert.equal(await count(), 1);
  const n = await Notification.findOne();
  assert.equal(n.type, "like");
  assert.equal(String(n.recipient), String(author.user._id));
  assert.equal(String(n.actor), String(fan.user._id));
  assert.equal(String(n.post), String(post._id));
});

test("unliking removes the notification; liking again creates a fresh one", async () => {
  const author = await createUser();
  const fan = await createUser();
  const post = await seedPost(author);
  await like(post._id, fan);
  await unlike(post._id, fan);
  assert.equal(await count(), 0);
  await like(post._id, fan);
  assert.equal(await count(), 1);
});

test("a comment notifies the author with a text snippet; commenting on your own post does not", async () => {
  const author = await createUser();
  const fan = await createUser();
  const post = await seedPost(author);

  await comment(post._id, author, "note to self");
  assert.equal(await count(), 0);

  const long = "x".repeat(300);
  await comment(post._id, fan, long);
  const n = await Notification.findOne();
  assert.equal(n.type, "comment");
  assert.equal(n.text.length, 120);
  assert.ok(n.comment);
});

test("deleting the comment or the post removes their notifications", async () => {
  const author = await createUser();
  const fan = await createUser();
  const post = await seedPost(author);
  const other = await seedPost(author);

  const c = await comment(post._id, fan);
  await like(post._id, fan);
  await like(other._id, fan);
  assert.equal(await count(), 3);

  await delComment(c.body.data._id, fan);
  assert.equal(await count(), 2);
  await delPost(post._id, author);
  assert.equal(await count(), 1);
  assert.equal(String((await Notification.findOne()).post), String(other._id));
});

test("a follow notifies once; unfollowing removes it; following yourself does nothing", async () => {
  const a = await createUser();
  const b = await createUser();
  await follow(b.user._id, a);
  const n = await Notification.findOne();
  assert.equal(n.type, "follow");
  assert.equal(String(n.recipient), String(b.user._id));
  assert.equal(String(n.actor), String(a.user._id));

  await unfollow(b.user._id, a);
  assert.equal(await count(), 0);
  await follow(a.user._id, a); // rejected by the follow endpoint itself
  assert.equal(await count(), 0);
});

test("people the recipient has blocked never notify them", async () => {
  const author = await createUser();
  const pest = await createUser();
  const post = await seedPost(author);
  await ChatBlock.create({ blocker: author.user._id, blocked: pest.user._id });
  await like(post._id, pest);
  await comment(post._id, pest);
  await follow(author.user._id, pest);
  assert.equal(await count(), 0);
});

test("creating a notification pushes it live with the new unread total", async () => {
  const author = await createUser();
  const fan = await createUser();
  const post = await seedPost(author);
  await like(post._id, fan);

  assert.deepEqual(realtime.recipientsOf("notification:new"), [String(author.user._id)]);
  const payload = realtime.emitted.find((e) => e.event === "notification:new").payload;
  assert.equal(payload.unreadCount, 1);
  assert.equal(payload.notification.type, "like");
  assert.equal(payload.notification.actor.username, fan.user.username);
});

test("the list is newest first, paged, and shows who and what", async () => {
  const author = await createUser();
  const fans = [await createUser(), await createUser(), await createUser()];
  const post = await seedPost(author, {
    media: [{ type: "image", url: "https://cdn.test/p.jpg", publicId: "p" }],
  });
  for (const f of fans) await like(post._id, f);

  const first = await notes(author, "?limit=2");
  assert.equal(first.status, 200);
  assert.equal(first.body.data.length, 2);
  assert.equal(first.body.data[0].actor.username, fans[2].user.username);
  assert.equal(first.body.data[0].post.thumb.url, "https://cdn.test/p.jpg");
  assert.equal(first.body.data[0].readAt, null);
  const second = await notes(author, `?limit=2&cursor=${first.body.nextCursor}`);
  assert.deepEqual(second.body.data.map((n) => n.actor.username), [fans[0].user.username]);
  assert.equal(second.body.nextCursor, null);

  assert.equal((await notes(author, "?cursor=abc")).status, 400);
  assert.equal((await notes(null)).status, 401);
});

test("unread count, mark one read, mark all read - only for your own notifications", async () => {
  const author = await createUser();
  const stranger = await createUser();
  const fans = [await createUser(), await createUser()];
  const post = await seedPost(author);
  for (const f of fans) await like(post._id, f);

  const unread = () => request(app).get("/api/v1/notifications/unread-count").set(author.auth);
  assert.equal((await unread()).body.data.total, 2);

  const list = (await notes(author)).body.data;
  const read = await request(app).post(`/api/v1/notifications/${list[0]._id}/read`).set(author.auth);
  assert.equal(read.status, 200);
  assert.equal((await unread()).body.data.total, 1);

  assert.equal((await request(app).post(`/api/v1/notifications/${list[1]._id}/read`).set(stranger.auth)).status, 404);
  assert.equal((await request(app).post(`/api/v1/notifications/${new mongoose.Types.ObjectId()}/read`).set(author.auth)).status, 404);

  assert.equal((await request(app).post("/api/v1/notifications/read-all").set(author.auth)).status, 200);
  assert.equal((await unread()).body.data.total, 0);
  assert.equal((await request(app).get("/api/v1/notifications/unread-count").set(stranger.auth)).body.data.total, 0);
  assert.ok(await SafarPost.findById(post._id));
});
