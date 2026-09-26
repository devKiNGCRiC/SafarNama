import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldExpireSession } from "./sessionRules.js";

const err = (status, url = "/api/v1/safargram/feed", headers = { Authorization: "Bearer x" }, baseURL = "") => ({
  response: { status },
  config: { url, baseURL, headers },
});

test("a 401 on a token-carrying API call while logged in ends the session", () => {
  assert.equal(shouldExpireSession(err(401), { isAuthenticated: true }), true);
});

test("other statuses never end the session", () => {
  for (const status of [400, 403, 404, 500]) {
    assert.equal(shouldExpireSession(err(status), { isAuthenticated: true }), false, String(status));
  }
});

test("not logged in, or no token sent (third-party call): nothing to expire", () => {
  assert.equal(shouldExpireSession(err(401), { isAuthenticated: false }), false);
  assert.equal(shouldExpireSession(err(401, "https://api.weather.test/x", {}), { isAuthenticated: true }), false);
});

test("a wrong password (login / register / reset calls) is not an expired session", () => {
  assert.equal(shouldExpireSession(err(401, "/login", { Authorization: "Bearer x" }, "http://x/api/v1/auth/"), { isAuthenticated: true }), false);
  assert.equal(shouldExpireSession(err(401, "http://x/api/v1/auth/login"), { isAuthenticated: true }), false);
});

test("network errors (no response) are ignored", () => {
  assert.equal(shouldExpireSession({ config: { url: "/x", headers: {} } }, { isAuthenticated: true }), false);
  assert.equal(shouldExpireSession(undefined, { isAuthenticated: true }), false);
});
