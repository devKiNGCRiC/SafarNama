import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { io as connect } from "socket.io-client";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { createUser } from "./helpers/users.js";
import { seedDirect } from "./helpers/chat.js";
import { attachChatSocket } from "../services/chatSocket.js";
import UserModel from "../Models/userModel.js";

let server, realtime, url;
const clients = [];

before(async () => {
  await connectTestDb();
  server = http.createServer();
  realtime = attachChatSocket(server, { origins: ["http://localhost:5173"] });
  await new Promise((resolve) => server.listen(0, resolve));
  url = `http://localhost:${server.address().port}`;
});
after(async () => {
  clients.forEach((c) => c.close());
  await realtime.close();
  await disconnectTestDb();
});
beforeEach(async () => {
  clients.splice(0).forEach((c) => c.close());
  await clearTestDb();
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function open(token) {
  const socket = connect(url, { auth: { token }, transports: ["websocket"], reconnection: false });
  clients.push(socket);
  return socket;
}
function connected(socket) {
  return new Promise((resolve, reject) => {
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
    setTimeout(() => reject(new Error("timeout")), 3000);
  });
}
const login = (token) => connected(open(token));
function next(socket, event, ms = 2000) {
  return new Promise((resolve, reject) => {
    socket.once(event, resolve);
    setTimeout(() => reject(new Error(`no "${event}" within ${ms}ms`)), ms);
  });
}
// Resolves true if the event does NOT arrive within the window.
async function silent(socket, event, ms = 250) {
  let got = false;
  socket.once(event, () => (got = true));
  await wait(ms);
  socket.off(event);
  return !got;
}

test("connections without a token or with a bad token are refused", async () => {
  await assert.rejects(connected(open(undefined)), /Authentication required/);
  await assert.rejects(connected(open("not-a-token")), /Unauthorized|Authentication/);
});

test("an inactive user cannot connect", async () => {
  const u = await createUser();
  await UserModel.updateOne({ _id: u.user._id }, { $set: { active: false } });
  await assert.rejects(connected(open(u.token)), /Unauthorized/);
});

test("a valid token connects and counts as online", async () => {
  const u = await createUser();
  assert.deepEqual(realtime.onlineIds([u.user._id]), []);
  await login(u.token);
  assert.deepEqual(realtime.onlineIds([u.user._id]), [String(u.user._id)]);
});

test("emitToUsers reaches every socket of that user and nobody else", async () => {
  const a = await createUser();
  const b = await createUser();
  const a1 = await login(a.token);
  const a2 = await login(a.token);
  const b1 = await login(b.token);

  const got1 = next(a1, "message:new");
  const got2 = next(a2, "message:new");
  const otherSilent = silent(b1, "message:new");
  realtime.emitToUsers([a.user._id], "message:new", { hello: "world" });

  assert.deepEqual(await got1, { hello: "world" });
  assert.deepEqual(await got2, { hello: "world" });
  assert.equal(await otherSilent, true);
});

test("typing is relayed to the other members only, and ignored for non-members", async () => {
  const a = await createUser();
  const b = await createUser();
  const c = await createUser();
  const conv = await seedDirect(a, b);
  const sa = await login(a.token);
  const sb = await login(b.token);
  const sc = await login(c.token);

  const toB = next(sb, "typing");
  const aSilent = silent(sa, "typing");
  const cSilent = silent(sc, "typing");
  sa.emit("typing", { conversationId: String(conv._id), isTyping: true });
  assert.deepEqual(await toB, { conversationId: String(conv._id), userId: String(a.user._id), isTyping: true });
  assert.equal(await aSilent, true);
  assert.equal(await cSilent, true);

  const bSilent = silent(sb, "typing");
  sc.emit("typing", { conversationId: String(conv._id), isTyping: true }); // c is not a member
  sc.emit("typing", { conversationId: "garbage", isTyping: true }); // invalid id must not crash
  assert.equal(await bSilent, true);
});

test("presence: watchers get the current state, then online/offline changes (once per user, not per socket)", async () => {
  const a = await createUser();
  const b = await createUser();
  const sb = await login(b.token);

  const state = next(sb, "presence:state");
  sb.emit("presence:watch", { userIds: [String(a.user._id)] });
  assert.deepEqual((await state).online, []);

  const cameOnline = next(sb, "presence");
  const a1 = await login(a.token);
  assert.deepEqual(await cameOnline, { userId: String(a.user._id), online: true });

  const noSecondOnline = silent(sb, "presence");
  const a2 = await login(a.token);
  assert.equal(await noSecondOnline, true);

  const stillOnline = silent(sb, "presence");
  a1.close();
  assert.equal(await stillOnline, true); // a2 is still connected

  const wentOffline = next(sb, "presence");
  a2.close();
  assert.deepEqual(await wentOffline, { userId: String(a.user._id), online: false });
});

test("presence:watch with junk input is ignored safely", async () => {
  const a = await createUser();
  const sa = await login(a.token);
  sa.emit("presence:watch", { userIds: "nope" });
  sa.emit("presence:watch", {});
  sa.emit("presence:watch", { userIds: Array.from({ length: 101 }, () => "64b000000000000000000001") });
  await wait(150);
  assert.equal(sa.connected, true);
});
