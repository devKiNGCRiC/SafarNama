import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { seedPost } from "./helpers/seed.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import SafarPost from "../Models/safargramPostModel.js";
import SafarComment from "../Models/safargramCommentModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

let app, media;
before(async () => {
  await connectTestDb();
});
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  media = createFakeMedia();
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media, limits: testLimits }));
});

const url = (id) => `/api/v1/safargram/posts/${id}`;

test("GET returns one post; bad id 400; missing 404; needs login", async () => {
  const me = await createUser();
  const p = await seedPost(me, { caption: "one" });
  const ok = await request(app).get(url(p._id)).set(me.auth);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.caption, "one");
  assert.equal(ok.body.data.author.username, me.user.username);
  assert.equal((await request(app).get(url("abc")).set(me.auth)).status, 400);
  assert.equal((await request(app).get(url(new mongoose.Types.ObjectId())).set(me.auth)).status, 404);
  assert.equal((await request(app).get(url(p._id))).status, 401);
});

test("only the author or an admin can delete; others get 403", async () => {
  const author = await createUser();
  const stranger = await createUser();
  const admin = await createUser({ role: "admin" });
  const p1 = await seedPost(author);
  const p2 = await seedPost(author);

  assert.equal((await request(app).delete(url(p1._id)).set(stranger.auth)).status, 403);
  assert.equal(await SafarPost.countDocuments(), 2);
  assert.equal((await request(app).delete(url(p1._id)).set(author.auth)).status, 200);
  assert.equal((await request(app).delete(url(p2._id)).set(admin.auth)).status, 200);
  assert.equal(await SafarPost.countDocuments(), 0);
  assert.equal((await request(app).delete(url(p1._id)).set(author.auth)).status, 404);
});

test("deleting a post removes its comments, likes, saves and Cloudinary files", async () => {
  const author = await createUser();
  const fan = await createUser();
  const p = await seedPost(author, {
    media: [
      { type: "image", url: "https://cdn.test/1", publicId: "test/1" },
      { type: "image", url: "https://cdn.test/2", publicId: "test/2" },
    ],
  });
  const other = await seedPost(author);
  await SafarComment.create({ post: p._id, author: fan.user._id, text: "hi" });
  await SafarLike.create({ post: p._id, user: fan.user._id });
  await SafarSave.create({ post: p._id, user: fan.user._id });
  await SafarLike.create({ post: other._id, user: fan.user._id });

  assert.equal((await request(app).delete(url(p._id)).set(author.auth)).status, 200);
  assert.equal(await SafarComment.countDocuments({ post: p._id }), 0);
  assert.equal(await SafarLike.countDocuments({ post: p._id }), 0);
  assert.equal(await SafarSave.countDocuments({ post: p._id }), 0);
  assert.equal(await SafarLike.countDocuments({ post: other._id }), 1);
  assert.deepEqual(media.removed.map((m) => m.publicId).sort(), ["test/1", "test/2"]);
});
