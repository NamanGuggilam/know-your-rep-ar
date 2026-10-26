// Runs axe-core on every page, in each theme and at the largest text size, at phone and desktop widths.
// Usage: node scripts/audit.mjs [baseUrl]
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const base = process.argv[2] ?? "http://localhost:3210";
const PAGES = ["/", "/ballot?cd=3&ss=33&sh=13", "/ballot?cd=2&ss=14&sh=74", "/who-does-what", "/vote", "/neutral", "/about", "/privacy", "/accessibility", "/offline", "/rep/W000809", "/search?q=agriculture", "/ask", "/candidates/hallie-shoffner"];
const MODES = [
  { name: "light", settings: { theme: "light" } },
  { name: "dark", settings: { theme: "dark" } },
  { name: "contrast+largest+dyslexic+simple", settings: { theme: "contrast", text: "4", font: "dyslexic", spacing: "extra", simple: "on" } },
];
const browser = await chromium.launch();
let problems = 0;
for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  for (const mode of MODES) {
    const ctx = await browser.newContext({ viewport: vp });
    await ctx.addInitScript((s) => localStorage.setItem("kyr-a11y", JSON.stringify(s)), mode.settings);
    const page = await ctx.newPage();
    for (const path of PAGES) {
      await page.goto(base + path, { waitUntil: "networkidle" });
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (violations.length || overflow) {
        problems++;
        console.log(`${vp.width} ${mode.name} ${path}${overflow ? " HORIZONTAL OVERFLOW" : ""}`);
        for (const v of violations) console.log(`   ${v.impact} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target).join(" | ")}`);
      }
    }
    await ctx.close();
  }
}
await browser.close();
console.log(problems ? `${problems} page/mode combos with problems` : "All pages clean.");
process.exit(problems ? 1 : 0);
