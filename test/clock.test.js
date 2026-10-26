import { test } from "node:test";
import assert from "node:assert/strict";
import { formatClock, isValidTimezone, normalizeSettings, DEFAULT_SETTINGS } from "../src/clock.js";

const noon = new Date("2026-10-26T06:30:00Z");

test("accepts real IANA timezones and rejects junk", () => {
  assert.equal(isValidTimezone("Asia/Kolkata"), true);
  assert.equal(isValidTimezone("UTC"), true);
  assert.equal(isValidTimezone("Mars/Olympus"), false);
  assert.equal(isValidTimezone(""), false);
  assert.equal(isValidTimezone(42), false);
  assert.equal(isValidTimezone("x".repeat(65)), false);
});

test("falls back to defaults for invalid settings", () => {
  assert.deepEqual(normalizeSettings({ timezone: "Nope/Nope", format: "36h" }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
});

test("formats 24h time in the requested timezone", () => {
  const out = formatClock(noon, { timezone: "Asia/Kolkata", format: "24h" });
  assert.equal(out.time, "12:00:00");
  assert.equal(out.timezone, "Asia/Kolkata");
});

test("formats 12h time with the same instant", () => {
  const out = formatClock(noon, { timezone: "UTC", format: "12h" });
  assert.match(out.time, /^06:30:00\s?(am|pm)?$/i);
  assert.equal(out.format, "12h");
});

test("iso is the exact instant", () => {
  assert.equal(formatClock(noon, DEFAULT_SETTINGS).iso, "2026-10-26T06:30:00.000Z");
});
