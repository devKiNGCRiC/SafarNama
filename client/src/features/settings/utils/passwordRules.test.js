import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPassword, isStrongPassword, passwordFormError } from "./passwordRules.js";

test("checkPassword reports each rule separately", () => {
  const missing = checkPassword("abc").filter((r) => !r.ok).map((r) => r.id);
  assert.deepEqual(missing, ["length", "upper", "number", "special"]);
  assert.deepEqual(checkPassword("Str0ng@Pass1").filter((r) => !r.ok), []);
});

test("isStrongPassword matches the server rules, including the length cap", () => {
  assert.equal(isStrongPassword("Str0ng@Pass1"), true);
  assert.equal(isStrongPassword("alllowercase1!"), false);
  assert.equal(isStrongPassword("NoNumber@Here"), false);
  assert.equal(isStrongPassword("Sh0rt!"), false);
  assert.equal(isStrongPassword(`Aa1@${"x".repeat(130)}`), false);
  assert.equal(isStrongPassword(), false);
});

test("passwordFormError finds the first problem, or returns null", () => {
  const good = { current: "Old@Pass123", next: "New@Pass456", confirm: "New@Pass456" };
  assert.equal(passwordFormError(good), null);
  assert.match(passwordFormError({ ...good, current: "" }), /current/i);
  assert.match(passwordFormError({ ...good, next: "weak", confirm: "weak" }), /rules/i);
  assert.match(passwordFormError({ ...good, next: good.current, confirm: good.current }), /different/i);
  assert.match(passwordFormError({ ...good, confirm: "Other@Pass456" }), /match/i);
});
