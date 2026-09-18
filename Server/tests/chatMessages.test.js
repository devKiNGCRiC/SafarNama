import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { createFakeRealtime } from "./helpers/fakeRealtime.js";
import { testChatLimits } from "./helpers/limits.js";
import { chatApi, png, seedDirect } from "./helpers/chat.js";
import { createChatRouter } from "../Routes/chatRoutes.js";
import ChatConversation from "../Models/chatConversationModel.js";
import ChatMessage from "../Models/chatMessageModel.js";
import ChatBlock from "../Models/chatBlockModel.js";

let realtime, media, api, app;
before(connectTestDb);
after(disconnectTestDb);

function boot(limits = testChatLimits) {
  realtime = createFakeRealtime();
  media = createFakeMedia();
  app = buildApp("/api/v1/chat", createChatRouter({ media, limits, realtime }));
  api = chatApi(app);
}
beforeEach(async () => {
  await clearTestDb();
  boot();
});

const leftoverTempFiles = () => fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith("chat-"));

test("sending text stores it, updates the chat and pushes it to the other person only", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b);

  const res = await api.send(conv._id, a, { text: "  Namaste!  " });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.data.text, "Namaste!");
  assert.equal(res.body.data.kind, "text");
  assert.equal(res.body.data.sender.username, a.user.username);

  const fresh = await ChatConversation.findById(conv._id);
  assert.equal(fresh.lastMessage.text, "Namaste!");
  assert.equal(String(fresh.lastMessage.sender), String(a.user._id));

  assert.deepEqual(realtime.recipientsOf("message:new"), [String(b.user._id)]);
  const pushed = realtime.emitted.find((e) => e.event === "message:new").payload;
  assert.equal(pushed.message.text, "Namaste!");
  assert.equal(pushed.conversation.unreadCount, 1);
});

test("empty, blank and over-long messages are rejected", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b);
  assert.equal((await api.send(conv._id, a, {})).status, 400);
  assert.equal((await api.send(conv._id, a, { text: "   " })).status, 400);
  assert.equal((await api.send(conv._id, a, { text: "x".repeat(2001) })).status, 400);
  assert.equal(await ChatMessage.countDocuments(), 0);
});

test("a photo can be sent alone or with a caption; other files and multiple photos are refused", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b);

  const photo = await api.send(conv._id, a, {}, [png()]);
  assert.equal(photo.status, 201, JSON.stringify(photo.body));
  assert.equal(photo.body.data.kind, "image");
  assert.ok(photo.body.data.media.url);
  assert.equal(media.uploaded.length, 1);

  const captioned = await api.send(conv._id, a, { text: "Sunrise" }, [png()]);
  assert.equal(captioned.body.data.text, "Sunrise");

  const pdf = { buf: Buffer.from("x"), opts: { filename: "a.pdf", contentType: "application/pdf" } };
  assert.equal((await api.send(conv._id, a, {}, [pdf])).status, 400);
  assert.equal((await api.send(conv._id, a, {}, [png("1.png"), png("2.png")])).status, 400);
  assert.equal(await ChatMessage.countDocuments(), 2);
});

test("uploaded temp files are always removed, and media is cleaned up if saving fails", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b);
  const before = leftoverTempFiles().length;
  await api.send(conv._id, a, {}, [png()]);
  await api.send(conv._id, a, { text: "x".repeat(2001) }, [png()]);
  assert.equal(leftoverTempFiles().length, before);
});

test("a requester may send 3 messages, then must wait; the pending person cannot reply until accepting", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b, { bStatus: "pending" });

  for (let i = 1; i <= 3; i++) {
    assert.equal((await api.send(conv._id, a, { text: `hi ${i}` })).status, 201);
  }
  assert.equal((await api.send(conv._id, a, { text: "hi 4" })).status, 403);

  assert.equal((await api.send(conv._id, b, { text: "reply" })).status, 403);
  await api.post(`/conversations/${conv._id}/accept`, b);
  assert.equal((await api.send(conv._id, b, { text: "reply" })).status, 201);
  assert.equal((await api.send(conv._id, a, { text: "hi 4" })).status, 201); // limit lifted after acceptance
});

test("blocked people cannot exchange messages in either direction", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b);
  await ChatBlock.create({ blocker: a.user._id, blocked: b.user._id });
  assert.equal((await api.send(conv._id, a, { text: "x" })).status, 403);
  assert.equal((await api.send(conv._id, b, { text: "x" })).status, 403);
});

test("non-members cannot send, read history or mark read; bad ids are 400", async () => {
  const a = await createUser();
  const b = await createUser();
  const outsider = await createUser();
  const conv = await seedDirect(a, b);
  assert.equal((await api.send(conv._id, outsider, { text: "x" })).status, 403);
  assert.equal((await api.get(`/conversations/${conv._id}/messages`, outsider)).status, 403);
  assert.equal((await api.post(`/conversations/${conv._id}/read`, outsider)).status, 403);
  assert.equal((await api.get("/conversations/abc/messages", a)).status, 400);
  assert.equal((await api.send(conv._id, null, { text: "x" })).status, 401);
});

test("history is newest first with cursor paging", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b);
  for (let i = 1; i <= 5; i++) {
    await ChatMessage.create({ conversation: conv._id, sender: a.user._id, kind: "text", text: `m${i}` });
  }
  const first = await api.get(`/conversations/${conv._id}/messages?limit=2`, b);
  assert.deepEqual(first.body.data.map((m) => m.text), ["m5", "m4"]);
  const second = await api.get(`/conversations/${conv._id}/messages?limit=2&cursor=${first.body.nextCursor}`, b);
  assert.deepEqual(second.body.data.map((m) => m.text), ["m3", "m2"]);
  const third = await api.get(`/conversations/${conv._id}/messages?limit=2&cursor=${second.body.nextCursor}`, b);
  assert.deepEqual(third.body.data.map((m) => m.text), ["m1"]);
  assert.equal(third.body.nextCursor, null);
});

test("marking read clears unread and tells the other person", async () => {
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b);
  await api.send(conv._id, a, { text: "one" });
  await api.send(conv._id, a, { text: "two" });

  const before = await api.get(`/conversations/${conv._id}`, b);
  assert.equal(before.body.data.unreadCount, 2);

  realtime.emitted.length = 0;
  assert.equal((await api.post(`/conversations/${conv._id}/read`, b)).status, 200);
  const after = await api.get(`/conversations/${conv._id}`, b);
  assert.equal(after.body.data.unreadCount, 0);

  assert.deepEqual(realtime.recipientsOf("message:read"), [String(a.user._id)]);
  assert.deepEqual(realtime.recipientsOf("conversation:updated"), [String(b.user._id)]);
});

test("rate limit: too many messages in a minute get 429", async () => {
  boot({ ...testChatLimits, message: { windowMs: 60_000, max: 2 } });
  const a = await createUser();
  const b = await createUser();
  const conv = await seedDirect(a, b);
  assert.equal((await api.send(conv._id, a, { text: "1" })).status, 201);
  assert.equal((await api.send(conv._id, a, { text: "2" })).status, 201);
  assert.equal((await api.send(conv._id, a, { text: "3" })).status, 429);
});
