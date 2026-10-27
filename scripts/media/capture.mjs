import { chromium } from "@playwright/test";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";

const DEFAULT_BASE_URL = "http://localhost:3210";
const MEDIA_DIR = path.join(process.cwd(), "media");
const PNG_DIR = path.join(MEDIA_DIR, "png");
const VIDEO_DIR = path.join(MEDIA_DIR, "video");

const ADDRESS = "1001 SE Walton Blvd, Bentonville 72712";
const BALLOT_PATH = "/ballot?cd=3&ss=33&sh=13";
const SETTINGS_STORAGE_KEY = "kyr-a11y-v2";
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const PHONE_VIEWPORT = { width: 390, height: 844 };
const RECORDING_VIEWPORT = { width: 1280, height: 800 };
const STILL_SCALE = 2;
const PHONE_STILL_SCALE = 3;
const LOOKUP_TIMEOUT_MS = 30000;
const SEARCH_TIMEOUT_MS = 20000;
const TYPING_DELAY_MS = 45;
const MOUSE_MOVE_STEPS = 18;
const DEFAULT_SCROLL_STEPS = 20;
const SCROLL_STEP_PAUSE_MS = 40;
const HEX_VIDEO_NAME = /^[0-9a-f]{32}/;
const LANGUAGES = ["es", "mh", "vi", "zh"];
const ACCESSIBILITY_VARIANTS = [
  ["21-dark-mode", { theme: "dark" }],
  ["22-high-contrast-largest-text", { theme: "contrast", text: "4" }],
  ["23-dyslexia-font-extra-spacing", { font: "dyslexic", spacing: "extra" }],
];

const HIDE_DEV_BADGE_CSS = "nextjs-portal{display:none!important}";

function installDemoCursor() {
  const install = () => {
    const style = document.createElement("style");
    style.textContent = `nextjs-portal{display:none!important}
      #demo-cursor{position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
        background:rgba(22,46,81,.35);border:2px solid #162e51;pointer-events:none;transition:transform .12s}
      .demo-ripple{position:fixed;z-index:2147483646;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
        border:3px solid #005ea2;pointer-events:none;animation:demo-r .5s ease-out forwards}
      @keyframes demo-r{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}`;
    document.head.appendChild(style);
    const cursor = document.createElement("div");
    cursor.id = "demo-cursor";
    cursor.style.left = "-50px";
    document.body.appendChild(cursor);
    addEventListener("mousemove", (event) => {
      cursor.style.left = event.clientX + "px";
      cursor.style.top = event.clientY + "px";
    }, true);
    addEventListener("mousedown", (event) => {
      cursor.style.transform = "scale(.7)";
      const ripple = document.createElement("div");
      ripple.className = "demo-ripple";
      ripple.style.left = event.clientX + "px";
      ripple.style.top = event.clientY + "px";
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }, true);
    addEventListener("mouseup", () => { cursor.style.transform = ""; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", install);
  else install();
}

function hideDevBadgeOnLoad(css) {
  addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  });
}

const pause = (page, milliseconds) => page.waitForTimeout(milliseconds);

async function clickOn(page, target) {
  const element = typeof target === "string" ? page.locator(target).first() : target;
  await element.scrollIntoViewIfNeeded();
  const box = await element.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: MOUSE_MOVE_STEPS });
    await pause(page, 250);
    await page.mouse.down();
    await pause(page, 80);
    await page.mouse.up();
  } else {
    await element.click();
  }
  await pause(page, 500);
}

async function smoothScroll(page, distance, steps = DEFAULT_SCROLL_STEPS) {
  for (let step = 0; step < steps; step++) {
    await page.mouse.wheel(0, distance / steps);
    await pause(page, SCROLL_STEP_PAUSE_MS);
  }
  await pause(page, 400);
}

async function scrollTo(page, selector, offset = 90) {
  await page.evaluate(([targetSelector, topOffset]) => {
    const element = document.querySelector(targetSelector);
    if (element) scrollTo(0, element.getBoundingClientRect().top + scrollY - topOffset);
  }, [selector, offset]);
  await pause(page, 400);
}

async function expandCandidate(page, panelId, index) {
  await page.locator(`#panel-${panelId} button[aria-expanded]`).nth(index).click();
}

async function main() {
  const baseUrl = process.argv[2] ?? DEFAULT_BASE_URL;
  rmSync(MEDIA_DIR, { recursive: true, force: true });
  mkdirSync(PNG_DIR, { recursive: true });
  mkdirSync(VIDEO_DIR, { recursive: true });
  const browser = await chromium.launch();

  async function createContext({ viewport = DESKTOP_VIEWPORT, settings = {}, video = false, scale = STILL_SCALE } = {}) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: video ? 1 : scale,
      ...(video ? { recordVideo: { dir: VIDEO_DIR, size: viewport } } : {}),
    });
    await context.addInitScript(
      ({ key, value }) => localStorage.setItem(key, JSON.stringify({ lang: "en", ...value })),
      { key: SETTINGS_STORAGE_KEY, value: settings },
    );
    if (video) await context.addInitScript(installDemoCursor);
    else await context.addInitScript(hideDevBadgeOnLoad, HIDE_DEV_BADGE_CSS);
    return context;
  }

  async function lookup(page, { slow = false } = {}) {
    await page.goto(baseUrl + "/");
    await pause(page, 800);
    await clickOn(page, "#address");
    if (slow) await page.keyboard.type(ADDRESS, { delay: TYPING_DELAY_MS });
    else await page.fill("#address", ADDRESS);
    await pause(page, 300);
    await clickOn(page, "button[type=submit]");
    await page.waitForURL("**/ballot?**", { timeout: LOOKUP_TIMEOUT_MS });
    await pause(page, 1500);
  }

  async function shot(page, name, { full = false } = {}) {
    await pause(page, 400);
    await page.screenshot({ path: path.join(PNG_DIR, `${name}.png`), fullPage: full });
    console.log("png ", name);
  }

  async function visit(page, route, settleMs) {
    await page.goto(baseUrl + route);
    await pause(page, settleMs);
  }

  async function captureDesktopScreenshots() {
    const context = await createContext();
    const page = await context.newPage();
    await page.goto(baseUrl + "/");
    await shot(page, "01-home");
    await shot(page, "01-home-full", { full: true });
    await lookup(page);
    await shot(page, "02-ballot-top");
    await scrollTo(page, "[role=tablist]");
    await shot(page, "03-ballot-race-tiles");
    await page.click("#tab-governor");
    await pause(page, 400);
    await expandCandidate(page, "governor", 1);
    await pause(page, 400);
    await scrollTo(page, "#panel-governor h3");
    await shot(page, "04-candidate-cards-and-profile");
    await page.evaluate(() => scrollBy(0, 650));
    await shot(page, "05-candidate-profile-positions");
    await expandCandidate(page, "governor", 1);
    await pause(page, 300);
    await scrollTo(page, "#panel-governor table.compare");
    await shot(page, "06-side-by-side-comparison");
    await page.locator("#panel-governor details summary").first().click();
    await pause(page, 300);
    await shot(page, "07-their-exact-words");
    await scrollTo(page, "#panel-governor section[aria-labelledby$='-h']:last-of-type", 120);
    await shot(page, "08-ask-about-candidates");
    await page.click("#tab-unopposed");
    await pause(page, 300);
    await scrollTo(page, "[role=tablist]");
    await shot(page, "09-unopposed-races");
    await visit(page, "/my-reps", 1200);
    await shot(page, "10-your-representatives");
    await visit(page, "/rep/W000809", 800);
    await shot(page, "11-rep-page");
    await scrollTo(page, "#stand");
    await shot(page, "12-rep-where-they-stand");
    await visit(page, "/candidates/hallie-shoffner", 800);
    await shot(page, "13-candidate-page");
    await visit(page, "/who-does-what#governor", 1000);
    await shot(page, "14-who-does-what");
    await visit(page, "/elections", 800);
    await shot(page, "15-elections-key-dates");
    await shot(page, "15-elections-full", { full: true });
    await visit(page, "/results", 2500);
    await shot(page, "16-live-results");
    await visit(page, "/vote", 800);
    await shot(page, "17-how-to-vote");
    await page.goto(baseUrl + "/search?q=agriculture");
    await page.waitForSelector("#g-official", { timeout: SEARCH_TIMEOUT_MS });
    await pause(page, 600);
    await shot(page, "18-search");
    await visit(page, "/neutral", 800);
    await shot(page, "19-how-we-stay-neutral");
    await visit(page, "/", 800);
    await page.locator("header button[aria-controls=a11y-dialog]:visible", { hasText: "Accessibility" }).click();
    await pause(page, 500);
    await shot(page, "20-accessibility-and-language-menu");
    await context.close();
  }

  async function captureAccessibilityVariants() {
    for (const [name, settings] of ACCESSIBILITY_VARIANTS) {
      const context = await createContext({ settings });
      const page = await context.newPage();
      await visit(page, BALLOT_PATH + "#race-us-senate", 1500);
      await scrollTo(page, "[role=tablist]");
      await shot(page, name);
      await context.close();
    }
  }

  async function captureLanguages() {
    for (const lang of LANGUAGES) {
      const context = await createContext({ settings: { lang } });
      const page = await context.newPage();
      await visit(page, "/", 1500);
      await shot(page, `24-language-${lang}-home`);
      await visit(page, BALLOT_PATH + "#race-governor", 1800);
      await scrollTo(page, "[role=tablist]");
      await shot(page, `25-language-${lang}-ballot`);
      await context.close();
    }
  }

  async function capturePhoneScreenshots() {
    const context = await createContext({ viewport: PHONE_VIEWPORT, scale: PHONE_STILL_SCALE });
    const page = await context.newPage();
    await page.goto(baseUrl + "/");
    await shot(page, "30-phone-home");
    await page.click("button[aria-controls=mobile-menu]");
    await pause(page, 400);
    await shot(page, "31-phone-menu");
    await page.click("button[aria-controls=mobile-menu]");
    await lookup(page);
    await scrollTo(page, "[role=tablist]", 20);
    await shot(page, "32-phone-race-tiles");
    await expandCandidate(page, "us-senate", 0);
    await pause(page, 400);
    await scrollTo(page, "#panel-us-senate [hidden=false], #panel-us-senate div.card:not([hidden])", 20);
    await shot(page, "33-phone-candidate-profile");
    await visit(page, "/results", 2500);
    await shot(page, "34-phone-results");
    await visit(page, "/elections", 800);
    await shot(page, "35-phone-elections");
    await context.close();
  }

  async function record(name, viewport, script, settings = {}) {
    const context = await createContext({ viewport, settings, video: true });
    const page = await context.newPage();
    await script(page);
    await pause(page, 800);
    const video = page.video();
    await context.close();
    renameSync(await video.path(), path.join(VIDEO_DIR, `${name}.webm`));
    console.log("video", name);
  }

  const expandButton = (page, panelId, index) => page.locator(`#panel-${panelId} button[aria-expanded]`).nth(index);

  async function recordWalkthroughs() {
    await record("01-find-your-ballot", RECORDING_VIEWPORT, async (page) => {
      await lookup(page, { slow: true });
      await smoothScroll(page, 700);
      await clickOn(page, "#tab-governor");
      await scrollTo(page, "[role=tablist]");
      await smoothScroll(page, 350);
    });

    await record("02-candidate-profile", RECORDING_VIEWPORT, async (page) => {
      await visit(page, BALLOT_PATH + "#race-us-senate", 1500);
      await scrollTo(page, "#panel-us-senate h3");
      await clickOn(page, expandButton(page, "us-senate", 0));
      await smoothScroll(page, 900, 30);
      await scrollTo(page, "#panel-us-senate h3");
      await clickOn(page, expandButton(page, "us-senate", 2));
      await smoothScroll(page, 900, 30);
    });

    await record("03-side-by-side", RECORDING_VIEWPORT, async (page) => {
      await visit(page, BALLOT_PATH + "#race-governor", 1500);
      await scrollTo(page, "#panel-governor table.compare", 100);
      await smoothScroll(page, 500, 25);
      await clickOn(page, page.locator("#panel-governor details summary").nth(1));
      await pause(page, 900);
      await smoothScroll(page, 700, 30);
    });

    await record("04-languages", RECORDING_VIEWPORT, async (page) => {
      await visit(page, "/", 1200);
      for (const nativeName of ["Español", "Tiếng Việt", "中文（简体）", "Kajin M̧ajeļ"]) {
        await clickOn(page, "button[aria-controls=a11y-dialog] >> nth=0");
        await clickOn(page, page.locator("#a11y-dialog label", { hasText: nativeName }));
        await clickOn(page, page.locator("#a11y-dialog .sticky button"));
        await pause(page, 1300);
      }
    });

    await record("05-accessibility", RECORDING_VIEWPORT, async (page) => {
      await visit(page, "/elections", 1200);
      const openMenu = () => clickOn(page, page.locator("header button[aria-controls=a11y-dialog]:visible", { hasText: "Accessibility" }));
      const closeMenu = () => clickOn(page, page.locator("#a11y-dialog .sticky button"));
      const applyOption = async (locator, settleMs) => {
        await openMenu();
        await clickOn(page, locator);
        await closeMenu();
        await pause(page, settleMs);
      };
      const label = (text) => page.locator("#a11y-dialog label", { hasText: text });
      await applyOption(label("Largest"), 1200);
      await applyOption(label("High contrast"), 1200);
      await applyOption(label("OpenDyslexic"), 1200);
      await applyOption(page.locator("#a11y-dialog button", { hasText: "Reset to default settings" }), 800);
    });

    await record("06-who-does-what", RECORDING_VIEWPORT, async (page) => {
      await visit(page, "/who-does-what", 1200);
      await scrollTo(page, "[role=tablist]", 120);
      for (const raceId of ["state-senate", "governor", "us-house", "us-senate"]) {
        await clickOn(page, `#tab-${raceId}`);
        await pause(page, 900);
      }
    });

    await record("07-elections-and-results", RECORDING_VIEWPORT, async (page) => {
      await visit(page, "/elections", 1200);
      await smoothScroll(page, 1400, 50);
      await clickOn(page, "header a[href='/results']");
      await pause(page, 2500);
      await smoothScroll(page, 900, 35);
    });

    await record("08-phone-walkthrough", PHONE_VIEWPORT, async (page) => {
      await visit(page, "/", 1000);
      await clickOn(page, "button[aria-controls=mobile-menu]");
      await pause(page, 800);
      await clickOn(page, "button[aria-controls=mobile-menu]");
      await lookup(page, { slow: true });
      await scrollTo(page, "[role=tablist]", 20);
      await clickOn(page, "#tab-governor");
      await scrollTo(page, "#panel-governor h3", 20);
      await clickOn(page, expandButton(page, "governor", 1));
      await smoothScroll(page, 1400, 45);
    });
  }

  await captureDesktopScreenshots();
  await captureAccessibilityVariants();
  await captureLanguages();
  await capturePhoneScreenshots();
  await recordWalkthroughs();

  await browser.close();
  for (const file of readdirSync(VIDEO_DIR)) {
    if (!file.endsWith(".webm") || HEX_VIDEO_NAME.test(file)) rmSync(path.join(VIDEO_DIR, file));
  }
  console.log("done");
}

await main();
