import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { seedPost } from "./helpers/seed.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import SafarPost from "../Models/safargramPostModel.js";
import Profile from "../Models/profileModel.js";
import ChatBlock from "../Models/chatBlockModel.js";
import Destination from "../Models/destinationModel.js";

let app;
before(async () => {
  await connectTestDb();
  await SafarPost.init(); // builds the caption text index
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media: createFakeMedia(), limits: testLimits }));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const get = (path, u) => request(app).get(`/api/v1/safargram${path}`).set(u?.auth || {});
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);

test("explore, search and suggestions require a login", async () => {
  for (const path of ["/explore", "/search?type=people&q=ab", "/suggested-people"]) {
    assert.equal((await get(path)).status, 401, path);
  }
});

test("explore ranks the last 30 days by likes + 2x comments, then fills with older posts", async () => {
  const me = await createUser();
  await seedPost(me, { caption: "quiet", likesCount: 0, commentsCount: 0 });
  await seedPost(me, { caption: "liked", likesCount: 5, commentsCount: 0 }); // score 5
  await seedPost(me, { caption: "discussed", likesCount: 1, commentsCount: 3 }); // score 7
  await seedPost(me, { caption: "ancient hit", likesCount: 999, commentsCount: 99, createdAt: daysAgo(45) });

  const res = await get("/explore", me);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["discussed", "liked", "quiet", "ancient hit"]);
  assert.equal(res.body.nextCursor, null);
});

test("a category filters newest-first with paging; unknown categories are rejected", async () => {
  const me = await createUser();
  for (let i = 0; i < 3; i++) await seedPost(me, { caption: `trek${i}`, category: "Trekking" });
  await seedPost(me, { caption: "beach", category: "Beach" });

  const first = await get("/explore?category=Trekking&limit=2", me);
  assert.deepEqual(first.body.data.map((p) => p.caption), ["trek2", "trek1"]);
  const second = await get(`/explore?category=Trekking&limit=2&cursor=${first.body.nextCursor}`, me);
  assert.deepEqual(second.body.data.map((p) => p.caption), ["trek0"]);
  assert.equal((await get("/explore?category=Nope", me)).status, 400);
});

test("search validates its input", async () => {
  const me = await createUser();
  assert.equal((await get("/search?type=nope&q=abc", me)).status, 400);
  assert.equal((await get("/search?type=people", me)).status, 400);
  assert.equal((await get("/search?type=people&q=a", me)).status, 400);
});

test("people search matches username or name prefixes, hides me, and reports who I follow", async () => {
  const me = await createUser({ username: "asha_me", firstName: "Asha" });
  const ravi = await createUser({ username: "ravi_k", firstName: "Ravi", lastName: "Kumar" });
  await createUser({ username: "meera", firstName: "Raviraj" });
  await createUser({ username: "other", firstName: "Zed" });
  await Profile.create({ user: me.user._id, following: [ravi.user._id] });

  const res = await get("/search?type=people&q=RAVI", me);
  assert.equal(res.status, 200);
  const byName = Object.fromEntries(res.body.data.map((u) => [u.username, u]));
  assert.deepEqual(Object.keys(byName).sort(), ["meera", "ravi_k"]);
  assert.equal(byName.ravi_k.isFollowing, true);
  assert.equal(byName.meera.isFollowing, false);

  assert.deepEqual((await get("/search?type=people&q=asha", me)).body.data, []); // that is me
});

test("hashtag search: prefix, counts, most used first, '#' ignored", async () => {
  const me = await createUser();
  await seedPost(me, { hashtags: ["spiti", "spring"] });
  await seedPost(me, { hashtags: ["spiti"] });
  await seedPost(me, { hashtags: ["goa"] });

  const res = await get("/search?type=hashtags&q=%23sp", me);
  assert.deepEqual(res.body.data, [
    { tag: "spiti", count: 2 },
    { tag: "spring", count: 1 },
  ]);
  assert.equal((await get("/search?type=hashtags&q=bad!", me)).status, 400);
});

test("place search finds destinations by name with their post counts", async () => {
  const me = await createUser();
  const spiti = (await Destination.collection.insertOne({ name: "Spiti Valley" })).insertedId;
  await Destination.collection.insertOne({ name: "Munnar" });
  await seedPost(me, { destination: spiti });
  await seedPost(me, { destination: spiti });

  const res = await get("/search?type=places&q=spiti", me);
  assert.deepEqual(res.body.data.map((d) => ({ name: d.name, count: d.count })), [{ name: "Spiti Valley", count: 2 }]);
  assert.equal(String(res.body.data[0]._id), String(spiti));
  assert.equal((await get("/search?type=places&q=%28%28", me)).body.data.length, 0); // regex characters are escaped
});

test("post search finds captions by word, newest first", async () => {
  const me = await createUser();
  await seedPost(me, { caption: "Sunrise over the monastery" });
  await seedPost(me, { caption: "Street food in Delhi" });
  await seedPost(me, { caption: "Monastery stairs at dusk" });

  const res = await get("/search?type=posts&q=monastery", me);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["Monastery stairs at dusk", "Sunrise over the monastery"]);
});

test("suggested travellers: most posts first, never me, people I follow or anyone blocked", async () => {
  const me = await createUser();
  const star = await createUser();
  const casual = await createUser();
  const followed = await createUser();
  const blocked = await createUser();
  await createUser(); // never posted: not suggested

  for (let i = 0; i < 3; i++) await seedPost(star);
  await seedPost(casual);
  await seedPost(followed);
  await seedPost(blocked);
  await seedPost(me);
  await Profile.create({ user: me.user._id, following: [followed.user._id] });
  await ChatBlock.create({ blocker: me.user._id, blocked: blocked.user._id });

  const res = await get("/suggested-people", me);
  assert.equal(res.status, 200);
  assert.deepEqual(
    res.body.data.map((u) => [u.username, u.postsCount]),
    [
      [star.user.username, 3],
      [casual.user.username, 1],
    ],
  );
});
