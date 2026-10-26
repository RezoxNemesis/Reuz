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
