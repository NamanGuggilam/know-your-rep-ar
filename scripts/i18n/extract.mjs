// Collects every English string the app shows, as dictionary keys for translators.
//   node scripts/i18n/extract.mjs [baseUrl]   -> scripts/i18n/strings.json
// Numbers become {0}, {1}... so one entry covers every district and date.
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3210";
const PAGES = [
  "/", "/ballot?cd=3&ss=33&sh=13", "/ballot?cd=2&ss=14&sh=74", "/who-does-what", "/elections", "/vote", "/results",
  "/neutral", "/about", "/privacy", "/accessibility", "/offline", "/search", "/ask",
  "/rep/W000809", "/rep/0dee8795-58dd-48a8-980e-044d8d2ac646", "/candidates/fred-love", "/candidates/michael-kalagias",
];
// Messages that only appear after an action (errors, loading states).
const DYNAMIC = [
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

// Same rules as the in-page Translator: neighbouring text nodes form one string.
const collect = () => {
  const SKIP = "script, style, noscript, textarea, input, select, code, [translate='no'], [data-no-translate], nextjs-portal";
  const out = [];
  const walk = (el) => {
    if (el.matches(SKIP)) return;
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

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const all = new Map();
const add = (raw, where) => {
  const k = raw.replace(/\s+/g, " ").trim();
  if (!/[A-Za-z]{2}/.test(k) || k.length > 600) return;
  let i = 0;
  const key = k.replace(/\d+/g, () => `{${i++}}`);
  if (!all.has(key)) all.set(key, where);
};
// Results pages need a lookup first (they read this visit's saved lineup).
await p.goto(base + "/"); await p.fill("#address", "1001 SE Walton Blvd, Bentonville 72712"); await p.click("text=Show my ballot");
await p.waitForURL("**/ballot?**", { timeout: 30000 });
for (const path of [...PAGES, "/my-reps"]) {
  await p.goto(base + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  for (const s of await p.evaluate(collect)) add(s, path);
}
for (const s of DYNAMIC) add(s, "dynamic");
await b.close();
const keys = [...all.keys()].sort();
writeFileSync("scripts/i18n/strings.json", JSON.stringify(keys, null, 1) + "\n");
console.log(`${keys.length} strings, ${keys.join(" ").split(/\s+/).length} words`);
