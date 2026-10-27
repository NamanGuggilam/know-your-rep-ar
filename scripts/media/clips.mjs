// Records the demo-video clips for the right half of a 1920x1080 split screen.
//   node scripts/media/clips.mjs [baseUrl] [clip ids...]   e.g.  node scripts/media/clips.mjs https://know-your-rep-ar.vercel.app 05
// Output: video/clips/clip-NN-name.mp4  (960x1080, 30 fps, no audio)
//
// Sharpness: Playwright's built-in recorder encodes a low-bitrate VP8 video that looks soft.
// Instead we take Chrome's own screencast frames at 1.5x pixel density (1920x2160), then
// scale them down to 960x1080 and encode with x264, which keeps text crisp.
// Every clip = 3 s hold on its first frame + the scripted action (exact length) + 3 s hold on its last frame.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2]?.startsWith("http") ? process.argv[2] : "https://know-your-rep-ar.vercel.app";
const ONLY = process.argv.slice(2).filter((a) => /^\d\d$/.test(a));
const OUT = path.join(process.cwd(), "video", "clips");
const WORK = path.join(process.cwd(), "video", ".frames");
mkdirSync(OUT, { recursive: true });

const BUFFER = 3; // seconds held before and after each clip
// Desktop layout (the script refers to the top navigation), captured at 1280x1440 CSS pixels:
// the same 8:9 shape as 960x1080, so it scales down cleanly with the top nav visible.
const VIEWPORT = { width: 1280, height: 1440 };
const DPR = 1.5;
const ADDRESS = "1001 SE Walton Blvd, Bentonville 72712";
const BENTONVILLE = { latitude: 36.3729, longitude: -94.2088 };

// Visible cursor + click ripple; hide scrollbars and the dev badge.
const PAGE_SETUP = () => {
  const add = () => {
    const css = document.createElement("style");
    css.textContent = `html{scrollbar-width:none} ::-webkit-scrollbar{display:none} nextjs-portal{display:none!important}
      #demo-cursor{position:fixed;z-index:2147483647;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;
        background:rgba(0,94,162,.28);border:3px solid #162e51;pointer-events:none;transition:transform .12s;box-shadow:0 0 0 2px #fff}
      .demo-ripple{position:fixed;z-index:2147483646;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;
        border:4px solid #005ea2;pointer-events:none;animation:demo-r .55s ease-out forwards}
      @keyframes demo-r{from{transform:scale(.3);opacity:1}to{transform:scale(1.5);opacity:0}}`;
    document.head.appendChild(css);
    const c = document.createElement("div");
    c.id = "demo-cursor";
    c.style.left = "-60px";
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", (e) => {
      c.style.transform = "scale(.7)";
      const r = document.createElement("div");
      r.className = "demo-ripple"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
      document.body.appendChild(r); setTimeout(() => r.remove(), 650);
    }, true);
    addEventListener("mouseup", () => { c.style.transform = ""; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", add); else add();
};

// ---------- helpers used by the clips ----------
const wait = (p, ms) => p.waitForTimeout(ms);
const cursor = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 };

async function moveTo(p, x, y, steps = 22) {
  await p.mouse.move(x, y, { steps });
  cursor.x = x; cursor.y = y;
}
async function clickOn(p, target, { hold = 450 } = {}) {
  const el = typeof target === "string" ? p.locator(target).first() : target;
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (!box) throw new Error(`not visible: ${target}`);
  await moveTo(p, box.x + box.width / 2, box.y + box.height / 2);
  await wait(p, 180);
  await p.mouse.down(); await wait(p, 70); await p.mouse.up();
  await wait(p, hold);
}
async function hover(p, target, ms = 800) {
  const el = typeof target === "string" ? p.locator(target).first() : target;
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  await moveTo(p, box.x + box.width / 2, box.y + box.height / 2);
  await wait(p, ms);
}
/** Smooth scroll so `selector` ends up `offset` px from the top, over `ms`. */
async function scrollTo(p, selector, ms = 1500, offset = 110) {
  const to = await p.locator(selector).first().evaluate((el, o) => el.getBoundingClientRect().top + scrollY - o, offset);
  await scrollToY(p, to, ms);
}
async function scrollToY(p, to, ms = 1500) {
  const from = await p.evaluate(() => scrollY);
  const steps = Math.max(1, Math.round(ms / 33));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await p.evaluate((y) => scrollTo(0, y), from + (to - from) * ease);
    await wait(p, 33);
  }
}
async function typeIn(p, selector, text, delay = 55) {
  await clickOn(p, selector, { hold: 150 });
  await p.keyboard.type(text, { delay });
}
async function settle(p) {
  await p.waitForLoadState("networkidle").catch(() => {});
  await wait(p, 300);
}
async function goto(p, url) {
  await p.goto(BASE + url, { waitUntil: "networkidle" });
  await wait(p, 300);
}
async function lookupByAddress(p) {
  await goto(p, "/");
  await p.fill("#address", ADDRESS);
  await p.click("button[type=submit]");
  await p.waitForURL("**/ballot?**", { timeout: 45000 });
  await settle(p);
}

// ---------- the clips (seconds = the script's on-screen time, before buffers) ----------
const CLIPS = [
  {
    id: "01", name: "intro", seconds: 10,
    async setup(p) { await goto(p, "/"); await moveTo(p, 900, 120, 1); },
    async run(p) {
      await wait(p, 1500);
      await hover(p, "header a[href='/'] >> nth=0", 1200); // the "Know Your Rep AR" header
      await hover(p, "#hero-heading", 1500);
      await scrollToY(p, 220, 2500);
      await hover(p, "#address", 1500);
    },
  },
  {
    id: "03", name: "solution", seconds: 10,
    async setup(p) { await goto(p, "/"); },
    async run(p) {
      await wait(p, 600);
      await typeIn(p, "#address", ADDRESS, 50);
      await wait(p, 400);
      await clickOn(p, "button[type=submit]", { hold: 0 });
      await p.waitForURL("**/ballot?**", { timeout: 45000 });
      await settle(p);
      await wait(p, 700);
      await scrollTo(p, "[role=tablist]", 1400, 260);
    },
  },
  {
    id: "04", name: "my-ballot", seconds: 20,
    async setup(p) { await goto(p, "/"); },
    async run(p) {
      await wait(p, 500);
      await clickOn(p, "button:has-text('Use my location')", { hold: 0 });
      await p.waitForURL("**/ballot?**", { timeout: 45000 });
      await settle(p);
      await scrollTo(p, "[role=tablist]", 1200, 90);
      await clickOn(p, "#tab-governor", { hold: 600 });
      await scrollTo(p, "#panel-governor table.compare", 1500, 60);
      await wait(p, 900);
      const words = p.locator("#panel-governor table.compare details summary").nth(1); // Fred Love, jobs
      await clickOn(p, words, { hold: 1300 });
      // Point at the source link under the quote. (Opening a campaign site would put one candidate's page on
      // screen, and that site animates its text in, so a recording catches it blank.)
      await hover(p, p.locator("#panel-governor table.compare details[open] a").first(), 2500);
    },
  },
  {
    id: "05", name: "ask", seconds: 12,
    async setup(p) { await goto(p, "/ballot?cd=3&ss=33&sh=13#race-governor"); await settle(p); await scrollTo(p, "#panel-governor input[id$='-q']", 1, 520); },
    async run(p) {
      await wait(p, 500);
      await typeIn(p, "#panel-governor input[id$='-q']", "What has each candidate said about education?", 40);
      await clickOn(p, "#panel-governor form button[type=submit]", { hold: 0 });
      await p.locator("#panel-governor [role=status]").filter({ hasNotText: "Looking through" }).first().waitFor();
      await p.waitForFunction(() => !document.querySelector("#panel-governor [role=status]")?.textContent?.includes("Looking through"));
      await wait(p, 2200);
      await p.locator("#panel-governor input[id$='-q']").fill("");
      await typeIn(p, "#panel-governor input[id$='-q']", "Who should I vote for?", 45);
      await clickOn(p, "#panel-governor form button[type=submit]", { hold: 0 });
      await p.waitForFunction(() => !document.querySelector("#panel-governor [role=status]")?.textContent?.includes("Looking through"));
      await wait(p, 1500);
    },
  },
  {
    id: "06", name: "learn", seconds: 17,
    async setup(p) { await lookupByAddress(p); await goto(p, "/my-reps"); await settle(p); await scrollTo(p, "h2", 1, 20); },
    async run(p) {
      // (a) current representatives, with contact options
      await hover(p, "article:has-text('Bart Hester') a:has-text('Email')", 1300);
      // (b) Who does what
      await clickOn(p, "header nav a[href='/who-does-what']", { hold: 0 });
      await settle(p);
      await scrollTo(p, "[role=tablist]", 700, 120);
      await clickOn(p, "#tab-governor", { hold: 900 });
      // (c) Search for a lawmaker
      await clickOn(p, "header nav a[href='/search']", { hold: 0 });
      await settle(p);
      await typeIn(p, "#q", "Hester", 70);
      await p.waitForSelector("#g-official", { timeout: 20000 });
      await wait(p, 1100);
      // (d) Tap a term for its meaning (How to vote: "precinct")
      await clickOn(p, "header nav a[href='/vote']", { hold: 0 });
      await settle(p);
      const term = p.locator("main button:has-text('precinct')").first();
      await scrollTo(p, "main h2:has-text('Step 4')", 600, 140);
      await clickOn(p, term, { hold: 1500 });
    },
  },
  {
    id: "07", name: "your-voice-matters", seconds: 17,
    async setup(p) { await goto(p, "/"); },
    async run(p) {
      await clickOn(p, "header nav a[href='/vote']", { hold: 0 });
      await settle(p);
      await wait(p, 500);
      for (const step of ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]) {
        await scrollTo(p, `main h2:has-text('${step}')`, 900, 120);
        await wait(p, 350);
      }
      await scrollTo(p, "main strong:has-text('Know your rights')", 800, 300);
      await wait(p, 1500);
      await scrollTo(p, "#myths", 1300, 100);
      await wait(p, 800);
      await scrollTo(p, "main a[href*='sos.arkansas.gov']:last-of-type", 900, 500);
      await hover(p, "main p:last-of-type a[href*='sos.arkansas.gov']", 1300);
    },
  },
  {
    id: "08", name: "accessibility", seconds: 8, slowMo: 60,
    async setup(p) { await goto(p, "/"); },
    async run(p) {
      await clickOn(p, "header button[aria-controls=a11y-dialog]:visible >> text=Accessibility", { hold: 500 });
      const pick = (label) => p.locator("#a11y-dialog label", { hasText: label }).first();
      await clickOn(p, pick("Largest"), { hold: 900 });
      await clickOn(p, pick("High contrast"), { hold: 900 });
      await clickOn(p, pick("OpenDyslexic"), { hold: 900 });
      await clickOn(p, p.locator("#a11y-dialog fieldset:has(legend:has-text('Simple mode')) label", { hasText: "On" }), { hold: 900 });
    },
  },
  {
    id: "09", name: "nonpartisan", seconds: 18,
    async setup(p) { await goto(p, "/"); },
    async run(p) {
      await scrollTo(p, "footer", 1300, 400);
      await clickOn(p, "footer a[href='/neutral']", { hold: 0 });
      await settle(p);
      await wait(p, 600);
      const bottom = await p.evaluate(() => document.querySelector("main ol")?.getBoundingClientRect().bottom + scrollY - innerHeight + 160);
      await scrollToY(p, bottom, 6000);
      await wait(p, 500);
      await scrollTo(p, "footer", 900, 400);
      await clickOn(p, "footer a[href='/privacy']", { hold: 0 });
      await settle(p);
      await wait(p, 1600);
      await scrollTo(p, "footer", 1100, 250);
      await hover(p, "footer p.font-semibold", 1500);
    },
  },
  {
    id: "11", name: "close", seconds: 6,
    async setup(p) {
      await goto(p, "/");
      // The recording has no browser address bar, so put the web address on screen.
      await p.evaluate(() => {
        const b = document.createElement("div");
        b.textContent = "know-your-rep-ar.vercel.app";
        b.style.cssText = "position:fixed;left:50%;top:790px;transform:translateX(-50%);z-index:2147483640;" +
          "background:#162e51;color:#fff;font:700 44px/1 'Public Sans',system-ui,sans-serif;padding:26px 44px;" +
          "white-space:nowrap;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);letter-spacing:.01em";
        document.body.appendChild(b);
      });
      await moveTo(p, -100, -100, 1);
    },
    async run(p) { await wait(p, 6000); },
  },
];

// ---------- recording with Chrome's screencast ----------
async function recordClip(clip) {
  const browser = await chromium.launch({ slowMo: clip.slowMo ?? 120 });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DPR,
    geolocation: BENTONVILLE,
    permissions: ["geolocation"],
    colorScheme: "light",
  });
  await context.addInitScript(PAGE_SETUP);
  const p = await context.newPage();
  const cdp = await context.newCDPSession(p);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg", quality: 92,
    maxWidth: Math.round(VIEWPORT.width * DPR), maxHeight: Math.round(VIEWPORT.height * DPR), everyNthFrame: 1,
  });

  try {
  await clip.setup(p);
  await wait(p, 400);
  // A tiny repaint guarantees a frame at the start mark even if nothing else changes.
  await p.evaluate(() => { document.body.style.outline = "0 solid transparent"; });
  const start = Date.now() / 1000;
  await clip.run(p);
  const end = Date.now() / 1000;
  await p.evaluate(() => { document.body.style.outline = "0px solid transparent"; });
  await wait(p, 300);
  await cdp.send("Page.stopScreencast");
  return { frames, start, actual: end - start };
  } catch (e) {
    await p.screenshot({ path: path.join(OUT, `failed-${clip.id}.png`) }).catch(() => {});
    throw e;
  } finally {
    await browser.close();
  }
}

function render(clip, { frames, start, actual }) {
  const dir = path.join(WORK, clip.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  // Frames from the start mark on, plus the last frame just before it (what was on screen at the mark).
  const before = frames.filter((f) => f.t <= start).at(-1);
  const kept = [...(before ? [{ ...before, t: start }] : []), ...frames.filter((f) => f.t > start && f.t <= start + actual + 0.05)];
  if (!kept.length) throw new Error(`no frames for clip ${clip.id}`);
  const main = clip.seconds;
  const lines = [];
  kept.forEach((f, i) => {
    const file = path.join(dir, `${String(i).padStart(5, "0")}.jpg`);
    writeFileSync(file, Buffer.from(f.data, "base64"));
    const rel = f.t - start;
    const next = i + 1 < kept.length ? kept[i + 1].t - start : main; // hold the last frame to the target length
    let dur = Math.max(0, Math.min(next, main) - Math.min(rel, main));
    if (i === 0) dur += BUFFER;
    if (i === kept.length - 1) dur += BUFFER;
    lines.push(`file '${file}'`, `duration ${dur.toFixed(4)}`);
  });
  lines.push(`file '${path.join(dir, `${String(kept.length - 1).padStart(5, "0")}.jpg`)}'`);
  writeFileSync(path.join(dir, "list.txt"), lines.join("\n") + "\n");
  const out = path.join(OUT, `clip-${clip.id}-${clip.name}.mp4`);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", "scale=960:1080:flags=lanczos,fps=30,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-tune", "stillimage", "-r", "30", "-an",
    "-t", String(main + 2 * BUFFER), "-movflags", "+faststart", out,
  ]);
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString());
  return { out, dur, target: main + 2 * BUFFER, actual };
}

const report = [];
for (const clip of CLIPS.filter((c) => !ONLY.length || ONLY.includes(c.id))) {
  try {
    const rec = await recordClip(clip);
    const r = render(clip, rec);
    const note = r.actual > clip.seconds + 0.5 ? `  ⚠ actions took ${r.actual.toFixed(1)}s, longer than ${clip.seconds}s: trimmed at the target` : "";
    report.push(`${path.basename(r.out)}  ${r.dur.toFixed(2)}s (target ${r.target}s; actions ${r.actual.toFixed(1)}s of ${clip.seconds}s)${note}`);
    console.log(report.at(-1));
  } catch (e) {
    report.push(`clip-${clip.id}-${clip.name}: FAILED ${e.message.split("\n")[0]}`);
    console.log(report.at(-1));
  }
}
rmSync(WORK, { recursive: true, force: true });
console.log("\n" + report.join("\n"));
