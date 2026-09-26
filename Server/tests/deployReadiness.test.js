import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import {
  cloudinaryConfigured,
  shouldUseCloudinary,
  trustProxySetting,
  validateEnv,
} from "../config/env.js";
import { featureGate } from "../Middleware/featureGate.js";
import { createHealthRouter } from "../Routes/healthRoutes.js";

const good = {
  MONGO_DB: "mongodb://localhost/x",
  JWT_SECRET_KEY: "x".repeat(64),
  CLOUDINARY_CLOUD_NAME: "c",
  CLOUDINARY_API_KEY: "k",
  CLOUDINARY_API_SECRET: "s",
  EMAIL_USERNAME: "a@b.c",
  EMAIL_PASSWORD: "pw",
};

test("a complete environment has no errors and no warnings", () => {
  assert.deepEqual(validateEnv(good), { errors: [], warnings: [] });
});

test("missing database or JWT secret are startup errors", () => {
  const { errors } = validateEnv({});
  assert.ok(errors.some((e) => /MONGO_DB/.test(e)));
  assert.ok(errors.some((e) => /JWT_SECRET_KEY/.test(e)));
});

test("a short JWT secret is a warning in development but an error in production", () => {
  const short = { ...good, JWT_SECRET_KEY: "short" };
  assert.equal(validateEnv(short).errors.length, 0);
  assert.equal(validateEnv(short).warnings.length, 1);
  const prod = validateEnv({ ...short, NODE_ENV: "production", CLIENT_URL: "https://x.app" });
  assert.ok(prod.errors.some((e) => /JWT_SECRET_KEY/.test(e)));
});

test("production requires CLIENT_URL", () => {
  const { errors } = validateEnv({ ...good, NODE_ENV: "production" });
  assert.ok(errors.some((e) => /CLIENT_URL/.test(e)));
  assert.equal(validateEnv({ ...good, NODE_ENV: "production", CLIENT_URL: "https://x.app" }).errors.length, 0);
});

test("missing Cloudinary or email settings only warn", () => {
  const { errors, warnings } = validateEnv({ MONGO_DB: "m", JWT_SECRET_KEY: "x".repeat(40) });
  assert.equal(errors.length, 0);
  assert.ok(warnings.some((w) => /Cloudinary/.test(w)));
  assert.ok(warnings.some((w) => /mail/i.test(w)));
});

test("Cloudinary is used whenever it is configured, unless explicitly switched off", () => {
  assert.equal(cloudinaryConfigured(good), true);
  assert.equal(cloudinaryConfigured({}), false);
  assert.equal(shouldUseCloudinary(good), true);
  assert.equal(shouldUseCloudinary({ ...good, USE_CLOUDINARY: "false" }), false);
  assert.equal(shouldUseCloudinary({ USE_CLOUDINARY: "true" }), false); // no credentials -> cannot
});

test("trust proxy: on (1 hop) in production, overridable, off in development", () => {
  assert.equal(trustProxySetting({}), false);
  assert.equal(trustProxySetting({ NODE_ENV: "production" }), 1);
  assert.equal(trustProxySetting({ NODE_ENV: "production", TRUST_PROXY: "2" }), 2);
  assert.equal(trustProxySetting({ TRUST_PROXY: "1" }), 1);
});

const FLAG = "TEST_FEATURE_FLAG";
afterEach(() => {
  delete process.env[FLAG];
});

test("featureGate answers 404 until the flag is 'true' (checked on every request)", async () => {
  const app = express();
  app.use("/thing", featureGate(FLAG, "Booking"), (req, res) => res.json({ ok: true }));

  const off = await request(app).get("/thing");
  assert.equal(off.status, 404);
  assert.match(off.body.message, /Booking is not available yet/);

  process.env[FLAG] = "true";
  assert.equal((await request(app).get("/thing")).status, 200);

  process.env[FLAG] = "false";
  assert.equal((await request(app).get("/thing")).status, 404);
});

test("health reports ok when the database is up and 503 when it is not", async () => {
  let up = true;
  const app = express();
  app.use("/health", createHealthRouter({ isDbReady: () => up }));

  const ok = await request(app).get("/health");
  assert.equal(ok.status, 200);
  assert.equal(ok.body.status, "ok");
  assert.equal(ok.body.db, "up");
  assert.equal(typeof ok.body.uptimeSeconds, "number");

  up = false;
  const down = await request(app).get("/health");
  assert.equal(down.status, 503);
  assert.equal(down.body.db, "down");
});
