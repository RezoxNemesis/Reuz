import { test } from "node:test";
import assert from "node:assert/strict";
import { PAGE_HTML } from "../src/page.js";

test("page uses the glass style, transitions and reduced-motion fallback", () => {
  assert.match(PAGE_HTML, /backdrop-filter/);
  assert.match(PAGE_HTML, /prefers-reduced-motion/);
  assert.match(PAGE_HTML, /@keyframes flip/);
});

test("page saves settings through the settings API", () => {
  assert.match(PAGE_HTML, /"\/api\/settings"/);
  assert.match(PAGE_HTML, /method: "POST"/);
  assert.match(PAGE_HTML, /id="sheet"/);
});

test("page has the glass capsule tab bar and the dial sheet", () => {
  assert.match(PAGE_HTML, /id="capsule"/);
  assert.match(PAGE_HTML, /id="dialSheet"/);
  assert.match(PAGE_HTML, /id="rotary"/);
});

test("page template has nothing a JS template literal would mangle", () => {
  assert.ok(!PAGE_HTML.includes("`"));
  assert.ok(!PAGE_HTML.includes("${"));
  assert.ok(!PAGE_HTML.includes("\\"));
});

test("page talks to the native haptic bridge when present", () => {
  assert.match(PAGE_HTML, /native\.haptic/);
});
