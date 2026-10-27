import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const DEFAULT_BASE_URL = "http://localhost:3210";
const SETTINGS_STORAGE_KEY = "kyr-a11y-v2";
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"];
const OVERFLOW_TOLERANCE_PX = 1;
const MAX_TARGETS_PER_VIOLATION = 3;
const PAGES = ["/", "/ballot?cd=3&ss=33&sh=13", "/ballot?cd=2&ss=14&sh=74", "/who-does-what", "/vote", "/neutral", "/about", "/privacy", "/accessibility", "/offline", "/elections", "/results", "/rep/W000809", "/search?q=agriculture", "/ask", "/candidates/hallie-shoffner", "/my-reps"];
const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1280, height: 900 }];
const MODES = [
  { name: "light", settings: { theme: "light" } },
  { name: "dark", settings: { theme: "dark" } },
  { name: "contrast+largest+dyslexic+simple", settings: { theme: "contrast", text: "4", font: "dyslexic", spacing: "extra", simple: "on" } },
];

const baseUrl = process.argv[2] ?? DEFAULT_BASE_URL;

async function auditPage(page, viewport, mode, pagePath) {
  await page.goto(baseUrl + pagePath, { waitUntil: "networkidle" });
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const hasOverflow = await page.evaluate(
    (tolerance) => document.documentElement.scrollWidth > window.innerWidth + tolerance,
    OVERFLOW_TOLERANCE_PX,
  );
  if (!violations.length && !hasOverflow) return false;
  console.log(`${viewport.width} ${mode.name} ${pagePath}${hasOverflow ? " HORIZONTAL OVERFLOW" : ""}`);
  for (const violation of violations) {
    const targets = violation.nodes.slice(0, MAX_TARGETS_PER_VIOLATION).map((node) => node.target).join(" | ");
    console.log(`   ${violation.impact} ${violation.id}: ${targets}`);
  }
  return true;
}

async function main() {
  const browser = await chromium.launch();
  let problems = 0;
  for (const viewport of VIEWPORTS) {
    for (const mode of MODES) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(
        ([key, settings]) => localStorage.setItem(key, JSON.stringify({ lang: "en", ...settings })),
        [SETTINGS_STORAGE_KEY, mode.settings],
      );
      const page = await context.newPage();
      for (const pagePath of PAGES) {
        if (await auditPage(page, viewport, mode, pagePath)) problems++;
      }
      await context.close();
    }
  }
  await browser.close();
  console.log(problems ? `${problems} page/mode combos with problems` : "All pages clean.");
  process.exit(problems ? 1 : 0);
}

await main();
