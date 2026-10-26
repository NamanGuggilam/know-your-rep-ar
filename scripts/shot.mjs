// Usage: node scripts/shot.mjs <outdir> [baseUrl]
// Screenshots the main flow at phone and desktop widths, and runs axe on each page.
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const out = process.argv[2] ?? "shots";
const base = process.argv[3] ?? "http://localhost:3210";
const browser = await chromium.launch();
for (const [name, viewport] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport }); const page = await ctx.newPage();
  await page.goto(base + "/");
  await page.screenshot({ path: `${out}/${name}-home.png`, fullPage: true });
  await page.fill("#address", "1001 SE Walton Blvd, Bentonville 72712");
  await page.click("text=Find my representatives");
  await page.waitForSelector("#results-heading", { timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${name}-results.png`, fullPage: true });
  const axe = await new AxeBuilder({ page }).analyze();
  console.log(name, "results axe:", axe.violations.map((v) => `${v.impact} ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`));
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(name, "horizontal overflow:", hasOverflow);
  await ctx.close();
}
await browser.close();
