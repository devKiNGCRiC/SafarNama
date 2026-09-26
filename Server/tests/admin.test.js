import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { createUser } from "./helpers/users.js";
import errorHandler from "../Middleware/errorHandler.js";
import { createAdminRouter } from "../Routes/adminRoutes.js";
import { createReportRouter } from "../Routes/reportRoutes.js";
import authRoutes from "../Routes/authRoutes.js";
import UserModel from "../Models/userModel.js";
import Report from "../Models/reportModel.js";
import AdminAction from "../Models/adminActionModel.js";
import ForumThread from "../Models/forumThreadModel.js";
import ForumReply from "../Models/forumReplyModel.js";
import GalleryPhoto from "../Models/galleryPhotoModel.js";
import SafarPost from "../Models/safargramPostModel.js";
import Contact from "../Models/Contact.js";
import Feedback from "../Models/Feedback.js";

let app;
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  app = express();
  app.use(express.json());
  app.use("/api/v1/admin", createAdminRouter());
  app.use("/api/v1/reports", createReportRouter({ limits: { report: { windowMs: 60_000, max: 100_000 } } }));
  app.use("/api/v1/auth", authRoutes);
  app.use(errorHandler);
});

const admin$ = "/api/v1/admin";
const a = {
  get: (path, u) => request(app).get(`${admin$}${path}`).set(u?.auth || {}),
  patch: (path, u, body) => request(app).patch(`${admin$}${path}`).set(u?.auth || {}).send(body),
  report: (u, body) => request(app).post("/api/v1/reports").set(u?.auth || {}).send(body),
};
const oid = () => new mongoose.Types.ObjectId();

async function seedThread(author, extra = {}) {
  return ForumThread.create({ title: "Coorg in monsoon?", content: "Is it safe to travel in July?", category: "TRIP_HELP", author: author.user._id, ...extra });
}

test("every admin route needs an admin", async () => {
  const member = await createUser();
  for (const path of ["/overview", "/users", "/reports", "/messages", "/audit"]) {
    assert.equal((await a.get(path, null)).status, 401, path);
    assert.equal((await a.get(path, member)).status, 403, path);
  }
  // the old separate admin login and the unpaginated user dump are gone
  assert.equal((await request(app).post("/admin/login").send({ email: "x@y.z", password: "x" })).status, 404);
});

test("the overview shows real counts, recent sign-ups and open reports", async () => {
  const boss = await createUser({ role: "admin" });
  const u1 = await createUser({ isEmailVerified: true });
  await createUser();
  await seedThread(u1);
  await GalleryPhoto.create({ owner: u1.user._id, url: "https://cdn.test/1", publicId: "p/1" });
  await Contact.create({ firstName: "A", lastName: "B", email: "a@b.co", phone: "123", message: "Hello" });
  const thread = await ForumThread.findOne();
  await a.report(u1, { type: "FORUM_THREAD", targetId: String(thread._id), reason: "SPAM" }); // own content: refused
  const other = await createUser();
  await a.report(other, { type: "FORUM_THREAD", targetId: String(thread._id), reason: "SPAM" });

  const res = await a.get("/overview", boss);
  assert.equal(res.status, 200);
  const { counts, recentUsers } = res.body.data;
  assert.equal(counts.users, 4);
  assert.equal(counts.newUsersThisWeek, 4);
  assert.equal(counts.verifiedUsers, 1);
  assert.equal(counts.forumThreads, 1);
  assert.equal(counts.galleryPhotos, 1);
  assert.equal(counts.messages, 1);
  assert.equal(counts.openReports, 1);
  assert.equal(recentUsers.length, 4);
  assert.equal("password" in recentUsers[0], false);
});

test("the user list is paged, searchable and filterable, and never leaks secrets", async () => {
  const boss = await createUser({ role: "admin" });
  const asha = await createUser({ username: "asha_trails", email: "asha@example.com" });
  await createUser({ username: "ben_treks", accountStatus: "suspended" });
  await createUser({ username: "cara_hikes" });

  const all = await a.get("/users", boss);
  assert.equal(all.status, 200);
  assert.equal(all.body.data.length, 4);
  const row = all.body.data.find((u) => u.username === "asha_trails");
  assert.equal(row.email, "asha@example.com");
  assert.equal(row.isActive, true);
  for (const secret of ["password", "passwordResetToken", "emailVerificationToken", "loginAttempts"]) {
    assert.equal(secret in row, false, secret);
  }

  const names = async (qs) => (await a.get(`/users${qs}`, boss)).body.data.map((u) => u.username);
  assert.deepEqual(await names("?search=ASHA"), ["asha_trails"]);
  assert.deepEqual(await names("?search=asha@example"), ["asha_trails"]);
  assert.deepEqual(await names("?search=.*"), []);
  assert.deepEqual(await names("?status=suspended"), ["ben_treks"]);
  assert.deepEqual((await names("?role=admin")).length, 1);

  const first = await a.get("/users?limit=2", boss);
  const second = await a.get(`/users?limit=2&cursor=${first.body.nextCursor}`, boss);
  assert.equal(first.body.data.length + second.body.data.length, 4);
  assert.equal(second.body.nextCursor, null);
  assert.equal((await a.get("/users?status=nope", boss)).status, 400);
  assert.ok(asha);
});

test("user actions: suspend, unsuspend, deactivate, reactivate, promote, demote - with safety rules and an audit trail", async () => {
  const boss = await createUser({ role: "admin" });
  const other = await createUser({ role: "admin" });
  const member = await createUser();
  const act = (u, target, action) => a.patch(`/users/${target.user._id}`, u, { action });

  assert.equal((await act(boss, member, "explode")).status, 400);
  assert.equal((await act(boss, boss, "suspend")).status, 400); // never yourself
  assert.equal((await act(boss, other, "suspend")).status, 400); // admins must be demoted first
  assert.equal((await a.patch(`/users/${oid()}`, boss, { action: "suspend" })).status, 404);
  assert.equal((await a.patch("/users/nope", boss, { action: "suspend" })).status, 400);

  const suspended = await act(boss, member, "suspend");
  assert.equal(suspended.status, 200);
  assert.equal(suspended.body.data.accountStatus, "suspended");
  assert.equal((await UserModel.findById(member.user._id)).accountStatus, "suspended");
  // a suspended person's login token stops working
  assert.equal((await request(app).get(`${admin$}/overview`).set(member.auth)).status, 403);
  assert.equal((await act(boss, member, "unsuspend")).body.data.accountStatus, "active");

  await UserModel.updateOne({ _id: member.user._id }, { $set: { active: false } });
  assert.equal((await a.get("/users?status=deactivated", boss)).body.data.length, 1);
  const back = await act(boss, member, "reactivate");
  assert.equal(back.body.data.isActive, true);
  assert.equal((await UserModel.findById(member.user._id).select("+active")).active, true);

  assert.equal((await act(boss, member, "make-admin")).body.data.role, "admin");
  assert.equal((await act(boss, member, "remove-admin")).body.data.role, "user");
  assert.equal((await act(other, boss, "remove-admin")).status, 200); // another admin may demote you, never yourself
  assert.equal((await act(other, other, "remove-admin")).status, 400);

  const log = await a.get("/audit", other);
  assert.equal(log.status, 200);
  assert.ok(log.body.data.length >= 6);
  assert.equal(log.body.data[0].action, "remove-admin");
  assert.equal(log.body.data[0].admin.username, other.user.username);
  assert.ok(await AdminAction.countDocuments());
});

test("a suspended person cannot log in, and says why", async () => {
  await createUser({ username: "sam_suspended", email: "sam@example.com", accountStatus: "suspended" });
  const res = await request(app)
    .post("/api/v1/auth/login")
    .set("Origin", "http://localhost:5173")
    .send({ userIdentifier: "sam@example.com", password: "Str0ng@Pass1" });
  assert.equal(res.status, 403);
  assert.match(res.body.message, /suspended/i);
});

test("people report forum threads, replies, gallery photos and SafarGram posts", async () => {
  const owner = await createUser();
  const reporter = await createUser();
  const thread = await seedThread(owner);
  const reply = await ForumReply.create({ thread: thread._id, author: owner.user._id, content: "Buy cheap pills here" });
  const photo = await GalleryPhoto.create({ owner: owner.user._id, url: "https://cdn.test/x", publicId: "p/x", caption: "Sunset" });
  const post = await SafarPost.create({
    author: owner.user._id,
    caption: "Spam post",
    media: [{ type: "image", url: "https://cdn.test/post", publicId: "p/post" }],
  });

  const send = (u, type, id, extra = {}) => a.report(u, { type, targetId: String(id), reason: "SPAM", ...extra });
  assert.equal((await send(null, "FORUM_THREAD", thread._id)).status, 401);

  const t = await send(reporter, "FORUM_THREAD", thread._id, { details: "  looks like an ad  " });
  assert.equal(t.status, 201);
  assert.equal((await send(reporter, "FORUM_REPLY", reply._id)).status, 201);
  assert.equal((await send(reporter, "GALLERY_PHOTO", photo._id)).status, 201);
  assert.equal((await send(reporter, "SAFARGRAM_POST", post._id)).status, 201);

  const stored = await Report.findOne({ targetType: "FORUM_THREAD" });
  assert.equal(stored.details, "looks like an ad");
  assert.equal(stored.snapshot.text, thread.title);
  assert.equal(stored.link, `/forum/${thread._id}`);
  assert.equal(String(stored.targetOwner), String(owner.user._id));
  assert.equal((await Report.findOne({ targetType: "FORUM_REPLY" })).link, `/forum/${thread._id}#reply-${reply._id}`);
  assert.equal((await Report.findOne({ targetType: "GALLERY_PHOTO" })).snapshot.image, "https://cdn.test/x");
  assert.equal((await Report.findOne({ targetType: "SAFARGRAM_POST" })).snapshot.image, "https://cdn.test/post");

  // the same person reporting the same thing again changes nothing
  const again = await send(reporter, "FORUM_THREAD", thread._id);
  assert.equal(again.status, 200);
  assert.equal(await Report.countDocuments({ targetType: "FORUM_THREAD" }), 1);
});

test("report input is validated: type, id, reason, details, existing target, not your own content", async () => {
  const owner = await createUser();
  const reporter = await createUser();
  const thread = await seedThread(owner);
  const ok = { type: "FORUM_THREAD", targetId: String(thread._id), reason: "SPAM" };

  assert.equal((await a.report(reporter, { ...ok, type: "USER" })).status, 400);
  assert.equal((await a.report(reporter, { ...ok, targetId: "nope" })).status, 400);
  assert.equal((await a.report(reporter, { ...ok, reason: "BORING" })).status, 400);
  assert.equal((await a.report(reporter, { ...ok, details: "x".repeat(301) })).status, 400);
  assert.equal((await a.report(reporter, { ...ok, targetId: String(oid()) })).status, 404);
  const own = await a.report(owner, ok);
  assert.equal(own.status, 400);
  assert.match(own.body.message, /own/i);
  assert.equal(await Report.countDocuments(), 0);
});

test("admins review reports: list, filter, resolve or dismiss every open report on the same content", async () => {
  const boss = await createUser({ role: "admin" });
  const owner = await createUser();
  const r1 = await createUser();
  const r2 = await createUser();
  const t1 = await seedThread(owner, { title: "Spammy thread" });
  const t2 = await seedThread(owner, { title: "Another thread" });
  const report = (u, t) => a.report(u, { type: "FORUM_THREAD", targetId: String(t._id), reason: "SPAM" });
  await report(r1, t1);
  await report(r2, t1);
  await report(r1, t2);

  assert.equal((await a.patch("/reports/nope", boss, { status: "dismissed" })).status, 400);
  const open = await a.get("/reports", boss);
  assert.equal(open.status, 200);
  assert.equal(open.body.data.length, 3);
  const row = open.body.data.find((r) => r.snapshot.text === "Spammy thread");
  assert.equal(row.openForTarget, 2);
  assert.equal(row.reporter.username.startsWith("user_"), true);
  assert.equal(row.targetOwner.username, owner.user.username);
  assert.equal(row.status, "open");

  assert.equal((await a.patch(`/reports/${row._id}`, boss, { status: "open" })).status, 400);
  const done = await a.patch(`/reports/${row._id}`, boss, { status: "actioned" });
  assert.equal(done.status, 200);
  assert.equal(await Report.countDocuments({ status: "actioned" }), 2); // both reports on that thread
  assert.equal((await a.get("/reports", boss)).body.data.length, 1);
  assert.equal((await a.get("/reports?status=actioned", boss)).body.data.length, 2);

  const rest = (await a.get("/reports", boss)).body.data[0];
  assert.equal((await a.patch(`/reports/${rest._id}`, boss, { status: "dismissed" })).status, 200);
  assert.equal((await a.get("/reports?status=dismissed", boss)).body.data.length, 1);
  assert.equal((await a.get("/reports?status=nope", boss)).status, 400);
  assert.equal((await a.patch(`/reports/${oid()}`, boss, { status: "dismissed" })).status, 404);
  const log = (await a.get("/audit", boss)).body.data;
  assert.deepEqual(log.map((l) => l.action), ["report-dismissed", "report-actioned"]);
});

test("admins read contact and feedback messages, newest first and paged", async () => {
  const boss = await createUser({ role: "admin" });
  await Contact.create({ firstName: "Asha", lastName: "Rao", email: "asha@example.com", phone: "999", message: "Older" });
  await Contact.create({ firstName: "Ben", lastName: "Roy", email: "ben@example.com", phone: "888", message: "Newer" });
  await Feedback.create({ userId: "abc", feedback: "Loved it", rating: 5 });

  const contact = await a.get("/messages?type=contact", boss);
  assert.equal(contact.status, 200);
  assert.deepEqual(contact.body.data.map((m) => m.message), ["Newer", "Older"]);
  assert.equal(contact.body.data[0].name, "Ben Roy");
  assert.ok(contact.body.data[0].createdAt);

  const feedback = await a.get("/messages?type=feedback", boss);
  assert.equal(feedback.body.data[0].rating, 5);
  assert.equal(feedback.body.data[0].message, "Loved it");

  const first = await a.get("/messages?type=contact&limit=1", boss);
  const second = await a.get(`/messages?type=contact&limit=1&cursor=${first.body.nextCursor}`, boss);
  assert.deepEqual([first.body.data.length, second.body.data.length, second.body.nextCursor], [1, 1, null]);
  assert.equal((await a.get("/messages?type=nope", boss)).status, 400);
});

test("contact and feedback forms are validated", async () => {
  // (mounted separately in the real app; the rules live in the controllers)
  const { addContact } = await import("../Controllers/contactController.js");
  const { addFeedback } = await import("../Controllers/feedbackController.js");
  const small = express();
  small.use(express.json());
  small.post("/contact", addContact);
  small.post("/feedback", addFeedback);
  const c = (body) => request(small).post("/contact").send(body);
  const f = (body) => request(small).post("/feedback").send(body);

  const good = { firstName: "Asha", lastName: "Rao", email: "asha@example.com", phone: "+91 98765 43210", message: "Hi, I have a question about tours." };
  assert.equal((await c(good)).status, 200);
  assert.equal((await c({ ...good, email: "not-an-email" })).status, 400);
  assert.equal((await c({ ...good, message: "x".repeat(2001) })).status, 400);
  assert.equal((await c({ ...good, firstName: { $ne: "" } })).status, 400);
  assert.equal((await c({ ...good, message: "" })).status, 400);
  assert.equal(await Contact.countDocuments(), 1);

  assert.equal((await f({ feedback: "Great", rating: 4 })).status, 201);
  assert.equal((await f({ feedback: "Great", rating: 9 })).status, 400);
  assert.equal((await f({ feedback: "", rating: 3 })).status, 400);
  assert.equal((await f({ feedback: "x".repeat(2001), rating: 3 })).status, 400);
  assert.equal(await Feedback.countDocuments(), 1);
});
