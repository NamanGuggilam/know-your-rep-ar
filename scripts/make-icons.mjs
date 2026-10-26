// Renders src/app/icon.svg to the PNG sizes a PWA needs. Run: node scripts/make-icons.mjs
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const svg = readFileSync("src/app/icon.svg", "utf8");
const b = await chromium.launch();
for (const [size, out] of [[192, "public/icon-192.png"], [512, "public/icon-512.png"], [180, "src/app/apple-icon.png"]]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await p.screenshot({ path: out, omitBackground: true });
  await p.close();
}
await b.close();
