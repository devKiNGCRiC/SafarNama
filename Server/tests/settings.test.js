import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeRealtime } from "./helpers/fakeRealtime.js";
import { createSettingsRouter } from "../Routes/settingsRoutes.js";
import { configureNotifier, notify } from "../services/notifier.js";
import { createSecureToken } from "../utils/security.js";
import UserModel from "../Models/userModel.js";
import Notification from "../Models/notificationModel.js";

let app;
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  configureNotifier(createFakeRealtime());
  app = buildApp("/api/v1/settings", createSettingsRouter({ limits: { sensitive: { windowMs: 60_000, max: 100 } } }));
});

const base = "/api/v1/settings";
const PASSWORD = "Str0ng@Pass1"; // what createUser gives everyone
const NEW_PASSWORD = "Br@nd-New-Pass9";
const api = {
  get: (u) => request(app).get(base).set(u?.auth || {}),
  prefs: (u, body) => request(app).put(`${base}/preferences`).set(u?.auth || {}).send(body),
  password: (u, body) => request(app).put(`${base}/password`).set(u?.auth || {}).send(body),
  signOutEverywhere: (u) => request(app).post(`${base}/sign-out-everywhere`).set(u?.auth || {}),
  deactivate: (u, body) => request(app).post(`${base}/deactivate`).set(u?.auth || {}).send(body),
};

// A user whose password was set an hour ago, plus a token that was issued 60 seconds ago
// (so we can prove a password change kicks out tokens issued before it).
async function seasonedUser(overrides = {}) {
  const u = await createUser({ passwordChangedAt: new Date(Date.now() - 3_600_000), ...overrides });
  const old = createSecureToken(u.user._id, { userRole: u.user.role, iat: Math.floor(Date.now() / 1000) - 60 });
  return { ...u, oldAuth: { Authorization: `Bearer ${old}` } };
}

test("settings need a login and never expose secrets", async () => {
  assert.equal((await api.get(null)).status, 401);

  const u = await createUser();
  const res = await api.get(u);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.account.username, u.user.username);
  assert.equal(res.body.data.account.email, u.user.email);
  assert.equal("password" in res.body.data.account, false);
  assert.equal(JSON.stringify(res.body).includes("Token"), false);
  assert.deepEqual(res.body.data.preferences.notifications, { likes: true, comments: true, follows: true, replies: true });
});

test("notification preferences: partial updates, strict validation, and they persist", async () => {
  const u = await createUser();
  const res = await api.prefs(u, { notifications: { likes: false } });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.notifications, { likes: false, comments: true, follows: true, replies: true });
  assert.deepEqual((await api.get(u)).body.data.preferences.notifications, { likes: false, comments: true, follows: true, replies: true });

  for (const bad of [{}, { notifications: { likes: "no" } }, { notifications: { shouting: true } }, { notifications: [] }]) {
    assert.equal((await api.prefs(u, bad)).status, 400, JSON.stringify(bad));
  }
  const saved = await UserModel.findById(u.user._id);
  assert.equal(saved.preferences.notifications.likes, false);
});

test("a turned-off notification kind is not created, the others still are", async () => {
  const owner = await createUser();
  const fan = await createUser();
  await api.prefs(owner, { notifications: { likes: false } });

  assert.equal(await notify({ recipient: owner.user._id, actor: fan.user._id, type: "like" }), null);
  assert.ok(await notify({ recipient: owner.user._id, actor: fan.user._id, type: "follow" }));
  assert.equal(await Notification.countDocuments({ recipient: owner.user._id }), 1);

  await api.prefs(owner, { notifications: { likes: true } });
  assert.ok(await notify({ recipient: owner.user._id, actor: fan.user._id, type: "like" }));
});

test("changing the password checks the old one, enforces the rules, and signs out old sessions", async () => {
  const u = await seasonedUser();

  assert.equal((await api.password(null, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD })).status, 401);

  // wrong current password is a 400 (a 401 would make the site log the person out)
  const wrong = await api.password(u, { currentPassword: "Wr0ng@Pass1", newPassword: NEW_PASSWORD });
  assert.equal(wrong.status, 400);
  assert.match(wrong.body.message, /current password/i);

  for (const [newPassword, part] of [
    ["Sh0rt!", "at least 8"],
    ["alllowercase1!", "uppercase"],
    [PASSWORD, "different"],
  ]) {
    const res = await api.password(u, { currentPassword: PASSWORD, newPassword });
    assert.equal(res.status, 400, newPassword);
    assert.match(res.body.message, new RegExp(part, "i"), newPassword);
  }
  assert.equal((await api.password(u, { currentPassword: PASSWORD })).status, 400);
  assert.equal((await api.password(u, { currentPassword: { $ne: "" }, newPassword: NEW_PASSWORD })).status, 400);

  const ok = await api.password(u, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const saved = await UserModel.findById(u.user._id).select("+password");
  assert.equal(await saved.comparePassword(NEW_PASSWORD), true);
  assert.equal(await saved.comparePassword(PASSWORD), false);

  // the token from before the change is dead, the fresh one works
  assert.equal((await api.get({ auth: u.oldAuth })).status, 401);
  assert.equal((await api.get({ auth: { Authorization: `Bearer ${ok.body.token}` } })).status, 200);
});

test("sign out everywhere ends other sessions but keeps this one", async () => {
  const u = await seasonedUser();
  assert.equal((await api.get({ auth: u.oldAuth })).status, 200);

  const res = await api.signOutEverywhere(u);
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal((await api.get({ auth: u.oldAuth })).status, 401);
  assert.equal((await api.get({ auth: { Authorization: `Bearer ${res.body.token}` } })).status, 200);
});

test("deactivating needs the password, closes the account, and is blocked for the last admin", async () => {
  const u = await createUser();
  assert.equal((await api.deactivate(u, {})).status, 400);
  const wrong = await api.deactivate(u, { password: "Wr0ng@Pass1" });
  assert.equal(wrong.status, 400);
  assert.equal((await UserModel.findById(u.user._id).select("+active")).active, true);

  const ok = await api.deactivate(u, { password: PASSWORD });
  assert.equal(ok.status, 200);
  assert.equal((await UserModel.findById(u.user._id).select("+active")).active, false);
  assert.equal((await api.get(u)).status, 401); // the account no longer works

  const onlyAdmin = await createUser({ role: "admin" });
  const blocked = await api.deactivate(onlyAdmin, { password: PASSWORD });
  assert.equal(blocked.status, 400);
  assert.match(blocked.body.message, /only admin/i);

  const secondAdmin = await createUser({ role: "admin" });
  assert.equal((await api.deactivate(onlyAdmin, { password: PASSWORD })).status, 200);
  assert.equal((await api.get(secondAdmin)).status, 200);
});

test("password and deactivate attempts are rate limited per person", async () => {
  const limited = buildApp("/api/v1/settings", createSettingsRouter({ limits: { sensitive: { windowMs: 60_000, max: 3 } } }));
  const u = await createUser();
  const tries = [];
  for (let i = 0; i < 4; i += 1) {
    tries.push(
      (await request(limited).put(`${base}/password`).set(u.auth).send({ currentPassword: "Wr0ng@Pass1", newPassword: NEW_PASSWORD })).status,
    );
  }
  assert.deepEqual(tries, [400, 400, 400, 429]);
});
