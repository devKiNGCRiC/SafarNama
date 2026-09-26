import { test } from "node:test";
import assert from "node:assert/strict";
import { fullName, hostnameOf, platformLabel, safeHref, sameUsername } from "./profileLinks.js";

test("safeHref accepts real web addresses and turns 'example.com' into a link", () => {
  assert.equal(safeHref("https://example.com/trip?a=1"), "https://example.com/trip?a=1");
  assert.equal(safeHref("example.com"), "https://example.com/");
  assert.equal(safeHref("example.com:8080/x"), "https://example.com:8080/x");
});

test("safeHref refuses scripts, other schemes, credentials and junk", () => {
  for (const bad of ["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,hi", "ftp://x.com", "mailto:a@b.co", "https://u:p@example.com", "localhost", "", "  ", 5, null, undefined, "x".repeat(201)]) {
    assert.equal(safeHref(bad), null, String(bad));
  }
});

test("hostnameOf never throws and drops 'www.'", () => {
  assert.equal(hostnameOf("https://www.example.com/x"), "example.com");
  assert.equal(hostnameOf("example.org"), "example.org");
  assert.equal(hostnameOf("javascript:alert(1)"), "");
  assert.equal(hostnameOf(undefined), "");
});

test("platformLabel, fullName and sameUsername", () => {
  assert.equal(platformLabel("twitter"), "X (Twitter)");
  assert.equal(platformLabel("github"), "github");
  assert.equal(fullName({ firstName: "Asha", lastName: "Rao" }), "Asha Rao");
  assert.equal(fullName({ firstName: "Asha" }), "Asha");
  assert.equal(fullName(null), "");
  assert.equal(sameUsername("Asha", "asha"), true);
  assert.equal(sameUsername("asha", "ben"), false);
  assert.equal(sameUsername(undefined, "asha"), false);
});
