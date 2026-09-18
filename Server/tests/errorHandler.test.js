import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import multer from "multer";
import errorHandler from "../Middleware/errorHandler.js";

function appThrowing(makeError) {
  const app = express();
  app.get("/boom", (req, res, next) => next(makeError()));
  app.use(errorHandler);
  return app;
}

test("CastError becomes 400 (not 500) outside production", async () => {
  const app = appThrowing(
    () => new mongoose.Error.CastError("ObjectId", "abc", "_id"),
  );
  const res = await request(app).get("/boom");
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test("MulterError becomes 400 with a readable message", async () => {
  const app = appThrowing(() => new multer.MulterError("LIMIT_FILE_SIZE"));
  const res = await request(app).get("/boom");
  assert.equal(res.status, 400);
  assert.match(res.body.message, /too large/i);
});

test("unknown errors stay 500", async () => {
  const app = appThrowing(() => new Error("kaboom"));
  const res = await request(app).get("/boom");
  assert.equal(res.status, 500);
});
