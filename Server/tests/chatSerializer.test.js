import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { createUser } from "./helpers/users.js";
import { createFakeRealtime } from "./helpers/fakeRealtime.js";
import ChatConversation from "../Models/chatConversationModel.js";
import ChatMessage from "../Models/chatMessageModel.js";
import ChatBlock from "../Models/chatBlockModel.js";
import { populateConversation, serializeConversations, serializeMessage } from "../services/chatSerializer.js";

before(connectTestDb);
after(disconnectTestDb);
beforeEach(clearTestDb);

async function directChat(a, b, { bStatus = "active", aRead } = {}) {
  const conv = await ChatConversation.create({
    type: "direct",
    createdBy: a.user._id,
    directKey: `${a.user._id}:${b.user._id}`,
    members: [
      { user: a.user._id, ...(aRead ? { lastReadAt: aRead } : {}) },
      { user: b.user._id, status: bStatus },
    ],
  });
  return populateConversation(ChatConversation.findById(conv._id));
}

test("unread counts messages after lastReadAt, ignoring my own and system messages", async () => {
  const me = await createUser();
  const other = await createUser();
  const conv = await directChat(me, other);
  const realtime = createFakeRealtime();

  const msg = (sender, extra = {}) =>
    ChatMessage.create({ conversation: conv._id, sender, kind: "text", text: "hi", ...extra });
  await msg(other.user._id);
  await msg(other.user._id);
  await msg(me.user._id);
  await ChatMessage.create({ conversation: conv._id, sender: null, kind: "system", text: "note" });

  const [json] = await serializeConversations([conv], me.user._id, realtime);
  assert.equal(json.unreadCount, 2);

  await ChatConversation.updateOne(
    { _id: conv._id, "members.user": me.user._id },
    { $set: { "members.$.lastReadAt": new Date(Date.now() + 1000) } },
  );
  const fresh = await populateConversation(ChatConversation.findById(conv._id));
  const [after] = await serializeConversations([fresh], me.user._id, realtime);
  assert.equal(after.unreadCount, 0);
});

test("direct chats expose the partner, request flag and online status", async () => {
  const me = await createUser();
  const other = await createUser();
  const realtime = createFakeRealtime();
  const conv = await directChat(me, other, { bStatus: "pending" });

  const [asMe] = await serializeConversations([conv], me.user._id, realtime);
  assert.equal(String(asMe.partner._id), String(other.user._id));
  assert.equal(asMe.partner.username, other.user.username);
  assert.equal(asMe.isRequest, false);
  assert.equal(asMe.online, false);

  const [asOther] = await serializeConversations([conv], other.user._id, realtime);
  assert.equal(asOther.isRequest, true);
  assert.equal(String(asOther.partner._id), String(me.user._id));

  realtime.setOnline([other.user._id]);
  const [online] = await serializeConversations([conv], me.user._id, realtime);
  assert.equal(online.online, true);
});

test("block flags are reported from my point of view", async () => {
  const me = await createUser();
  const other = await createUser();
  const conv = await directChat(me, other);
  const realtime = createFakeRealtime();
  await ChatBlock.create({ blocker: me.user._id, blocked: other.user._id });

  const [asMe] = await serializeConversations([conv], me.user._id, realtime);
  assert.equal(asMe.blockedByMe, true);
  assert.equal(asMe.blockedMe, false);
  const [asOther] = await serializeConversations([conv], other.user._id, realtime);
  assert.equal(asOther.blockedByMe, false);
  assert.equal(asOther.blockedMe, true);
});

test("serializeMessage returns the public shape", async () => {
  const me = await createUser();
  const other = await createUser();
  const conv = await directChat(me, other);
  const saved = await ChatMessage.create({ conversation: conv._id, sender: me.user._id, kind: "text", text: "hello" });
  const populated = await ChatMessage.findById(saved._id).populate("sender", "username firstName lastName avatar");
  const json = serializeMessage(populated);
  assert.deepEqual(Object.keys(json).sort(), ["_id", "conversation", "createdAt", "kind", "media", "sender", "text"].sort());
  assert.equal(json.sender.username, me.user.username);
  assert.equal(json.text, "hello");
});
