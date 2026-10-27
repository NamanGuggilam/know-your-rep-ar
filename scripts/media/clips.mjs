import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.argv[2]?.startsWith("http") ? process.argv[2] : "https://know-your-rep-ar.vercel.app";
const ONLY_CLIP_IDS = process.argv.slice(2).filter((argument) => /^\d\d$/.test(argument));
const CLIPS_DIR = path.join(process.cwd(), "video", "clips");
const FRAMES_DIR = path.join(process.cwd(), "video", ".frames");
const HOLD_SECONDS = 3;
const VIEWPORT = { width: 1280, height: 1440 };
const PIXEL_DENSITY = 1.5;
const ADDRESS = "1001 SE Walton Blvd, Bentonville 72712";
const BENTONVILLE = { latitude: 36.3729, longitude: -94.2088 };
const NAVIGATION_TIMEOUT_MS = 45000;
const SEARCH_TIMEOUT_MS = 20000;
const DEFAULT_SLOW_MO_MS = 120;
const SCROLL_FRAME_MS = 33;
const SCREENCAST_JPEG_QUALITY = 92;
const OUTPUT_SIZE = "960:1080";
const OUTPUT_FPS = "30";
const OUTPUT_CRF = "15";
const SETTLE_AFTER_RUN_MS = 300;
const FRAME_END_TOLERANCE_SECONDS = 0.05;
const LATE_ACTION_TOLERANCE_SECONDS = 0.5;
const CLOSE_BANNER_TEXT = "know-your-rep-ar.vercel.app";

const installDemoOverlay = () => {
  const install = () => {
    const style = document.createElement("style");
    style.textContent = `html{scrollbar-width:none} ::-webkit-scrollbar{display:none} nextjs-portal{display:none!important}
      #demo-cursor{position:fixed;z-index:2147483647;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;
        background:rgba(0,94,162,.28);border:3px solid #162e51;pointer-events:none;transition:transform .12s;box-shadow:0 0 0 2px #fff}
      .demo-ripple{position:fixed;z-index:2147483646;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;
        border:4px solid #005ea2;pointer-events:none;animation:demo-r .55s ease-out forwards}
      @keyframes demo-r{from{transform:scale(.3);opacity:1}to{transform:scale(1.5);opacity:0}}`;
    document.head.appendChild(style);
    const cursorDot = document.createElement("div");
    cursorDot.id = "demo-cursor";
    cursorDot.style.left = "-60px";
    document.body.appendChild(cursorDot);
    addEventListener("mousemove", (event) => {
      cursorDot.style.left = event.clientX + "px";
      cursorDot.style.top = event.clientY + "px";
    }, true);
    addEventListener("mousedown", (event) => {
      cursorDot.style.transform = "scale(.7)";
      const ripple = document.createElement("div");
      ripple.className = "demo-ripple";
      ripple.style.left = event.clientX + "px";
      ripple.style.top = event.clientY + "px";
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    }, true);
    addEventListener("mouseup", () => { cursorDot.style.transform = ""; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", install);
  else install();
};

const wait = (page, milliseconds) => page.waitForTimeout(milliseconds);

const resolveElement = (page, target) => (typeof target === "string" ? page.locator(target).first() : target);

async function moveTo(page, x, y, steps = 22) {
  await page.mouse.move(x, y, { steps });
}

async function moveToCenterOf(page, target) {
  const element = resolveElement(page, target);
  await element.scrollIntoViewIfNeeded();
  const box = await element.boundingBox();
  if (!box) throw new Error(`not visible: ${target}`);
  await moveTo(page, box.x + box.width / 2, box.y + box.height / 2);
}

async function clickOn(page, target, { hold = 450 } = {}) {
  await moveToCenterOf(page, target);
  await wait(page, 180);
  await page.mouse.down();
  await wait(page, 70);
  await page.mouse.up();
  await wait(page, hold);
}

async function hover(page, target, duration = 800) {
  await moveToCenterOf(page, target);
  await wait(page, duration);
}

const easeInOutQuad = (progress) => (progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2);

async function scrollTo(page, selector, duration = 1500, offset = 110) {
  const targetY = await page.locator(selector).first().evaluate(
    (element, topOffset) => element.getBoundingClientRect().top + scrollY - topOffset,
    offset,
  );
  await scrollToY(page, targetY, duration);
}

async function scrollToY(page, targetY, duration = 1500) {
  const startY = await page.evaluate(() => scrollY);
  const steps = Math.max(1, Math.round(duration / SCROLL_FRAME_MS));
  for (let step = 1; step <= steps; step++) {
    const eased = easeInOutQuad(step / steps);
    await page.evaluate((y) => scrollTo(0, y), startY + (targetY - startY) * eased);
    await wait(page, SCROLL_FRAME_MS);
  }
}

async function typeIn(page, selector, text, delay = 55) {
  await clickOn(page, selector, { hold: 150 });
  await page.keyboard.type(text, { delay });
}
async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await wait(page, 300);
}

async function goto(page, url) {
  await page.goto(BASE_URL + url, { waitUntil: "networkidle" });
  await wait(page, 300);
}
async function lookupByAddress(page) {
  await goto(page, "/");
  await page.fill("#address", ADDRESS);
  await page.click("button[type=submit]");
  await page.waitForURL("**/ballot?**", { timeout: NAVIGATION_TIMEOUT_MS });
  await settle(page);
}

const CLIPS = [
  {
    id: "01", name: "intro", seconds: 10,
    async setup(page) { await goto(page, "/"); await moveTo(page, 900, 120, 1); },
    async run(page) {
      await wait(page, 1500);
      await hover(page, "header a[href='/'] >> nth=0", 1200);
      await hover(page, "#hero-heading", 1500);
      await scrollToY(page, 220, 2500);
      await hover(page, "#address", 1500);
    },
  },
  {
    id: "03", name: "solution", seconds: 10,
    async setup(page) { await goto(page, "/"); },
    async run(page) {
      await wait(page, 600);
      await typeIn(page, "#address", ADDRESS, 50);
      await wait(page, 400);
      await clickOn(page, "button[type=submit]", { hold: 0 });
      await page.waitForURL("**/ballot?**", { timeout: NAVIGATION_TIMEOUT_MS });
      await settle(page);
      await wait(page, 700);
      await scrollTo(page, "[role=tablist]", 1400, 260);
    },
  },
  {
    id: "04", name: "my-ballot", seconds: 20,
    async setup(page) { await goto(page, "/"); },
    async run(page) {
      await wait(page, 500);
      await clickOn(page, "button:has-text('Use my location')", { hold: 0 });
      await page.waitForURL("**/ballot?**", { timeout: NAVIGATION_TIMEOUT_MS });
      await settle(page);
      await scrollTo(page, "[role=tablist]", 1200, 90);
      await clickOn(page, "#tab-governor", { hold: 600 });
      await scrollTo(page, "#panel-governor table.compare", 1500, 60);
      await wait(page, 900);
      const quoteSummary = page.locator("#panel-governor table.compare details summary").nth(1);
      await clickOn(page, quoteSummary, { hold: 1300 });

      await hover(page, page.locator("#panel-governor table.compare details[open] a").first(), 2500);
    },
  },
  {
    id: "05", name: "ask", seconds: 12,
    async setup(page) { await goto(page, "/ballot?cd=3&ss=33&sh=13#race-governor"); await settle(page); await scrollTo(page, "#panel-governor input[id$='-q']", 1, 520); },
    async run(page) {
      await wait(page, 500);
      await typeIn(page, "#panel-governor input[id$='-q']", "What has each candidate said about education?", 40);
      await clickOn(page, "#panel-governor form button[type=submit]", { hold: 0 });
      await page.locator("#panel-governor [role=status]").filter({ hasNotText: "Looking through" }).first().waitFor();
      await page.waitForFunction(() => !document.querySelector("#panel-governor [role=status]")?.textContent?.includes("Looking through"));
      await wait(page, 2200);
      await page.locator("#panel-governor input[id$='-q']").fill("");
      await typeIn(page, "#panel-governor input[id$='-q']", "Who should I vote for?", 45);
      await clickOn(page, "#panel-governor form button[type=submit]", { hold: 0 });
      await page.waitForFunction(() => !document.querySelector("#panel-governor [role=status]")?.textContent?.includes("Looking through"));
      await wait(page, 1500);
    },
  },
  {
    id: "06", name: "learn", seconds: 17,
    async setup(page) { await lookupByAddress(page); await goto(page, "/my-reps"); await settle(page); await scrollTo(page, "h2", 1, 20); },
    async run(page) {

      await hover(page, "article:has-text('Bart Hester') a:has-text('Email')", 1300);

      await clickOn(page, "header nav a[href='/who-does-what']", { hold: 0 });
      await settle(page);
      await scrollTo(page, "[role=tablist]", 700, 120);
      await clickOn(page, "#tab-governor", { hold: 900 });

      await clickOn(page, "header nav a[href='/search']", { hold: 0 });
      await settle(page);
      await typeIn(page, "#q", "Hester", 70);
      await page.waitForSelector("#g-official", { timeout: SEARCH_TIMEOUT_MS });
      await wait(page, 1100);

      await clickOn(page, "header nav a[href='/vote']", { hold: 0 });
      await settle(page);
      const term = page.locator("main button:has-text('precinct')").first();
      await scrollTo(page, "main h2:has-text('Step 4')", 600, 140);
      await clickOn(page, term, { hold: 1500 });
    },
  },
  {
    id: "07", name: "your-voice-matters", seconds: 17,
    async setup(page) { await goto(page, "/"); },
    async run(page) {
      await clickOn(page, "header nav a[href='/vote']", { hold: 0 });
      await settle(page);
      await wait(page, 500);
      for (const step of ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]) {
        await scrollTo(page, `main h2:has-text('${step}')`, 900, 120);
        await wait(page, 350);
      }
      await scrollTo(page, "main strong:has-text('Know your rights')", 800, 300);
      await wait(page, 1500);
      await scrollTo(page, "#myths", 1300, 100);
      await wait(page, 800);
      await scrollTo(page, "main a[href*='sos.arkansas.gov']:last-of-type", 900, 500);
      await hover(page, "main p:last-of-type a[href*='sos.arkansas.gov']", 1300);
    },
  },
  {
    id: "08", name: "accessibility", seconds: 8, slowMo: 60,
    async setup(page) { await goto(page, "/"); },
    async run(page) {
      await clickOn(page, "header button[aria-controls=a11y-dialog]:visible >> text=Accessibility", { hold: 500 });
      const pick = (label) => page.locator("#a11y-dialog label", { hasText: label }).first();
      await clickOn(page, pick("Largest"), { hold: 900 });
      await clickOn(page, pick("High contrast"), { hold: 900 });
      await clickOn(page, pick("OpenDyslexic"), { hold: 900 });
      await clickOn(page, page.locator("#a11y-dialog fieldset:has(legend:has-text('Simple mode')) label", { hasText: "On" }), { hold: 900 });
    },
  },
  {
    id: "09", name: "nonpartisan", seconds: 18,
    async setup(page) { await goto(page, "/"); },
    async run(page) {
      await scrollTo(page, "footer", 1300, 400);
      await clickOn(page, "footer a[href='/neutral']", { hold: 0 });
      await settle(page);
      await wait(page, 600);
      const bottom = await page.evaluate(() => document.querySelector("main ol")?.getBoundingClientRect().bottom + scrollY - innerHeight + 160);
      await scrollToY(page, bottom, 6000);
      await wait(page, 500);
      await scrollTo(page, "footer", 900, 400);
      await clickOn(page, "footer a[href='/privacy']", { hold: 0 });
      await settle(page);
      await wait(page, 1600);
      await scrollTo(page, "footer", 1100, 250);
      await hover(page, "footer p.font-semibold", 1500);
    },
  },
  {
    id: "11", name: "close", seconds: 6,
    async setup(page) {
      await goto(page, "/");

      await page.evaluate((text) => {
        const banner = document.createElement("div");
        banner.textContent = text;
        banner.style.cssText = "position:fixed;left:50%;top:790px;transform:translateX(-50%);z-index:2147483640;" +
          "background:#162e51;color:#fff;font:700 44px/1 'Public Sans',system-ui,sans-serif;padding:26px 44px;" +
          "white-space:nowrap;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);letter-spacing:.01em";
        document.body.appendChild(banner);
      }, CLOSE_BANNER_TEXT);
      await moveTo(page, -100, -100, 1);
    },
    async run(page) { await wait(page, 6000); },
  },
];

async function recordClip(clip) {
  const browser = await chromium.launch({ slowMo: clip.slowMo ?? DEFAULT_SLOW_MO_MS });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: PIXEL_DENSITY,
    geolocation: BENTONVILLE,
    permissions: ["geolocation"],
    colorScheme: "light",
  });
  await context.addInitScript(installDemoOverlay);
  const page = await context.newPage();
  const screencastSession = await context.newCDPSession(page);
  const frames = [];
  screencastSession.on("Page.screencastFrame", async (frame) => {
    frames.push({ t: frame.metadata.timestamp, data: frame.data });
    await screencastSession.send("Page.screencastFrameAck", { sessionId: frame.sessionId }).catch(() => {});
  });
  await screencastSession.send("Page.startScreencast", {
    format: "jpeg",
    quality: SCREENCAST_JPEG_QUALITY,
    maxWidth: Math.round(VIEWPORT.width * PIXEL_DENSITY),
    maxHeight: Math.round(VIEWPORT.height * PIXEL_DENSITY),
    everyNthFrame: 1,
  });

  try {
    await clip.setup(page);
    await wait(page, 400);
    await page.evaluate(() => { document.body.style.outline = "0 solid transparent"; });
    const start = Date.now() / 1000;
    await clip.run(page);
    const end = Date.now() / 1000;
    await page.evaluate(() => { document.body.style.outline = "0px solid transparent"; });
    await wait(page, SETTLE_AFTER_RUN_MS);
    await screencastSession.send("Page.stopScreencast");
    return { frames, start, actual: end - start };
  } catch (error) {
    await page.screenshot({ path: path.join(CLIPS_DIR, `failed-${clip.id}.png`) }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

const frameFileName = (index) => `${String(index).padStart(5, "0")}.jpg`;

function selectFramesForClip(frames, start, actual) {
  const frameBeforeStart = frames.filter((frame) => frame.t <= start).at(-1);
  const startFrame = frameBeforeStart ? [{ ...frameBeforeStart, t: start }] : [];
  const duringRun = frames.filter((frame) => frame.t > start && frame.t <= start + actual + FRAME_END_TOLERANCE_SECONDS);
  return [...startFrame, ...duringRun];
}

function buildConcatList(clip, framesToUse, start, directory) {
  const targetSeconds = clip.seconds;
  const lines = [];
  framesToUse.forEach((frame, index) => {
    writeFileSync(path.join(directory, frameFileName(index)), Buffer.from(frame.data, "base64"));
    const relativeStart = frame.t - start;
    const relativeEnd = index + 1 < framesToUse.length ? framesToUse[index + 1].t - start : targetSeconds;
    let duration = Math.max(0, Math.min(relativeEnd, targetSeconds) - Math.min(relativeStart, targetSeconds));
    if (index === 0) duration += HOLD_SECONDS;
    if (index === framesToUse.length - 1) duration += HOLD_SECONDS;
    lines.push(`file '${path.join(directory, frameFileName(index))}'`, `duration ${duration.toFixed(4)}`);
  });
  lines.push(`file '${path.join(directory, frameFileName(framesToUse.length - 1))}'`);
  return lines;
}

function render(clip, { frames, start, actual }) {
  const directory = path.join(FRAMES_DIR, clip.id);
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });

  const framesToUse = selectFramesForClip(frames, start, actual);
  if (!framesToUse.length) throw new Error(`no frames for clip ${clip.id}`);
  const listPath = path.join(directory, "list.txt");
  writeFileSync(listPath, buildConcatList(clip, framesToUse, start, directory).join("\n") + "\n");

  const outputPath = path.join(CLIPS_DIR, `clip-${clip.id}-${clip.name}.mp4`);
  const targetSeconds = clip.seconds + 2 * HOLD_SECONDS;
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listPath,
    "-vf", `scale=${OUTPUT_SIZE}:flags=lanczos,fps=${OUTPUT_FPS},format=yuv420p`,
    "-c:v", "libx264", "-preset", "slow", "-crf", OUTPUT_CRF, "-tune", "stillimage", "-r", OUTPUT_FPS, "-an",
    "-t", String(targetSeconds), "-movflags", "+faststart", outputPath,
  ]);
  const probe = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", outputPath]);
  return { out: outputPath, dur: Number(probe.toString()), target: targetSeconds, actual };
}

async function main() {
  mkdirSync(CLIPS_DIR, { recursive: true });
  const report = [];
  const clipsToRecord = CLIPS.filter((clip) => !ONLY_CLIP_IDS.length || ONLY_CLIP_IDS.includes(clip.id));
  for (const clip of clipsToRecord) {
    try {
      const recording = await recordClip(clip);
      const result = render(clip, recording);
      const lateNote = result.actual > clip.seconds + LATE_ACTION_TOLERANCE_SECONDS
        ? `  ⚠ actions took ${result.actual.toFixed(1)}s, longer than ${clip.seconds}s: trimmed at the target`
        : "";
      report.push(`${path.basename(result.out)}  ${result.dur.toFixed(2)}s (target ${result.target}s; actions ${result.actual.toFixed(1)}s of ${clip.seconds}s)${lateNote}`);
      console.log(report.at(-1));
    } catch (error) {
      report.push(`clip-${clip.id}-${clip.name}: FAILED ${error.message.split("\n")[0]}`);
      console.log(report.at(-1));
    }
  }
  rmSync(FRAMES_DIR, { recursive: true, force: true });
  console.log("\n" + report.join("\n"));
}

await main();
