import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createNewsletterRouter } from "../Routes/newsletterRoutes.js";
import Subscriber from "../Models/subscriberModel.js";

let app;
before(async () => {
  await connectTestDb();
  await Subscriber.init();
  app = buildApp("/api/v1/newsletter", createNewsletterRouter({ limit: { windowMs: 60_000, max: 1000 } }));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const subscribe = (email) => request(app).post("/api/v1/newsletter").send({ email });

test("a new address is saved (lower-cased and trimmed)", async () => {
  const res = await subscribe("  Asha@Example.COM ");
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  const saved = await Subscriber.find();
  assert.deepEqual(saved.map((s) => s.email), ["asha@example.com"]);
});

test("subscribing again is harmless and reports it", async () => {
  await subscribe("a@b.co");
  const again = await subscribe("A@B.co");
  assert.equal(again.status, 200);
  assert.match(again.body.message, /already/i);
  assert.equal(await Subscriber.countDocuments(), 1);
});

test("invalid or missing emails are rejected", async () => {
  for (const bad of ["", "nope", "a@b", "a b@c.de", 123, null, { $gt: "" }, "x".repeat(260) + "@a.bc"]) {
    const res = await subscribe(bad);
    assert.equal(res.status, 400, JSON.stringify(bad));
  }
  assert.equal(await Subscriber.countDocuments(), 0);
});

test("signups are rate limited per visitor", async () => {
  const limited = buildApp("/n", createNewsletterRouter({ limit: { windowMs: 60_000, max: 2 } }));
  const post = (email) => request(limited).post("/n").send({ email });
  assert.equal((await post("a@b.co")).status, 201);
  assert.equal((await post("c@d.co")).status, 201);
  assert.equal((await post("e@f.co")).status, 429);
});
