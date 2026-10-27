import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const USAGE = "Usage: node scripts/shot.mjs <outdir> [baseUrl]";
const DEFAULT_OUTPUT_DIR = "shots";
const DEFAULT_BASE_URL = "http://localhost:3210";
const TEST_ADDRESS = "1001 SE Walton Blvd, Bentonville 72712";
const RESULTS_TIMEOUT_MS = 30000;
const RESULTS_SETTLE_MS = 2500;
const VIEWPORTS = [
  { name: "phone", viewport: { width: 390, height: 844 } },
  { name: "desktop", viewport: { width: 1280, height: 900 } },
];

const outputDir = process.argv[2] ?? DEFAULT_OUTPUT_DIR;
const baseUrl = process.argv[3] ?? DEFAULT_BASE_URL;

function describeViolation(violation) {
  return `${violation.impact} ${violation.id} (${violation.nodes.length}) ${violation.nodes[0]?.target}`;
}

async function captureViewport(browser, { name, viewport }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(baseUrl + "/");
  await page.screenshot({ path: `${outputDir}/${name}-home.png`, fullPage: true });
  await page.fill("#address", TEST_ADDRESS);
  await page.click("text=Find my representatives");
  await page.waitForSelector("#results-heading", { timeout: RESULTS_TIMEOUT_MS });
  await page.waitForTimeout(RESULTS_SETTLE_MS);
  await page.screenshot({ path: `${outputDir}/${name}-results.png`, fullPage: true });
  const axeResults = await new AxeBuilder({ page }).analyze();
  console.log(name, "results axe:", axeResults.violations.map(describeViolation));
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(name, "horizontal overflow:", hasOverflow);
  await context.close();
}

async function main() {
  if (!process.argv[2]) console.log(USAGE);
  const browser = await chromium.launch();
  for (const target of VIEWPORTS) await captureViewport(browser, target);
  await browser.close();
}

await main();
