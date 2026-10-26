// Writes the Reuz page to the Android assets folder, so the app ships its interface inside the APK.
import { mkdirSync, writeFileSync } from "node:fs";
import { PAGE_HTML } from "../src/page.js";

const dir = new URL("../android/app/src/main/assets/", import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL("index.html", dir), PAGE_HTML);
console.log("Wrote index.html (" + PAGE_HTML.length + " characters)");
