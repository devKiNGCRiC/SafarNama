import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import ChatConversation from "../Models/chatConversationModel.js";
import ChatMessage from "../Models/chatMessageModel.js";
import ChatBlock from "../Models/chatBlockModel.js";

before(async () => {
  await connectTestDb();
  await Promise.all([ChatConversation, ChatMessage, ChatBlock].map((m) => m.init()));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const oid = () => new mongoose.Types.ObjectId();
const member = (user = oid(), extra = {}) => ({ user, ...extra });

test("a direct conversation has exactly two members and defaults", async () => {
  const a = oid();
  const b = oid();
  const conv = await ChatConversation.create({
    type: "direct",
    createdBy: a,
    directKey: "k1",
    members: [member(a), member(b, { status: "pending" })],
  });
  assert.equal(conv.members[0].role, "member");
  assert.equal(conv.members[0].status, "active");
  assert.equal(conv.members[1].status, "pending");
  assert.equal(conv.members[0].lastReadAt.getTime(), 0);

  await assert.rejects(
    ChatConversation.create({ type: "direct", createdBy: a, members: [member(a)] }),
    /exactly 2/,
  );
});

test("a group has 3-50 members and a name up to 50 characters", async () => {
  const a = oid();
  const base = { type: "group", createdBy: a, name: "Trip" };
  await assert.rejects(ChatConversation.create({ ...base, members: [member(a), member()] }), /3 to 50/);
  await ChatConversation.create({ ...base, members: [member(a), member(), member()] });
  const fiftyOne = Array.from({ length: 51 }, () => member());
  await assert.rejects(ChatConversation.create({ ...base, members: fiftyOne }), /3 to 50/);
  await assert.rejects(
    ChatConversation.create({ ...base, name: "x".repeat(51), members: [member(a), member(), member()] }),
  );
});

test("only one direct conversation can exist per pair (unique directKey), groups are unaffected", async () => {
  const a = oid();
  const b = oid();
  const direct = () =>
    ChatConversation.create({ type: "direct", createdBy: a, directKey: "same", members: [member(a), member(b)] });
  await direct();
  await assert.rejects(direct(), (e) => e.code === 11000);

  const group = () =>
    ChatConversation.create({ type: "group", createdBy: a, name: "G", members: [member(a), member(), member()] });
  await group();
  await group(); // several groups (no directKey) are fine
});

test("messages: text needs content, images need media, system messages may have no sender", async () => {
  const conversation = oid();
  const sender = oid();
  await ChatMessage.create({ conversation, sender, kind: "text", text: "  hi  " });
  const saved = await ChatMessage.findOne({ conversation });
  assert.equal(saved.text, "hi");

  await assert.rejects(ChatMessage.create({ conversation, sender, kind: "text", text: "   " }));
  await assert.rejects(ChatMessage.create({ conversation, sender, kind: "text", text: "x".repeat(2001) }));
  await assert.rejects(ChatMessage.create({ conversation, sender, kind: "image" }));
  await ChatMessage.create({
    conversation,
    sender,
    kind: "image",
    media: { url: "https://cdn.test/a.jpg", publicId: "chat/a" },
  });
  await ChatMessage.create({ conversation, sender: null, kind: "system", text: "Asha created the group" });
});

test("a block is unique per (blocker, blocked)", async () => {
  const pair = { blocker: oid(), blocked: oid() };
  await ChatBlock.create(pair);
  await assert.rejects(ChatBlock.create(pair), (e) => e.code === 11000);
});
