import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { createFakeRealtime } from "./helpers/fakeRealtime.js";
import { testChatLimits } from "./helpers/limits.js";
import { chatApi, seedDirect } from "./helpers/chat.js";
import { createChatRouter } from "../Routes/chatRoutes.js";
import ChatBlock from "../Models/chatBlockModel.js";
import ChatMessage from "../Models/chatMessageModel.js";

let realtime, api;
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  realtime = createFakeRealtime();
  api = chatApi(buildApp("/api/v1/chat", createChatRouter({ media: createFakeMedia(), limits: testChatLimits, realtime })));
});

test("blocking and unblocking are idempotent; self and unknown users are rejected", async () => {
  const me = await createUser();
  const other = await createUser();
  const id = String(other.user._id);

  assert.equal((await api.post(`/blocks/${id}`, me)).status, 200);
  assert.equal((await api.post(`/blocks/${id}`, me)).status, 200);
  assert.equal(await ChatBlock.countDocuments(), 1);

  const list = await api.get("/blocks", me);
  assert.deepEqual(list.body.data.map((u) => u.username), [other.user.username]);

  assert.equal((await api.del(`/blocks/${id}`, me)).status, 200);
  assert.equal((await api.del(`/blocks/${id}`, me)).status, 200);
  assert.equal(await ChatBlock.countDocuments(), 0);

  assert.equal((await api.post(`/blocks/${me.user._id}`, me)).status, 400);
  assert.equal((await api.post(`/blocks/${new mongoose.Types.ObjectId()}`, me)).status, 404);
  assert.equal((await api.post("/blocks/abc", me)).status, 400);
});

test("blocking updates an existing chat live for both people", async () => {
  const me = await createUser();
  const other = await createUser();
  await seedDirect(me, other);
  await api.post(`/blocks/${other.user._id}`, me);
  assert.deepEqual(
    new Set(realtime.recipientsOf("conversation:updated")),
    new Set([String(me.user._id), String(other.user._id)]),
  );
});

test("unread total counts active chats only, excluding my own messages", async () => {
  const me = await createUser();
  const a = await createUser();
  const b = await createUser();
  const stranger = await createUser();
  const chatA = await seedDirect(me, a);
  const chatB = await seedDirect(b, me);
  const request = await seedDirect(stranger, me, { bStatus: "pending" });

  const add = (conversation, sender, text) => ChatMessage.create({ conversation: conversation._id, sender: sender.user._id, kind: "text", text });
  await add(chatA, a, "1");
  await add(chatA, a, "2");
  await add(chatA, me, "mine");
  await add(chatB, b, "3");
  await add(request, stranger, "hello?"); // a request does not count

  const res = await api.get("/unread-count", me);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.total, 3);
});

test("people search: username prefix, case-insensitive, at most 10, hides me and people who blocked me", async () => {
  const me = await createUser({ username: "asha_me" });
  await createUser({ username: "ravi_kumar" });
  await createUser({ username: "Ravi_Singh" });
  const blocker = await createUser({ username: "ravi_blocker" });
  await createUser({ username: "meera" });
  await ChatBlock.create({ blocker: blocker.user._id, blocked: me.user._id });

  const res = await api.get("/users/search?q=RAVI", me);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((u) => u.username).sort(), ["Ravi_Singh", "ravi_kumar"]);

  const self = await api.get("/users/search?q=asha", me);
  assert.deepEqual(self.body.data, []);

  assert.equal((await api.get("/users/search?q=a", me)).status, 400); // too short
  assert.equal((await api.get("/users/search", me)).status, 400);
  assert.equal((await api.get("/users/search?q=.*", me)).body.data.length, 0); // regex characters are escaped

  for (let i = 0; i < 12; i++) await createUser({ username: `zed_${i}` });
  assert.equal((await api.get("/users/search?q=zed", me)).body.data.length, 10);
});

test("presence lookup returns only the ids that are online and caps the list", async () => {
  const me = await createUser();
  const a = await createUser();
  const b = await createUser();
  realtime.setOnline([a.user._id]);

  const res = await api.get(`/presence?ids=${a.user._id},${b.user._id}`, me);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.online, [String(a.user._id)]);

  assert.equal((await api.get("/presence?ids=abc", me)).status, 400);
  assert.equal((await api.get("/presence", me)).status, 400);
  const many = Array.from({ length: 101 }, () => String(new mongoose.Types.ObjectId())).join(",");
  assert.equal((await api.get(`/presence?ids=${many}`, me)).status, 400);
});
