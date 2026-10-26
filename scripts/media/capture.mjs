// Screenshots (PNG) and walkthrough recordings (turned into GIFs) of the app.
//   node scripts/media/capture.mjs [baseUrl]   -> media/png/*.png, media/video/*.webm
// Then: node scripts/media/gifs.mjs            -> media/gif/*.gif
import { chromium } from "@playwright/test";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3210";
const OUT = path.join(process.cwd(), "media");
const PNG = path.join(OUT, "png");
const VID = path.join(OUT, "video");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(PNG, { recursive: true });
mkdirSync(VID, { recursive: true });

const ADDRESS = "1001 SE Walton Blvd, Bentonville 72712";
const BALLOT = "/ballot?cd=3&ss=33&sh=13";
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const KEY = "kyr-a11y-v2";

// A visible cursor and click ripple, so recordings are easy to follow. Also hides the dev-only badge.
const CURSOR = () => {
  const add = () => {
    const css = document.createElement("style");
    css.textContent = `nextjs-portal{display:none!important}
      #demo-cursor{position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
        background:rgba(22,46,81,.35);border:2px solid #162e51;pointer-events:none;transition:transform .12s}
      .demo-ripple{position:fixed;z-index:2147483646;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
        border:3px solid #005ea2;pointer-events:none;animation:demo-r .5s ease-out forwards}
      @keyframes demo-r{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}`;
    document.head.appendChild(css);
    const c = document.createElement("div");
    c.id = "demo-cursor";
    c.style.left = "-50px";
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", (e) => {
      c.style.transform = "scale(.7)";
      const r = document.createElement("div");
      r.className = "demo-ripple"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
      document.body.appendChild(r); setTimeout(() => r.remove(), 600);
    }, true);
    addEventListener("mouseup", () => { c.style.transform = ""; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", add); else add();
};

const browser = await chromium.launch();
const pause = (p, ms) => p.waitForTimeout(ms);

async function context({ viewport = DESKTOP, settings = {}, video = null, scale = 2 } = {}) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: video ? 1 : scale,
    ...(video ? { recordVideo: { dir: VID, size: viewport } } : {}),
  });
  await ctx.addInitScript(({ k, s }) => localStorage.setItem(k, JSON.stringify({ lang: "en", ...s })), { k: KEY, s: settings });
  if (video) await ctx.addInitScript(CURSOR);
  // Hide the dev-only badge in stills too.
  else await ctx.addInitScript(() => addEventListener("DOMContentLoaded", () => {
    const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"; document.head.appendChild(s);
  }));
  return ctx;
}

/** Move the visible cursor to an element, then click it. */
async function clickOn(p, locator) {
  const el = typeof locator === "string" ? p.locator(locator).first() : locator;
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (box) {
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
    await pause(p, 250);
    await p.mouse.down(); await pause(p, 80); await p.mouse.up();
  } else await el.click();
  await pause(p, 500);
}

async function smoothScroll(p, by, steps = 20) {
  for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, by / steps); await pause(p, 40); }
  await pause(p, 400);
}

async function lookup(p, { slow = false } = {}) {
  await p.goto(BASE + "/");
  await pause(p, 800);
  await clickOn(p, "#address");
  if (slow) await p.keyboard.type(ADDRESS, { delay: 45 }); else await p.fill("#address", ADDRESS);
  await pause(p, 300);
  await clickOn(p, "button[type=submit]");
  await p.waitForURL("**/ballot?**", { timeout: 30000 });
  await pause(p, 1500);
}

async function shot(p, name, { full = false } = {}) {
  await pause(p, 400);
  await p.screenshot({ path: path.join(PNG, `${name}.png`), fullPage: full });
  console.log("png ", name);
}

async function scrollTo(p, selector, offset = 90) {
  await p.evaluate(([s, o]) => { const el = document.querySelector(s); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - o); }, [selector, offset]);
  await pause(p, 400);
}

// ---------------- PNG screenshots ----------------
{
  const ctx = await context();
  const p = await ctx.newPage();
  await p.goto(BASE + "/"); await shot(p, "01-home"); await shot(p, "01-home-full", { full: true });
  await lookup(p);
  await shot(p, "02-ballot-top");
  await scrollTo(p, "[role=tablist]"); await shot(p, "03-ballot-race-tiles");
  await p.click("#tab-governor"); await pause(p, 400);
  await p.locator("#panel-governor button[aria-expanded]").nth(1).click(); await pause(p, 400);
  await scrollTo(p, "#panel-governor h3"); await shot(p, "04-candidate-cards-and-profile");
  await p.evaluate(() => scrollBy(0, 650)); await shot(p, "05-candidate-profile-positions");
  await p.locator("#panel-governor button[aria-expanded]").nth(1).click(); await pause(p, 300);
  await scrollTo(p, "#panel-governor table.compare"); await shot(p, "06-side-by-side-comparison");
  await p.locator("#panel-governor details summary").first().click(); await pause(p, 300); await shot(p, "07-their-exact-words");
  await scrollTo(p, "#panel-governor section[aria-labelledby$='-h']:last-of-type", 120); await shot(p, "08-ask-about-candidates");
  await p.click("#tab-unopposed"); await pause(p, 300); await scrollTo(p, "[role=tablist]"); await shot(p, "09-unopposed-races");
  await p.goto(BASE + "/my-reps"); await pause(p, 1200); await shot(p, "10-your-representatives");
  await p.goto(BASE + "/rep/W000809"); await pause(p, 800); await shot(p, "11-rep-page");
  await scrollTo(p, "#stand"); await shot(p, "12-rep-where-they-stand");
  await p.goto(BASE + "/candidates/hallie-shoffner"); await pause(p, 800); await shot(p, "13-candidate-page");
  await p.goto(BASE + "/who-does-what#governor"); await pause(p, 1000); await shot(p, "14-who-does-what");
  await p.goto(BASE + "/elections"); await pause(p, 800); await shot(p, "15-elections-key-dates"); await shot(p, "15-elections-full", { full: true });
  await p.goto(BASE + "/results"); await pause(p, 2500); await shot(p, "16-live-results");
  await p.goto(BASE + "/vote"); await pause(p, 800); await shot(p, "17-how-to-vote");
  await p.goto(BASE + "/search?q=agriculture"); await p.waitForSelector("#g-official", { timeout: 20000 }); await pause(p, 600); await shot(p, "18-search");
  await p.goto(BASE + "/neutral"); await pause(p, 800); await shot(p, "19-how-we-stay-neutral");
  await p.goto(BASE + "/"); await pause(p, 800);
  await p.locator("header button[aria-controls=a11y-dialog]:visible", { hasText: "Accessibility" }).click(); await pause(p, 500); await shot(p, "20-accessibility-and-language-menu");
  await ctx.close();
}
for (const [name, settings] of [
  ["21-dark-mode", { theme: "dark" }],
  ["22-high-contrast-largest-text", { theme: "contrast", text: "4" }],
  ["23-dyslexia-font-extra-spacing", { font: "dyslexic", spacing: "extra" }],
]) {
  const ctx = await context({ settings });
  const p = await ctx.newPage();
  await p.goto(BASE + BALLOT + "#race-us-senate"); await pause(p, 1500);
  await scrollTo(p, "[role=tablist]"); await shot(p, name);
  await ctx.close();
}
for (const lang of ["es", "mh", "vi", "zh"]) {
  const ctx = await context({ settings: { lang } });
  const p = await ctx.newPage();
  await p.goto(BASE + "/"); await pause(p, 1500); await shot(p, `24-language-${lang}-home`);
  await p.goto(BASE + BALLOT + "#race-governor"); await pause(p, 1800);
  await scrollTo(p, "[role=tablist]"); await shot(p, `25-language-${lang}-ballot`);
  await ctx.close();
}
{
  const ctx = await context({ viewport: PHONE, scale: 3 });
  const p = await ctx.newPage();
  await p.goto(BASE + "/"); await shot(p, "30-phone-home");
  await p.click("button[aria-controls=mobile-menu]"); await pause(p, 400); await shot(p, "31-phone-menu");
  await p.click("button[aria-controls=mobile-menu]");
  await lookup(p);
  await scrollTo(p, "[role=tablist]", 20); await shot(p, "32-phone-race-tiles");
  await p.locator("#panel-us-senate button[aria-expanded]").first().click(); await pause(p, 400);
  await scrollTo(p, "#panel-us-senate [hidden=false], #panel-us-senate div.card:not([hidden])", 20); await shot(p, "33-phone-candidate-profile");
  await p.goto(BASE + "/results"); await pause(p, 2500); await shot(p, "34-phone-results");
  await p.goto(BASE + "/elections"); await pause(p, 800); await shot(p, "35-phone-elections");
  await ctx.close();
}

// ---------------- Recorded walkthroughs (for GIFs) ----------------
async function record(name, viewport, fn, settings = {}) {
  const ctx = await context({ viewport, settings, video: true });
  const p = await ctx.newPage();
  await fn(p);
  await pause(p, 800);
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), path.join(VID, `${name}.webm`));
  console.log("video", name);
}

const REC = { width: 1280, height: 800 };

await record("01-find-your-ballot", REC, async (p) => {
  await lookup(p, { slow: true });
  await smoothScroll(p, 700);
  await clickOn(p, "#tab-governor");
  await scrollTo(p, "[role=tablist]");
  await smoothScroll(p, 350);
});

await record("02-candidate-profile", REC, async (p) => {
  await p.goto(BASE + BALLOT + "#race-us-senate"); await pause(p, 1500);
  await scrollTo(p, "#panel-us-senate h3");
  await clickOn(p, p.locator("#panel-us-senate button[aria-expanded]").nth(0));
  await smoothScroll(p, 900, 30);
  await scrollTo(p, "#panel-us-senate h3");
  await clickOn(p, p.locator("#panel-us-senate button[aria-expanded]").nth(2));
  await smoothScroll(p, 900, 30);
});

await record("03-side-by-side", REC, async (p) => {
  await p.goto(BASE + BALLOT + "#race-governor"); await pause(p, 1500);
  await scrollTo(p, "#panel-governor table.compare", 100);
  await smoothScroll(p, 500, 25);
  await clickOn(p, p.locator("#panel-governor details summary").nth(1));
  await pause(p, 900);
  await smoothScroll(p, 700, 30);
});

await record("04-languages", REC, async (p) => {
  await p.goto(BASE + "/"); await pause(p, 1200);
  for (const native of ["Español", "Tiếng Việt", "中文（简体）", "Kajin M̧ajeļ"]) {
    await clickOn(p, "button[aria-controls=a11y-dialog] >> nth=0");
    await clickOn(p, p.locator("#a11y-dialog label", { hasText: native }));
    await clickOn(p, p.locator("#a11y-dialog .sticky button"));
    await pause(p, 1300);
  }
});

await record("05-accessibility", REC, async (p) => {
  await p.goto(BASE + "/elections"); await pause(p, 1200);
  const open = () => clickOn(p, p.locator("header button[aria-controls=a11y-dialog]:visible", { hasText: "Accessibility" }));
  const close = () => clickOn(p, p.locator("#a11y-dialog .sticky button"));
  await open(); await clickOn(p, p.locator("#a11y-dialog label", { hasText: "Largest" })); await close(); await pause(p, 1200);
  await open(); await clickOn(p, p.locator("#a11y-dialog label", { hasText: "High contrast" })); await close(); await pause(p, 1200);
  await open(); await clickOn(p, p.locator("#a11y-dialog label", { hasText: "OpenDyslexic" })); await close(); await pause(p, 1200);
  await open(); await clickOn(p, p.locator("#a11y-dialog button", { hasText: "Reset to default settings" })); await close(); await pause(p, 800);
});

await record("06-who-does-what", REC, async (p) => {
  await p.goto(BASE + "/who-does-what"); await pause(p, 1200);
  await scrollTo(p, "[role=tablist]", 120);
  for (const id of ["state-senate", "governor", "us-house", "us-senate"]) {
    await clickOn(p, `#tab-${id}`);
    await pause(p, 900);
  }
});

await record("07-elections-and-results", REC, async (p) => {
  await p.goto(BASE + "/elections"); await pause(p, 1200);
  await smoothScroll(p, 1400, 50);
  await clickOn(p, "header a[href='/results']");
  await pause(p, 2500);
  await smoothScroll(p, 900, 35);
});

await record("08-phone-walkthrough", PHONE, async (p) => {
  await p.goto(BASE + "/"); await pause(p, 1000);
  await clickOn(p, "button[aria-controls=mobile-menu]"); await pause(p, 800);
  await clickOn(p, "button[aria-controls=mobile-menu]");
  await lookup(p, { slow: true });
  await scrollTo(p, "[role=tablist]", 20);
  await clickOn(p, "#tab-governor");
  await scrollTo(p, "#panel-governor h3", 20);
  await clickOn(p, p.locator("#panel-governor button[aria-expanded]").nth(1));
  await smoothScroll(p, 1400, 45);
});

await browser.close();
for (const f of readdirSync(VID)) if (!f.endsWith(".webm") || /^[0-9a-f]{32}/.test(f)) rmSync(path.join(VID, f));
console.log("done");
