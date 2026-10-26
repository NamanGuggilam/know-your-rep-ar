// In a real browser, counts English strings still showing on key pages after switching language.
//   node scripts/i18n/coverage.mjs [baseUrl]
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const base = process.argv[2] ?? "http://localhost:3210";
const PAGES = ["/", "/ballot?cd=3&ss=33&sh=13", "/who-does-what", "/elections", "/vote", "/results", "/rep/W000809"];
const b = await chromium.launch();
for (const lang of ["es", "mh", "vi", "zh"]) {
  const dict = JSON.parse(readFileSync(`public/i18n/${lang}.json`, "utf8"));
  // Entries whose translation differs from the English: those must not appear in English on the page.
  const mustChange = new Set(Object.entries(dict).filter(([k, v]) => k !== v && !/\{\d+\}/.test(k)).map(([k]) => k));
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((l) => localStorage.setItem("kyr-a11y-v2", JSON.stringify({ lang: l })), lang);
  const p = await ctx.newPage();
  const left = new Set();
  for (const path of PAGES) {
    await p.goto(base + path, { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    const runs = await p.evaluate(() => {
      const out = [];
      const walk = (el) => {
        if (el.matches("script,style,noscript,[translate='no'],nextjs-portal")) return;
        let run = "";
        for (const c of el.childNodes) {
          if (c.nodeType === 3) run += c.nodeValue;
          else { if (run.trim()) out.push(run); run = ""; if (c.nodeType === 1) walk(c); }
        }
        if (run.trim()) out.push(run);
      };
      walk(document.body);
      return out.map((s) => s.replace(/\s+/g, " ").trim());
    });
    for (const r of runs) if (mustChange.has(r)) left.add(`${path}: ${r.slice(0, 60)}`);
  }
  console.log(`${lang}: html lang=${await p.evaluate(() => document.documentElement.lang)}, untranslated: ${left.size}`);
  [...left].slice(0, 5).forEach((x) => console.log("   ", x));
  await ctx.close();
}
await b.close();
