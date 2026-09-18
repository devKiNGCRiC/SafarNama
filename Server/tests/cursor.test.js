import { test } from "node:test";
import assert from "node:assert/strict";
import { assertObjectId, parsePaging, cursorFilter, toPage } from "../utils/cursor.js";

const ID = "64b000000000000000000001";

test("assertObjectId accepts 24-hex ids and rejects everything else with 400", () => {
  assert.equal(assertObjectId(ID), ID);
  for (const bad of ["abc", "", undefined, 123, "zzzzzzzzzzzzzzzzzzzzzzzz"]) {
    assert.throws(() => assertObjectId(bad), (e) => e.statusCode === 400);
  }
});

test("parsePaging applies defaults, clamps and validates", () => {
  assert.deepEqual(parsePaging({}), { limit: 10, cursor: null });
  assert.equal(parsePaging({ limit: "500" }).limit, 20);
  assert.equal(parsePaging({ cursor: ID }).cursor, ID);
  assert.throws(() => parsePaging({ limit: "0" }), (e) => e.statusCode === 400);
  assert.throws(() => parsePaging({ limit: "abc" }), (e) => e.statusCode === 400);
  assert.throws(() => parsePaging({ cursor: "nope" }), (e) => e.statusCode === 400);
});

test("cursorFilter and toPage", () => {
  assert.deepEqual(cursorFilter(null), {});
  assert.deepEqual(cursorFilter(ID), { _id: { $lt: ID } });
  const rows = [{ _id: "3" }, { _id: "2" }, { _id: "1" }];
  assert.deepEqual(toPage(rows, 2), { page: rows.slice(0, 2), nextCursor: "2" });
  assert.deepEqual(toPage(rows, 3), { page: rows, nextCursor: null });
});
