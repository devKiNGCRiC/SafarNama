import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { createFakeRealtime } from "./helpers/fakeRealtime.js";
import { testChatLimits } from "./helpers/limits.js";
import { chatApi } from "./helpers/chat.js";
import { createChatRouter } from "../Routes/chatRoutes.js";
import ChatConversation from "../Models/chatConversationModel.js";
import ChatMessage from "../Models/chatMessageModel.js";
import ChatBlock from "../Models/chatBlockModel.js";

let realtime, media, api;
before(connectTestDb);
after(disconnectTestDb);

function boot(limits = testChatLimits) {
  realtime = createFakeRealtime();
  media = createFakeMedia();
  api = chatApi(buildApp("/api/v1/chat", createChatRouter({ media, limits, realtime })));
}
beforeEach(async () => {
  await clearTestDb();
  boot();
});

const ids = (...users) => users.map((u) => String(u.user._id));
const memberOf = (data, user) => data.members.find((m) => String(m.user._id) === String(user.user._id));

async function makeGroup(creator, others, name = "Spiti Trip") {
  const res = await api.post("/conversations/group", creator, { name, memberIds: ids(...others) });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data;
}

test("creating a group: creator is admin, others are members, a system message is recorded", async () => {
  const [a, b, c] = [await createUser(), await createUser(), await createUser()];
  const group = await makeGroup(a, [b, c]);

  assert.equal(group.type, "group");
  assert.equal(group.name, "Spiti Trip");
  assert.equal(group.members.length, 3);
  assert.equal(memberOf(group, a).role, "admin");
  assert.equal(memberOf(group, b).role, "member");
  assert.equal(group.partner, undefined);

  const system = await ChatMessage.findOne({ conversation: group._id });
  assert.equal(system.kind, "system");
  assert.equal(system.sender, null);
  assert.deepEqual(
    new Set(realtime.recipientsOf("conversation:updated")),
    new Set(ids(a, b, c)),
  );

  // every member sees it in their inbox
  for (const u of [a, b, c]) assert.equal((await api.get("/conversations", u)).body.data.length, 1);
});

test("group creation is validated: name, member count, duplicates, unknown users, blocks", async () => {
  const [a, b, c, d] = [await createUser(), await createUser(), await createUser(), await createUser()];
  const create = (body) => api.post("/conversations/group", a, body);

  assert.equal((await create({ name: "", memberIds: ids(b, c) })).status, 400);
  assert.equal((await create({ name: "x".repeat(51), memberIds: ids(b, c) })).status, 400);
  assert.equal((await create({ name: "G", memberIds: ids(b) })).status, 400); // needs 2+ others
  assert.equal((await create({ name: "G", memberIds: [...ids(b), ...ids(b)] })).status, 400); // duplicates collapse to 1
  assert.equal((await create({ name: "G", memberIds: ["abc", ...ids(b)] })).status, 400);
  assert.equal((await create({ name: "G", memberIds: [...ids(b), String(new mongoose.Types.ObjectId())] })).status, 404);
  assert.equal((await create({ name: "G", memberIds: [...ids(b, c), String(a.user._id)] })).status, 201); // self is ignored

  await ChatBlock.create({ blocker: d.user._id, blocked: a.user._id });
  assert.equal((await create({ name: "G2", memberIds: ids(b, d) })).status, 403);
  await ChatBlock.deleteMany({});
  await ChatBlock.create({ blocker: a.user._id, blocked: d.user._id });
  assert.equal((await create({ name: "G3", memberIds: ids(b, d) })).status, 403);

  const many = await Promise.all(Array.from({ length: 50 }, () => createUser()));
  assert.equal((await create({ name: "Big", memberIds: ids(...many) })).status, 400); // 51 members total
});

test("group creation is rate limited", async () => {
  boot({ ...testChatLimits, groupCreate: { windowMs: 60_000, max: 1 } });
  const [a, b, c] = [await createUser(), await createUser(), await createUser()];
  assert.equal((await api.post("/conversations/group", a, { name: "One", memberIds: ids(b, c) })).status, 201);
  assert.equal((await api.post("/conversations/group", a, { name: "Two", memberIds: ids(b, c) })).status, 429);
});

test("only admins can rename; the change is announced", async () => {
  const [a, b, c] = [await createUser(), await createUser(), await createUser()];
  const group = await makeGroup(a, [b, c]);

  assert.equal((await api.patch(`/conversations/${group._id}`, b, { name: "Hacked" })).status, 403);
  assert.equal((await api.patch(`/conversations/${group._id}`, a, { name: "" })).status, 400);
  const res = await api.patch(`/conversations/${group._id}`, a, { name: "Ladakh Trip" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.name, "Ladakh Trip");
  const last = await ChatMessage.findOne({ conversation: group._id }).sort({ _id: -1 });
  assert.match(last.text, /renamed the group to "Ladakh Trip"/);
});

test("renaming a direct chat is not allowed", async () => {
  const [a, b] = [await createUser(), await createUser()];
  const direct = await api.post("/conversations/direct", a, { userId: String(b.user._id) });
  assert.equal((await api.patch(`/conversations/${direct.body.data._id}`, a, { name: "x" })).status, 400);
});

test("admins add members: skips existing, respects blocks and the 50-member cap", async () => {
  const [a, b, c, d, e] = await Promise.all([1, 2, 3, 4, 5].map(() => createUser()));
  const group = await makeGroup(a, [b, c]);

  assert.equal((await api.post(`/conversations/${group._id}/members`, b, { userIds: ids(d) })).status, 403);
  const res = await api.post(`/conversations/${group._id}/members`, a, { userIds: [...ids(b), ...ids(d)] });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.members.length, 4); // b was already in
  assert.ok(memberOf(res.body.data, d));
  assert.match((await ChatMessage.findOne({ conversation: group._id }).sort({ _id: -1 })).text, /added/);

  await ChatBlock.create({ blocker: e.user._id, blocked: a.user._id });
  assert.equal((await api.post(`/conversations/${group._id}/members`, a, { userIds: ids(e) })).status, 403);

  // the new member can read history
  assert.equal((await api.get(`/conversations/${group._id}/messages`, d)).status, 200);

  // cap: 4 members now, so 47 more would be 51 (rejected) but 46 more is exactly 50 (allowed)
  const crowd = await Promise.all(Array.from({ length: 47 }, () => createUser()));
  assert.equal((await api.post(`/conversations/${group._id}/members`, a, { userIds: ids(...crowd) })).status, 400);
  assert.equal((await api.post(`/conversations/${group._id}/members`, a, { userIds: ids(...crowd.slice(0, 46)) })).status, 200);
});

test("admins can remove members; members cannot; admins cannot be removed by others", async () => {
  const [a, b, c] = [await createUser(), await createUser(), await createUser()];
  const group = await makeGroup(a, [b, c]);
  const path = (u) => `/conversations/${group._id}/members/${u.user._id}`;

  assert.equal((await api.del(path(c), b)).status, 403); // a plain member cannot remove others
  assert.equal((await api.del(path(a), b)).status, 403); // nor an admin
  assert.equal((await api.del(path(c), a)).status, 200);

  assert.equal((await api.get(`/conversations/${group._id}`, c)).status, 403); // removed: no access
  assert.equal((await api.get("/conversations", c)).body.data.length, 0);
  assert.equal((await api.send(group._id, c, { text: "hi" })).status, 403);
  assert.deepEqual(realtime.recipientsOf("conversation:removed"), [String(c.user._id)]);
});

test("leaving: any member may leave; the last admin leaving promotes the earliest-joined member", async () => {
  const [a, b, c] = [await createUser(), await createUser(), await createUser()];
  const group = await makeGroup(a, [b, c]);
  const path = (u) => `/conversations/${group._id}/members/${u.user._id}`;

  assert.equal((await api.del(path(b), b)).status, 200); // a member leaves
  assert.equal((await api.del(path(a), a)).status, 200); // the only admin leaves

  const fresh = await ChatConversation.findById(group._id);
  assert.equal(fresh.members.length, 1);
  assert.equal(String(fresh.members[0].user), String(c.user._id));
  assert.equal(fresh.members[0].role, "admin"); // promoted
  assert.match((await ChatMessage.findOne({ conversation: group._id }).sort({ _id: -1 })).text, /left/);
});

test("when the last member leaves, the group, its messages and photos are deleted", async () => {
  const [a, b, c] = [await createUser(), await createUser(), await createUser()];
  const group = await makeGroup(a, [b, c]);
  await ChatMessage.create({
    conversation: group._id,
    sender: a.user._id,
    kind: "image",
    media: { url: "https://cdn.test/1", publicId: "chat/1" },
  });
  for (const u of [a, b, c]) await api.del(`/conversations/${group._id}/members/${u.user._id}`, u);

  assert.equal(await ChatConversation.countDocuments(), 0);
  assert.equal(await ChatMessage.countDocuments(), 0);
  assert.deepEqual(media.removed.map((m) => m.publicId), ["chat/1"]);
});

test("group messages reach every other member; system messages are not unread", async () => {
  const [a, b, c] = [await createUser(), await createUser(), await createUser()];
  const group = await makeGroup(a, [b, c]);
  realtime.emitted.length = 0;

  const res = await api.send(group._id, a, { text: "Who is bringing snacks?" });
  assert.equal(res.status, 201);
  assert.deepEqual(new Set(realtime.recipientsOf("message:new")), new Set(ids(b, c)));

  const asB = await api.get(`/conversations/${group._id}`, b);
  assert.equal(asB.body.data.unreadCount, 1); // the creation notice is not counted
  const unread = await api.get("/unread-count", c);
  assert.equal(unread.body.data.total, 1);
});
