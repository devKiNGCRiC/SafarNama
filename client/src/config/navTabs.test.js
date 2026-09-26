import { test } from "node:test";
import assert from "node:assert/strict";
import { activeTab, showBottomNav } from "./navTabs.js";

test("activeTab highlights the tab a page belongs to, including nested pages", () => {
  assert.equal(activeTab("/"), "home");
  assert.equal(activeTab("/home"), "home");
  assert.equal(activeTab("/destinations"), "explore");
  assert.equal(activeTab("/destinations/abc123"), "explore");
  assert.equal(activeTab("/map"), "explore");
  assert.equal(activeTab("/safargram/post/123"), "safargram");
  assert.equal(activeTab("/safargram/explore"), "safargram");
  assert.equal(activeTab("/chat"), "chat");
  assert.equal(activeTab("/profile"), "profile");
  assert.equal(activeTab("/profile/asha"), "profile");
});

test("pages that are not one of the five tabs highlight nothing", () => {
  for (const path of ["/events", "/forum", "/gallery", "/settings", "/admin", "/aboutus"]) assert.equal(activeTab(path), null, path);
});

test("the bar is hidden on sign-in screens and inside an open chat, shown elsewhere", () => {
  for (const path of ["/auth", "/forgot-password", "/reset-password/tok", "/chat/64b7f0f5", "/chat/with/asha"]) {
    assert.equal(showBottomNav(path), false, path);
  }
  for (const path of ["/", "/home", "/chat", "/profile", "/events", "/safargram", "/settings"]) {
    assert.equal(showBottomNav(path), true, path);
  }
});
