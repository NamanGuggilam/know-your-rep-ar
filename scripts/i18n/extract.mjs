import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const DEFAULT_BASE_URL = "http://localhost:3210";
const OUTPUT_PATH = "scripts/i18n/strings.json";
const VIEWPORT = { width: 1280, height: 900 };
const TEST_ADDRESS = "1001 SE Walton Blvd, Bentonville 72712";
const BALLOT_LOOKUP_TIMEOUT_MS = 30000;
const PAGE_SETTLE_MS = 600;
const MAX_STRING_LENGTH = 600;
const baseUrl = process.argv[2] ?? DEFAULT_BASE_URL;
const PAGES = [
  "/", "/ballot?cd=3&ss=33&sh=13", "/ballot?cd=2&ss=14&sh=74", "/who-does-what", "/elections", "/vote", "/results",
  "/neutral", "/about", "/privacy", "/accessibility", "/offline", "/search", "/ask",
  "/rep/W000809", "/rep/0dee8795-58dd-48a8-980e-044d8d2ac646", "/candidates/fred-love", "/candidates/michael-kalagias",
];
const MESSAGES_SHOWN_AFTER_ACTIONS = [
  "Please type your street address, city, and ZIP code. For example: 123 Main St, Bentonville 72712",
  "Looking up your representatives. This can take a few seconds.",
  "Asking your device for your location…",
  "We could not get your location. That's OK. Please type your address instead.",
  "Your browser cannot share your location. Please type your address instead.",
  "We could not reach the internet. Check your connection and try again.",
  "Something went wrong. Please try again.",
  "We could not find that address. Check the spelling, or add your city and ZIP code.",
  "That address is not in Arkansas. This app only covers Arkansas.",
  "One of our data sources is not answering right now. Please try again in a minute.",
  "The U.S. Census address service did not respond.",
  "Please type a question.",
  "Looking through our sources…",
  "Searching…",
  "No matches. Try fewer words, or a different word for the same thing.",
  "Candidates on the 2026 ballot", "Offices and their powers", "People in office now",
  "AI answers aren't switched on yet. The table above shows what each candidate says. You can also",
  "AI answers are turned off right now. These pages from our search match your question.",
  "Pages that may help", "Matching pages", "Sources used", "Answer", "You asked",
  "Refreshing…", "Your message is ready", "Copied!", "Copy message", "Send by email",
  "Your message was copied. You can paste it into an email or contact form.",
  "Please tell us the issue first. Even one word is enough.", "Update my message",
  "Loading your representatives…", "Loading your ballot…", "Loading results…",
  "This page was translated by computer and may have mistakes. Native speakers: help us fix them.",
];

const collectPageStrings = () => {
  const SKIPPED_ELEMENTS = "script, style, noscript, textarea, input, select, code, [translate='no'], [data-no-translate], nextjs-portal";
  const out = [];
  const walk = (el) => {
    if (el.matches(SKIPPED_ELEMENTS)) return;
    for (const a of ["placeholder", "aria-label", "alt", "title"]) {
      const v = el.getAttribute(a);
      if (v) out.push(v);
    }
    let run = "";
    for (const c of el.childNodes) {
      if (c.nodeType === 3) run += c.nodeValue;
      else {
        if (run.trim()) out.push(run);
        run = "";
        if (c.nodeType === 1) walk(c);
      }
    }
    if (run.trim()) out.push(run);
  };
  walk(document.body);
  return out;
};

const numberedKey = (rawText) => {
  let index = 0;
  return rawText.replace(/\d+/g, () => `{${index++}}`);
};

function addString(strings, rawText, source) {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (!/[A-Za-z]{2}/.test(text) || text.length > MAX_STRING_LENGTH) return;
  const key = numberedKey(text);
  if (!strings.has(key)) strings.set(key, source);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  const strings = new Map();
  await page.goto(baseUrl + "/");
  await page.fill("#address", TEST_ADDRESS);
  await page.click("text=Show my ballot");
  await page.waitForURL("**/ballot?**", { timeout: BALLOT_LOOKUP_TIMEOUT_MS });
  for (const pagePath of [...PAGES, "/my-reps"]) {
    await page.goto(baseUrl + pagePath, { waitUntil: "networkidle" });
    await page.waitForTimeout(PAGE_SETTLE_MS);
    for (const text of await page.evaluate(collectPageStrings)) addString(strings, text, pagePath);
  }
  for (const text of MESSAGES_SHOWN_AFTER_ACTIONS) addString(strings, text, "dynamic");
  await browser.close();
  const keys = [...strings.keys()].sort();
  writeFileSync(OUTPUT_PATH, JSON.stringify(keys, null, 1) + "\n");
  console.log(`${keys.length} strings, ${keys.join(" ").split(/\s+/).length} words`);
}

await main();
