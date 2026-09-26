import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { createUser } from "./helpers/users.js";
import errorHandler from "../Middleware/errorHandler.js";
import profileRoutes from "../Routes/profileRoutes.js";
import { normalizeWebUrl } from "../utils/safeUrl.js";
import UserModel from "../Models/userModel.js";
import ProfileModel from "../Models/profileModel.js";
import Blog from "../Models/blogModel.js";
import SafarPost from "../Models/safargramPostModel.js";
import GalleryPhoto from "../Models/galleryPhotoModel.js";

let app;
before(connectTestDb);
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  app = express();
  app.use(express.json());
  app.use("/api/v1/profile", profileRoutes);
  app.use(errorHandler);
});

const base = "/api/v1/profile";
const view = (username, u) => request(app).get(`${base}/${username}`).set(u?.auth || {});
const update = (u, body) => request(app).put(`${base}/update`).set(u?.auth || {}).send(body);

const PRIVATE = [
  "password", "passwordResetToken", "passwordResetExpires", "emailVerificationToken", "emailVerificationExpires",
  "loginAttempts", "lockUntil", "passwordChangedAt", "lastLogin", "role", "accountStatus", "active", "preferences",
  "savedDestinations",
];

test("normalizeWebUrl accepts real web addresses and refuses everything dangerous", () => {
  assert.equal(normalizeWebUrl("https://example.com/trip?a=1"), "https://example.com/trip?a=1");
  assert.equal(normalizeWebUrl("example.com"), "https://example.com/");
  assert.equal(normalizeWebUrl("  http://blog.example.org  "), "http://blog.example.org/");
  assert.equal(normalizeWebUrl("example.com:8080/x"), "https://example.com:8080/x");
  const bad = [
    "javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,hi", "ftp://x.com", "mailto:a@b.co", "//evil",
    "https://user:pw@example.com", "localhost", "", "  ", 42, null, "x".repeat(201), "https://",
  ];
  for (const value of bad) assert.equal(normalizeWebUrl(value), null, String(value));
});

test("a public visitor sees only public fields: no email, tokens or private settings", async () => {
  const owner = await createUser({ username: "owner_x", firstName: "Asha", lastName: "Rao", avatar: "https://cdn.test/a.jpg" });
  await UserModel.updateOne(
    { _id: owner.user._id },
    { $set: { passwordResetToken: "resethash", emailVerificationToken: "verifyhash", loginAttempts: 3 } },
  );

  const res = await view("owner_x"); // not logged in
  assert.equal(res.status, 200);
  const { user, profile } = res.body.data;
  assert.deepEqual(Object.keys(user).sort(), ["_id", "avatar", "createdAt", "firstName", "lastName", "username"]);
  for (const key of PRIVATE) assert.equal(key in user, false, key);
  assert.equal(JSON.stringify(res.body).includes("resethash"), false);
  assert.equal(JSON.stringify(res.body).includes(owner.user.email), false);
  for (const key of ["savedPosts", "savedBlogs", "savedTours", "photos"]) assert.equal(key in profile, false, key);
  assert.equal(res.body.data.isOwnProfile, false);
});

test("another logged-in person sees the public view; the owner also sees their own email", async () => {
  const owner = await createUser({ username: "owner_x" });
  const other = await createUser();

  const asOther = await view("owner_x", other);
  assert.equal("email" in asOther.body.data.user, false);
  assert.equal(asOther.body.data.isOwnProfile, false);

  const asOwner = await view("owner_x", owner);
  assert.equal(asOwner.body.data.user.email, owner.user.email);
  assert.equal(asOwner.body.data.isOwnProfile, true);
  assert.equal("passwordResetToken" in asOwner.body.data.user, false);

  const me = await request(app).get(`${base}/me`).set(owner.auth);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.username, "owner_x");
  assert.equal(me.body.data.isOwnProfile, true);
  assert.equal((await request(app).get(`${base}/me`)).status, 401);

  // a broken token on a public page just means "not logged in"
  const bad = await request(app).get(`${base}/owner_x`).set({ Authorization: "Bearer garbage" });
  assert.equal(bad.status, 200);
  assert.equal("email" in bad.body.data.user, false);
});

test("the profile shows real counts and the person's blogs; unknown people are a clean 404", async () => {
  const owner = await createUser({ username: "owner_x" });
  const fan = await createUser();
  await SafarPost.create({ author: owner.user._id, media: [{ type: "image", url: "https://cdn.test/p", publicId: "p" }] });
  await GalleryPhoto.create({ owner: owner.user._id, url: "https://cdn.test/g", publicId: "g" });
  await Blog.create({ title: "Trek", description: "Long text", excerpt: "Short", image: "https://cdn.test/b", category: "Trekking", user: owner.user._id });
  await Blog.create({ title: "Someone else's blog", description: "x", image: "https://cdn.test/o", user: fan.user._id });
  await request(app).post(`${base}/follow/${owner.user._id}`).set(fan.auth);

  const res = await view("owner_x");
  assert.deepEqual(res.body.data.counts, { followers: 1, following: 0, posts: 1, blogs: 1, photos: 1 });
  assert.equal(res.body.data.blogs.length, 1);
  assert.deepEqual(Object.keys(res.body.data.blogs[0]).sort(), ["_id", "category", "createdAt", "excerpt", "image", "title"]);
  assert.equal(res.body.data.profile.followers[0].username, fan.user.username);
  assert.equal("email" in res.body.data.profile.followers[0], false);

  const missing = await view("nobody_here");
  assert.equal(missing.status, 404);
  assert.match(missing.body.message, /not found/i);
});

test("editing your profile saves clean values and returns the private view", async () => {
  const u = await createUser();
  const res = await update(u, {
    firstName: "  Asha ",
    lastName: "Rao",
    bio: "Slow travel, big trees.",
    location: "Coorg",
    occupation: "Guide",
    website: "example.com/asha",
    interests: ["Trekking", "trekking", " Birding "],
    socialLinks: [{ platform: "Instagram", url: "instagram.com/asha" }],
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.firstName, "Asha");
  assert.equal(res.body.data.user.email, u.user.email);
  assert.equal("passwordResetToken" in res.body.data.user, false);
  const saved = await ProfileModel.findOne({ user: u.user._id }).lean();
  assert.equal(saved.website, "https://example.com/asha");
  assert.deepEqual(saved.interests, ["Trekking", "Birding"]);
  assert.deepEqual(saved.socialLinks.map((l) => [l.platform, l.url]), [["instagram", "https://instagram.com/asha"]]);
});

test("empty values clear a field, and fields that were not sent are left alone", async () => {
  const u = await createUser({ firstName: "Keep", lastName: "Name" });
  await update(u, { bio: "Hello", website: "example.com", interests: ["a"], socialLinks: [{ platform: "youtube", url: "youtube.com/x" }] });
  const res = await update(u, { bio: "", website: "", interests: [], socialLinks: [] });
  assert.equal(res.status, 200);
  const saved = await ProfileModel.findOne({ user: u.user._id }).lean();
  assert.equal(saved.bio, "");
  assert.equal(saved.website, "");
  assert.deepEqual([saved.interests, saved.socialLinks], [[], []]);
  assert.equal((await UserModel.findById(u.user._id)).firstName, "Keep");
});

test("profile edits are validated: lengths, safe links, allowed platforms, list sizes", async () => {
  const u = await createUser();
  const cases = [
    [{ firstName: "A" }, /first name/i],
    [{ lastName: "x".repeat(51) }, /last name/i],
    [{ firstName: { $ne: "" } }, /first name/i],
    [{ bio: "x".repeat(501) }, /bio/i],
    [{ location: "x".repeat(81) }, /location/i],
    [{ occupation: "x".repeat(81) }, /occupation/i],
    [{ website: "javascript:alert(1)" }, /website/i],
    [{ website: "x".repeat(300) }, /website/i],
    [{ interests: Array.from({ length: 11 }, (_, i) => `tag${i}`) }, /at most 10/i],
    [{ interests: ["x".repeat(31)] }, /at most 30/i],
    [{ interests: "trekking" }, /list/i],
    [{ socialLinks: [{ platform: "myspace", url: "https://x.com" }] }, /platform/i],
    [{ socialLinks: [{ platform: "instagram", url: "javascript:alert(document.cookie)" }] }, /instagram link/i],
    [{ socialLinks: [{ platform: "instagram", url: "a.com" }, { platform: "instagram", url: "b.com" }] }, /only one/i],
    [{ socialLinks: Array.from({ length: 6 }, () => ({ platform: "youtube", url: "y.com" })) }, /at most 5/i],
  ];
  for (const [body, message] of cases) {
    const res = await update(u, body);
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
    assert.match(res.body.message, message);
  }
  assert.equal((await update(null, { bio: "x" })).status, 401);
});

test("you cannot change protected fields through the profile form", async () => {
  const u = await createUser();
  const other = await createUser();
  await update(u, {
    bio: "ok",
    role: "admin",
    email: "x@y.co",
    username: "hacker",
    followers: [String(other.user._id)],
    stats: { totalLikes: 999 },
  });
  const user = await UserModel.findById(u.user._id);
  assert.equal(user.role, "user");
  assert.equal(user.email, u.user.email);
  assert.equal(user.username, u.user.username);
  const profile = await ProfileModel.findOne({ user: u.user._id });
  assert.equal(profile.followers.length, 0);
  assert.equal(profile.stats.totalLikes, 0);
});
