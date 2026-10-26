import { test } from "node:test";
import assert from "node:assert/strict";
import { PRIVACY_HTML } from "../src/legal.js";

test("privacy policy covers data, sensors and purchases", () => {
  assert.match(PRIVACY_HTML, /Privacy Policy/);
  assert.match(PRIVACY_HTML, /accelerometer/);
  assert.match(PRIVACY_HTML, /Google Play/);
});
