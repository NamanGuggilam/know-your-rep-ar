import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const SOURCE_SVG_PATH = "src/app/icon.svg";
const ICON_TARGETS = [
  { size: 192, outputPath: "public/icon-192.png" },
  { size: 512, outputPath: "public/icon-512.png" },
  { size: 180, outputPath: "src/app/apple-icon.png" },
];

async function main() {
  const svg = readFileSync(SOURCE_SVG_PATH, "utf8");
  const browser = await chromium.launch();
  for (const { size, outputPath } of ICON_TARGETS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
    await page.screenshot({ path: outputPath, omitBackground: true });
    await page.close();
  }
  await browser.close();
}

await main();
