import { test } from "node:test";
import assert from "node:assert/strict";
import { actorName, describe, targetPath, thumbUrl } from "./notificationText.js";

const actor = { username: "asha", firstName: "Asha", lastName: "Rao" };

test("actorName prefers the username, falls back to the name, then 'Someone'", () => {
  assert.equal(actorName(actor), "asha");
  assert.equal(actorName({ firstName: "Asha", lastName: "Rao" }), "Asha Rao");
  assert.equal(actorName(null), "Someone");
});

test("describe says what happened", () => {
  assert.equal(describe({ type: "like" }), "liked your post");
  assert.equal(describe({ type: "follow" }), "started following you");
  assert.equal(describe({ type: "comment", text: "Great shot" }), "commented: “Great shot”");
  assert.equal(describe({ type: "comment" }), "commented on your post");
});

test("targetPath opens the post for likes/comments and the profile for follows", () => {
  assert.equal(targetPath({ type: "like", actor, post: { _id: "p1" } }), "/safargram/post/p1");
  assert.equal(targetPath({ type: "comment", actor, post: { _id: "p2" } }), "/safargram/post/p2");
  assert.equal(targetPath({ type: "follow", actor }), "/profile/asha");
  assert.equal(targetPath({ type: "like", actor, post: null }), "/notifications"); // post was deleted
});

test("thumbUrl handles photos, videos and missing media", () => {
  assert.equal(thumbUrl({ post: { thumb: { url: "https://x/p.jpg", type: "image" } } }), "https://x/p.jpg");
  assert.equal(thumbUrl({ post: { thumb: { url: "https://x/v.mp4", type: "video" } } }), "https://x/v.jpg");
  assert.equal(thumbUrl({ post: null }), "");
});
