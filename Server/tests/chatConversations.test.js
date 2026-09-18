import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { createFakeRealtime } from "./helpers/fakeRealtime.js";
import { testChatLimits } from "./helpers/limits.js";
import { createChatRouter } from "../Routes/chatRoutes.js";
import Profile from "../Models/profileModel.js";
import ChatConversation from "../Models/chatConversationModel.js";
import ChatMessage from "../Models/chatMessageModel.js";
import ChatBlock from "../Models/chatBlockModel.js";
import { directKeyFor } from "../services/chatRules.js";

let app;
let realtime;
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  realtime = createFakeRealtime();
  app = buildApp("/api/v1/chat", createChatRouter({ media: createFakeMedia(), limits: testChatLimits, realtime }));
});

const base = "/api/v1/chat";
const api = {
  get: (path, u) => request(app).get(base + path).set(u?.auth || {}),
  post: (path, u, body) => request(app).post(base + path).set(u?.auth || {}).send(body),
  del: (path, u, body) => request(app).delete(base + path).set(u?.auth || {}).send(body),
};

async function seedDirect(a, b, { bStatus = "active", updatedAt } = {}) {
  const conv = await ChatConversation.create({
    type: "direct",
    createdBy: a.user._id,
    directKey: directKeyFor(a.user._id, b.user._id),
    members: [{ user: a.user._id }, { user: b.user._id, status: bStatus }],
  });
  if (updatedAt) await ChatConversation.collection.updateOne({ _id: conv._id }, { $set: { updatedAt } });
  return conv;
}
const statusOf = (data, user) =>
  data.members.find((m) => String(m.user._id) === String(user.user._id)).status;

test("every conversation route requires a login", async () => {
  for (const path of ["/conversations", "/conversations/requests"]) {
    assert.equal((await api.get(path)).status, 401, path);
  }
  assert.equal((await api.post("/conversations/direct", null, {})).status, 401);
});

test("starting a chat with someone you are connected to puts it straight in both inboxes", async () => {
  const a = await createUser();
  const b = await createUser();
  await Profile.create({ user: a.user._id, following: [b.user._id] });

  const res = await api.post("/conversations/direct", a, { userId: String(b.user._id) });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.data.type, "direct");
  assert.equal(statusOf(res.body.data, a), "active");
  assert.equal(statusOf(res.body.data, b), "active");
  assert.equal(String(res.body.data.partner._id), String(b.user._id));
});

test("a stranger's chat is a request for the recipient only", async () => {
  const a = await createUser();
  const b = await createUser();
  const res = await api.post("/conversations/direct", a, { userId: String(b.user._id) });
  assert.equal(statusOf(res.body.data, a), "active");
  assert.equal(statusOf(res.body.data, b), "pending");

  const inboxB = await api.get("/conversations", b);
  assert.equal(inboxB.body.data.length, 0);
  const requestsB = await api.get("/conversations/requests", b);
  assert.equal(requestsB.body.data.length, 1);
  assert.equal(requestsB.body.data[0].isRequest, true);
  const inboxA = await api.get("/conversations", a);
  assert.equal(inboxA.body.data.length, 1);
});

test("asking twice, from either side, reuses the same conversation", async () => {
  const a = await createUser();
  const b = await createUser();
  const first = await api.post("/conversations/direct", a, { userId: String(b.user._id) });
  const again = await api.post("/conversations/direct", a, { userId: String(b.user._id) });
  const reverse = await api.post("/conversations/direct", b, { userId: String(a.user._id) });
  assert.equal(again.status, 200);
  assert.equal(String(again.body.data._id), String(first.body.data._id));
  assert.equal(String(reverse.body.data._id), String(first.body.data._id));
  assert.equal(await ChatConversation.countDocuments(), 1);
});

test("invalid targets are rejected: self, bad id, unknown user, blocked either way", async () => {
  const a = await createUser();
  const b = await createUser();
  const c = await createUser();
  assert.equal((await api.post("/conversations/direct", a, { userId: String(a.user._id) })).status, 400);
  assert.equal((await api.post("/conversations/direct", a, { userId: "abc" })).status, 400);
  assert.equal((await api.post("/conversations/direct", a, { userId: String(new mongoose.Types.ObjectId()) })).status, 404);

  await ChatBlock.create({ blocker: a.user._id, blocked: b.user._id });
  assert.equal((await api.post("/conversations/direct", a, { userId: String(b.user._id) })).status, 403);
  assert.equal((await api.post("/conversations/direct", b, { userId: String(a.user._id) })).status, 403);
  assert.equal((await api.post("/conversations/direct", a, { userId: String(c.user._id) })).status, 201);
});

test("the inbox lists my active conversations newest activity first, with paging", async () => {
  const me = await createUser();
  const others = [await createUser(), await createUser(), await createUser()];
  const now = Date.now();
  await seedDirect(me, others[0], { updatedAt: new Date(now - 3000) });
  await seedDirect(me, others[1], { updatedAt: new Date(now - 1000) });
  await seedDirect(me, others[2], { updatedAt: new Date(now - 2000) });
  const stranger = await createUser();
  await seedDirect(stranger, me, { bStatus: "pending" }); // a request, not in the inbox

  const first = await api.get("/conversations?limit=2", me);
  assert.equal(first.status, 200);
  assert.deepEqual(
    first.body.data.map((c) => String(c.partner._id)),
    [String(others[1].user._id), String(others[2].user._id)],
  );
  assert.ok(first.body.nextCursor);

  const second = await api.get(`/conversations?limit=2&cursor=${encodeURIComponent(first.body.nextCursor)}`, me);
  assert.deepEqual(second.body.data.map((c) => String(c.partner._id)), [String(others[0].user._id)]);
  assert.equal(second.body.nextCursor, null);
  assert.equal((await api.get("/conversations?cursor=nonsense", me)).status, 400);
});

test("only members can open a conversation", async () => {
  const a = await createUser();
  const b = await createUser();
  const outsider = await createUser();
  const conv = await seedDirect(a, b);
  assert.equal((await api.get(`/conversations/${conv._id}`, a)).status, 200);
  assert.equal((await api.get(`/conversations/${conv._id}`, outsider)).status, 403);
  assert.equal((await api.get(`/conversations/${new mongoose.Types.ObjectId()}`, a)).status, 404);
  assert.equal((await api.get("/conversations/abc", a)).status, 400);
});

test("accepting a request activates it for the recipient and notifies both people", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b, { bStatus: "pending" });

  assert.equal((await api.post(`/conversations/${conv._id}/accept`, a)).status, 400); // requester cannot accept
  const res = await api.post(`/conversations/${conv._id}/accept`, b);
  assert.equal(res.status, 200);
  assert.equal(statusOf(res.body.data, b), "active");
  assert.equal((await api.get("/conversations", b)).body.data.length, 1);
  assert.deepEqual(
    new Set(realtime.recipientsOf("conversation:updated")),
    new Set([String(a.user._id), String(b.user._id)]),
  );
});

test("declining deletes the chat, optionally blocks the sender, and tells them", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b, { bStatus: "pending" });
  await ChatMessage.create({ conversation: conv._id, sender: a.user._id, kind: "text", text: "hey" });

  assert.equal((await api.del(`/conversations/${conv._id}/request`, a)).status, 400);
  const res = await api.del(`/conversations/${conv._id}/request`, b, { block: true });
  assert.equal(res.status, 200);
  assert.equal(await ChatConversation.countDocuments(), 0);
  assert.equal(await ChatMessage.countDocuments(), 0);
  assert.equal(await ChatBlock.countDocuments({ blocker: b.user._id, blocked: a.user._id }), 1);
  assert.deepEqual(realtime.recipientsOf("conversation:removed"), [String(a.user._id)]);
});
