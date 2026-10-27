import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const DEFAULT_BASE_URL = "http://localhost:3210";
const SETTINGS_STORAGE_KEY = "kyr-a11y-v2";
const LANGUAGES = ["es", "mh", "vi", "zh"];
const PAGES = ["/", "/ballot?cd=3&ss=33&sh=13", "/who-does-what", "/elections", "/vote", "/results", "/rep/W000809"];
const VIEWPORT = { width: 1280, height: 900 };
const SETTLE_MS = 1200;
const SNIPPET_LENGTH = 60;
const SAMPLE_COUNT = 5;

const baseUrl = process.argv[2] ?? DEFAULT_BASE_URL;

function collectTextRuns() {
  const SKIPPED = "script,style,noscript,[translate='no'],nextjs-portal";
  const runs = [];
  const walk = (element) => {
    if (element.matches(SKIPPED)) return;
    let run = "";
    for (const child of element.childNodes) {
      if (child.nodeType === 3) {
        run += child.nodeValue;
        continue;
      }
      if (run.trim()) runs.push(run);
      run = "";
      if (child.nodeType === 1) walk(child);
    }
    if (run.trim()) runs.push(run);
  };
  walk(document.body);
  return runs.map((text) => text.replace(/\s+/g, " ").trim());
}

function keysThatMustChange(dictionary) {
  const hasSlot = (text) => /\{\d+\}/.test(text);
  return new Set(
    Object.entries(dictionary)
      .filter(([english, translated]) => english !== translated && !hasSlot(english))
      .map(([english]) => english),
  );
}

async function findUntranslated(browser, language) {
  const dictionary = JSON.parse(readFileSync(`public/i18n/${language}.json`, "utf8"));
  const mustChange = keysThatMustChange(dictionary);
  const context = await browser.newContext({ viewport: VIEWPORT });
  await context.addInitScript(
    ([key, lang]) => localStorage.setItem(key, JSON.stringify({ lang })),
    [SETTINGS_STORAGE_KEY, language],
  );
  const page = await context.newPage();
  const untranslated = new Set();
  for (const pagePath of PAGES) {
    await page.goto(baseUrl + pagePath, { waitUntil: "networkidle" });
    await page.waitForTimeout(SETTLE_MS);
    for (const run of await page.evaluate(collectTextRuns)) {
      if (mustChange.has(run)) untranslated.add(`${pagePath}: ${run.slice(0, SNIPPET_LENGTH)}`);
    }
  }
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  await context.close();
  return { untranslated, htmlLang };
}

async function main() {
  const browser = await chromium.launch();
  for (const language of LANGUAGES) {
    const { untranslated, htmlLang } = await findUntranslated(browser, language);
    console.log(`${language}: html lang=${htmlLang}, untranslated: ${untranslated.size}`);
    [...untranslated].slice(0, SAMPLE_COUNT).forEach((entry) => console.log("   ", entry));
  }
  await browser.close();
}

await main();
