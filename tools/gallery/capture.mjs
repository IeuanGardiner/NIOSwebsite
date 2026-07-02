/* Regenerates images/gallery/*.webp from boards.html.
   The boards are 640x400 panels composed in the Vesta app's visual
   language; each is captured at 2.25x as a 1440x900 WebP.

   Usage (from the repo root):
     npm install --no-save puppeteer-core
     node tools/gallery/capture.mjs
*/
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const OUT = path.join(ROOT, "images", "gallery");
const BOARDS = path.join(import.meta.dirname, "boards.html");
const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 900, deviceScaleFactor: 2.25 });
  await page.goto(pathToFileURL(BOARDS).href, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);

  for (const board of await page.$$(".board")) {
    const name = await board.evaluate((el) => el.dataset.name);
    await board.scrollIntoView();
    await board.screenshot({ path: path.join(OUT, `${name}.webp`), type: "webp", quality: 92 });
    console.log(`captured ${name}.webp`);
  }
} finally {
  await browser.close();
}
