import { test } from "node:test";
import assert from "node:assert/strict";
import { auditSentence, starText, statusOf, userActionsFor } from "./adminFormat.js";

const member = { _id: "u1", username: "asha", role: "user", accountStatus: "active", isActive: true };

test("statusOf reads suspended before deactivated before active", () => {
  assert.equal(statusOf(member).id, "active");
  assert.equal(statusOf({ ...member, isActive: false }).id, "deactivated");
  assert.equal(statusOf({ ...member, accountStatus: "suspended", isActive: false }).id, "suspended");
});

test("a normal member can be suspended, deactivated or made admin", () => {
  assert.deepEqual(userActionsFor(member, "me").map((a) => a.id), ["suspend", "deactivate", "make-admin"]);
});

test("suspended and deactivated members get the way back, plus make-admin", () => {
  assert.deepEqual(userActionsFor({ ...member, accountStatus: "suspended" }, "me").map((a) => a.id), ["unsuspend", "make-admin"]);
  assert.deepEqual(userActionsFor({ ...member, isActive: false }, "me").map((a) => a.id), ["reactivate", "make-admin"]);
});

test("admins can only be demoted, and nobody gets buttons for their own row", () => {
  assert.deepEqual(userActionsFor({ ...member, role: "admin" }, "me").map((a) => a.id), ["remove-admin"]);
  assert.deepEqual(userActionsFor({ ...member, _id: "me" }, "me"), []);
});

test("dangerous actions are marked and every action has a confirmation sentence", () => {
  const actions = userActionsFor(member, "me");
  assert.equal(actions.find((a) => a.id === "suspend").danger, true);
  assert.ok(actions.every((a) => a.confirm.includes("asha")));
});

test("auditSentence reads like a sentence and copes with missing data", () => {
  assert.equal(auditSentence({ action: "suspend", admin: { username: "boss" }, targetLabel: "ben" }), "boss suspended “ben”");
  assert.equal(auditSentence({ action: "report-dismissed", admin: null, targetLabel: "" }), "An admin dismissed a report about");
  assert.equal(auditSentence({ action: "mystery", admin: { username: "boss" } }), "boss mystery");
});

test("starText draws the rating and stays within 0-5", () => {
  assert.equal(starText(4), "★★★★☆");
  assert.equal(starText(9), "★★★★★");
  assert.equal(starText(0), "");
  assert.equal(starText(undefined), "");
});
