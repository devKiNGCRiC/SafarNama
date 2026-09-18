import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import Profile from "../Models/profileModel.js";
import ChatBlock from "../Models/chatBlockModel.js";
import {
  PENDING_MESSAGE_LIMIT,
  blockState,
  directKeyFor,
  initialStatusFor,
  usersAreConnected,
} from "../services/chatRules.js";

before(connectTestDb);
after(disconnectTestDb);
beforeEach(clearTestDb);

const oid = () => new mongoose.Types.ObjectId();

test("directKeyFor is symmetric and sorted", () => {
  const a = "64b000000000000000000001";
  const b = "64b000000000000000000002";
  assert.equal(directKeyFor(a, b), `${a}:${b}`);
  assert.equal(directKeyFor(b, a), `${a}:${b}`);
});

test("initialStatusFor and the pending limit", () => {
  assert.equal(initialStatusFor(true), "active");
  assert.equal(initialStatusFor(false), "pending");
  assert.equal(PENDING_MESSAGE_LIMIT, 3);
});

test("usersAreConnected looks at follows in either direction", async () => {
  const a = oid();
  const b = oid();
  const c = oid();
  assert.equal(await usersAreConnected(a, b), false);
  await Profile.create({ user: a, following: [b] });
  assert.equal(await usersAreConnected(a, b), true);
  assert.equal(await usersAreConnected(b, a), true); // b is followed by a
  assert.equal(await usersAreConnected(a, c), false);
});

test("blockState reports both directions", async () => {
  const me = oid();
  const other = oid();
  assert.deepEqual(await blockState(me, other), { blockedByMe: false, blockedMe: false });
  await ChatBlock.create({ blocker: me, blocked: other });
  assert.deepEqual(await blockState(me, other), { blockedByMe: true, blockedMe: false });
  assert.deepEqual(await blockState(other, me), { blockedByMe: false, blockedMe: true });
});
