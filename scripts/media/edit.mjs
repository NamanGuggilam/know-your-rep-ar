import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

// Assembles the demo video from the speaker takes (video/sdr, converted from vids/ with
// `avconvert -p Preset1920x1080`), the website clips (video/clips) and rendered PNG overlays.
// Split-screen speakers are cropped to follow their face (video/faces, from faces.swift); `cx` is the fallback center.
// Captions come from each segment's `caption` text, timed against whisper word timestamps in video/words.json.

const ROOT = process.cwd();
const TAKES_DIR = path.join(ROOT, "video", "sdr");
const CLIPS_DIR = path.join(ROOT, "video", "clips");
const WORK_DIR = path.join(ROOT, "video", ".edit");
const WORDS_FILE = path.join(ROOT, "video", "words.json");
const FACES_DIR = path.join(ROOT, "video", "faces");
const OUTPUT_FILE = path.join(ROOT, "video", "know-your-rep-ar-demo-v2.mp4");
const EMBLEM_SVG = readFileSync(path.join(ROOT, "src", "app", "icon.svg"), "utf8");

const WIDTH = 1920;
const HEIGHT = 1080;
const PANEL_WIDTH = 960;
const FPS = 30;
const CLIP_HOLD_SECONDS = 3;
const CAPTION_MAX_CHARS = 64;
const CAPTION_TAIL_SECONDS = 0.35;
const AUDIO_FADE_IN = 0.04;
const AUDIO_FADE_OUT = 0.1;
const AUDIO_FADE_OUT_BEFORE_TAIL = 0.03;
const OPENING_FADE_SECONDS = 0.4;
const FACE_MEDIAN_SAMPLES = 2;
const FACE_SMOOTHING_SECONDS = 0.6;

const SEGMENTS = [
  {
    id: "01", title: "Intro", layout: "full", take: "IMG_3334", in: 0, out: 7.47, cx: 0.5,
    caption: "My name is Nischal Keshav. I'm Arham Shah. And I'm Naman Guggilam. And we'd like to present Know Your Rep Arkansas!",
  },
  {
    id: "02", title: "The problem", layout: "full", take: "IMG_3303", in: 0.72, out: 24.6, cx: 0.54,
    caption: "I just turned 18 years old, which means I gained an exciting new right: the ability to vote. The issue is most people don't even know who their state representatives are. Candidate information is spread across candidate sites and places that are full of jargon, bias, and difficult to comprehend. This is hardest for first-time voters, people with disabilities, and people who might not be that into politics. If you can't understand your ballot, then you can't use your voice.",
  },
  {
    id: "03", title: "Our solution", layout: "split", take: "IMG_3307", in: 0, out: 7.2, cx: 0.27, site: "clip-03-solution.mp4",
    caption: "So we decided to put everything into one place, in plain English, accessible to anyone and understandable by everyone.",
  },
  {
    id: "04", title: "My ballot", layout: "split", take: "IMG_3311", in: 0.3, out: 15.45, cx: 0.5, site: "clip-04-my-ballot.mp4",
    caption: "Type your address or tap \"Use my location\" to see every race and candidate on your ballot. Compare them side by side on key topics, in their own words, from campaign sites, interviews, or debates. Never attack ads. Every quote is checked word for word and linked to a source, easy for you to check and verify on your ballot.",
  },
  {
    id: "05", title: "Ask", layout: "split", take: "IMG_3314-denoised-good", in: 0.35, out: 12.06, cx: 0.49, site: "clip-05-ask.mp4",
    caption: "Got more questions? All you have to do is ask. Our AI answers only from our verified sources. It shows which ones it used, treats every candidate equally, and never tells who to vote for. That choice stays up to you.",
  },
  {
    id: "06", title: "Learn your government", layout: "split", take: "IMG_3320", in: 0, out: 17.53, cx: 0.5, site: "clip-06-learn.mp4",
    caption: "You can also see and contact each of your current representatives, learn what each office does, and search every lawmaker, their committees, and their bills. Tap any confusing term for a simple definition. AI bill explanations are clearly labeled and linked to the official text. It's civics without the jargon.",
  },
  {
    id: "07", title: "Your voice matters", layout: "split", take: "IMG_3317", in: 0.3, out: 12.95, cx: 0.55, site: "clip-07-your-voice-matters.mp4",
    caption: "Are you a first-time voter? Our guide covers voting in Arkansas in five easy steps, from registering to what to bring, plus your rights at the polls and busting common myths. Every link goes to the Arkansas Secretary of State and takes you from confused to confident.",
  },
  {
    id: "08", title: "Accessibility", layout: "split", take: "IMG_3325", in: 0, out: 8.5, cx: 0.4, site: "clip-08-accessibility.mp4",
    caption: "Every page has an accessibility menu: bigger text, high contrast, dyslexia-friendly font, extra spacing, reduced motion, as well as a simple mode.",
  },
  {
    id: "09", title: "Nonpartisan by design", layout: "split", take: "IMG_3324", in: 0, out: 17.2, cx: 0.52, site: "clip-09-nonpartisan.mp4",
    caption: "Most importantly, we're nonpartisan by design. We publish nine fairness rules. Every official gets the same layout. We never score, rank, or endorse anyone. Simply facts, not opinions. Everything is sourced and date-checked, and we never store any of your personal information. We are an independent student project.",
  },
  {
    id: "10", title: "What's next", layout: "split", take: "IMG_3337", in: 0.4, out: 6.16, tail: 0.5, cx: 0.5, site: "clip-01-intro.mp4",
    caption: "Next, we're adding read-aloud, additional languages, bill alerts, and a classroom mode for students to learn about local politics.",
  },
  {
    id: "11", title: "Close", layout: "split", take: "IMG_3328", in: 0.6, out: 16.5, cx: 0.42, site: "clip-11-close.mp4",
    caption: "Local elections are where your vote has the most sway, with the least media coverage. We urge you to try know-your-rep-ar.vercel.app. Helping others learn about how they can make an impact is the best way to give voices to the unheard. Know Your Rep AR is built for every Arkansan, because your voice matters. The elections are coming up, so go vote.",
  },
  { id: "12", title: "End card", layout: "end", seconds: 3 },
];

const ffmpeg = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
const probeDuration = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
// `tail` holds the last frame in silence, for takes whose last word runs into the end of the recording.
const segmentSeconds = (segment) => (segment.seconds ?? segment.out - segment.in) + (segment.tail ?? 0);

const CAPTION_COMMA_REACH = 14;

// Long sentences split into equal-ish parts, preferring a nearby comma, so no caption is a lone word.
function splitSentence(sentence) {
  const parts = Math.ceil(sentence.length / CAPTION_MAX_CHARS);
  if (parts === 1) return [sentence];
  const target = sentence.length / parts;
  const spaces = [...sentence.matchAll(/ /g)].map((match) => match.index);
  const distance = (index) => Math.abs(index - target) - (sentence[index - 1] === "," ? CAPTION_COMMA_REACH : 0);
  const breakAt = spaces.reduce((best, index) => (distance(index) < distance(best) ? index : best));
  return [sentence.slice(0, breakAt), ...splitSentence(sentence.slice(breakAt + 1))];
}

function splitIntoCaptions(text) {
  const sentences = text.split(/(?<=[.!?]["”]?)\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  return sentences.flatMap(splitSentence);
}

// Each chunk starts at the spoken word sitting at the same fraction of the transcript's characters.
function timeCaptions(segment, words) {
  const spoken = words.filter((word) => word.s >= segment.in - 0.2 && word.e <= segment.out + 0.2);
  const spokenLengths = spoken.map((word) => word.w.trim().length + 1);
  const spokenTotal = spokenLengths.reduce((sum, length) => sum + length, 0);
  const startOfFraction = (fraction) => {
    let consumed = 0;
    for (let index = 0; index < spoken.length; index++) {
      if (consumed / spokenTotal >= fraction - 1e-9) return spoken[index].s;
      consumed += spokenLengths[index];
    }
    return spoken.at(-1).s;
  };
  const chunks = splitIntoCaptions(segment.caption);
  const captionTotal = chunks.reduce((sum, chunk) => sum + chunk.length + 1, 0);
  let consumed = 0;
  const starts = chunks.map((chunk) => {
    const start = startOfFraction(consumed / captionTotal);
    consumed += chunk.length + 1;
    return Math.max(0, start - segment.in);
  });
  const lastEnd = Math.min(segmentSeconds(segment), spoken.at(-1).e - segment.in + CAPTION_TAIL_SECONDS);
  return chunks.map((text, index) => ({ text, start: starts[index], end: index + 1 < chunks.length ? starts[index + 1] : lastEnd }));
}

const OVERLAY_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@500;700&family=Merriweather:wght@900&family=Public+Sans:wght@600;700;800&display=block');
  *{box-sizing:border-box;margin:0}
  html,body{width:${WIDTH}px;height:${HEIGHT}px;background:transparent;overflow:hidden}
  body{position:relative;font-family:'Public Sans',Helvetica,Arial,sans-serif;color:#fff}
  .chip{position:absolute;top:36px;left:36px;display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.96);
    color:#162e51;border-radius:8px;padding:10px 20px 10px 12px;font:700 26px/1 'Public Sans',sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.25)}
  .chip svg{width:40px;height:40px;flex:none}
  .chip b{color:#b50909;font-weight:800}
  .caption{position:absolute;bottom:56px;transform:translateX(-50%);text-align:center;background:rgba(14,26,46,.88);
    border-radius:10px;padding:14px 26px;font:500 40px/1.3 'Atkinson Hyperlegible Next',sans-serif;letter-spacing:.005em}
  .stripes{position:absolute;left:0;right:0;bottom:0;height:28px;background:repeating-linear-gradient(#b50909 0 7px,#fff 7px 14px)}
  .end{position:absolute;inset:0;background:#162e51;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;text-align:center}
  .end svg{width:180px;height:180px}
  .end h1{margin:0;font:900 84px/1.15 'Merriweather',Georgia,serif}
  .end .url{font:700 46px/1 'Public Sans',sans-serif;background:#fff;color:#162e51;border-radius:10px;padding:20px 40px}
  .end p{font:500 28px/1.4 'Atkinson Hyperlegible Next',sans-serif;color:#d6e2f0;max-width:1300px}
`;

const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function chipHtml(segment) {
  return `<div class="chip">${EMBLEM_SVG}<span><b>${Number(segment.id)}</b>&nbsp; ${escapeHtml(segment.title)}</span></div>`;
}

function captionHtml(segment, text) {
  const center = segment.layout === "full" ? WIDTH / 2 : PANEL_WIDTH / 2;
  const maxWidth = segment.layout === "full" ? 1500 : PANEL_WIDTH - 80;
  return `<div class="caption" style="left:${center}px;max-width:${maxWidth}px">${escapeHtml(text)}</div>`;
}

function endHtml() {
  return `<div class="end">${EMBLEM_SVG}<h1>Know Your Rep AR</h1><div class="url">know-your-rep-ar.vercel.app</div>
    <p>Free and nonpartisan. An independent student project for the Congressional App Challenge. Not a government website.</p>
    <div class="stripes"></div></div>`;
}

async function renderOverlays(timeline) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  const shoot = async (html, file) => {
    await page.setContent(`<!doctype html><style>${OVERLAY_CSS}</style>${html}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: file, omitBackground: true });
  };
  try {
    for (const item of timeline) {
      const { segment } = item;
      const directory = path.join(WORK_DIR, segment.id);
      mkdirSync(directory, { recursive: true });
      if (segment.layout === "end") {
        item.overlays = [{ file: path.join(directory, "end.png"), start: 0, end: item.seconds }];
        await shoot(endHtml(), item.overlays[0].file);
        continue;
      }
      const base = path.join(directory, "base.png");
      await shoot(chipHtml(segment), base);
      item.overlays = [{ file: base, start: 0, end: item.seconds }];
      for (const [index, caption] of (item.captions ?? []).entries()) {
        const file = path.join(directory, `caption-${String(index).padStart(2, "0")}.png`);
        await shoot(captionHtml(segment, caption.text), file);
        item.overlays.push({ file, start: caption.start, end: caption.end });
      }
    }
  } finally {
    await browser.close();
  }
}

// Website clips carry a 3 s hold at each end: speed up the action to fit, or spend the holds (then freeze) to fill.
function fitSiteClip(file, seconds) {
  const duration = probeDuration(file);
  const action = duration - 2 * CLIP_HOLD_SECONDS;
  if (seconds < action) return { start: CLIP_HOLD_SECONDS, length: action, speed: action / seconds, freeze: 0 };
  const start = Math.max(0, CLIP_HOLD_SECONDS - (seconds - action) / 2);
  const length = Math.min(seconds, duration - start);
  return { start, length, speed: 1, freeze: seconds - length };
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

// Face centers from `faces.swift` (video/faces/<take>.json), de-glitched with a median, eased with a moving
// average, then turned into one crop command per frame so the speaker stays centered in their panel.
function trackFace(segment, panelWidth, seconds) {
  const file = path.join(FACES_DIR, `${segment.take}.json`);
  if (panelWidth === WIDTH || !existsSync(file)) return null;
  const samples = JSON.parse(readFileSync(file, "utf8")).filter((sample) => sample.x !== null);
  const medians = samples.map((sample, index) => ({
    t: sample.t,
    x: median(samples.slice(Math.max(0, index - FACE_MEDIAN_SAMPLES), index + FACE_MEDIAN_SAMPLES + 1).map((other) => other.x)),
  }));
  const smoothed = medians.map((sample) => {
    const near = medians.filter((other) => Math.abs(other.t - sample.t) <= FACE_SMOOTHING_SECONDS);
    return { t: sample.t, x: near.reduce((sum, other) => sum + other.x, 0) / near.length };
  });
  const centerAt = (time) => {
    const after = smoothed.findIndex((sample) => sample.t >= time);
    if (after <= 0) return smoothed[Math.max(after, 0)].x;
    if (after === -1) return smoothed.at(-1).x;
    const [left, right] = [smoothed[after - 1], smoothed[after]];
    return left.x + ((right.x - left.x) * (time - left.t)) / (right.t - left.t);
  };
  const cropXAt = (time) => Math.round(Math.min(WIDTH - panelWidth, Math.max(0, centerAt(time) * WIDTH - panelWidth / 2)));
  const commands = [];
  for (let frame = 0; frame <= Math.ceil(seconds * FPS); frame++) {
    commands.push(`${(frame / FPS).toFixed(3)} crop@track x ${cropXAt(segment.in + frame / FPS)};`);
  }
  const commandsFile = path.join(WORK_DIR, segment.id, "crop.cmd");
  writeFileSync(commandsFile, commands.join("\n"));
  return { firstX: cropXAt(segment.in), commandsFile };
}

function renderSegment(item) {
  const { segment, seconds } = item;
  const inputs = ["-f", "lavfi", "-i", `color=c=0x162e51:s=${WIDTH}x${HEIGHT}:r=${FPS}:d=${seconds}`];
  const filters = [];
  let video = "[0:v]";
  let audio = null;
  let nextInput = 1;

  if (segment.take) {
    inputs.push("-i", path.join(TAKES_DIR, `${segment.take}.mov`));
    const takeIndex = nextInput++;
    const panelWidth = segment.layout === "full" ? WIDTH : PANEL_WIDTH;
    const fixedX = Math.round(Math.min(WIDTH - panelWidth, Math.max(0, segment.cx * WIDTH - panelWidth / 2)));
    const tracked = trackFace(segment, panelWidth, seconds);
    const spokenSeconds = segment.out - segment.in;
    const fadeOut = segment.tail ? AUDIO_FADE_OUT_BEFORE_TAIL : AUDIO_FADE_OUT;
    const crop = tracked
      ? `sendcmd=f=${tracked.commandsFile},crop@track=${panelWidth}:${HEIGHT}:${tracked.firstX}:0`
      : `crop=${panelWidth}:${HEIGHT}:${fixedX}:0`;
    filters.push(
      `[${takeIndex}:v]trim=${segment.in}:${segment.out},setpts=PTS-STARTPTS,fps=${FPS},scale=${WIDTH}:${HEIGHT},${crop},tpad=stop_mode=clone:stop_duration=${segment.tail ?? 0}[speaker]`,
      `${video}[speaker]overlay=0:0[withSpeaker]`,
      `[${takeIndex}:a]atrim=${segment.in}:${segment.out},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,` +
        `afade=t=in:d=${AUDIO_FADE_IN},afade=t=out:st=${spokenSeconds - fadeOut}:d=${fadeOut},apad=pad_dur=${segment.tail ?? 0}[audio]`,
    );
    video = "[withSpeaker]";
    audio = "[audio]";
  }

  if (segment.site) {
    const file = path.join(CLIPS_DIR, segment.site);
    const fit = fitSiteClip(file, seconds);
    inputs.push("-i", file);
    const siteIndex = nextInput++;
    filters.push(
      `[${siteIndex}:v]trim=${fit.start}:${fit.start + fit.length},setpts=(PTS-STARTPTS)/${fit.speed},fps=${FPS},` +
        `scale=${PANEL_WIDTH}:${HEIGHT},tpad=stop_mode=clone:stop_duration=${fit.freeze + 0.1}[site]`,
      `${video}[site]overlay=${PANEL_WIDTH}:0[withSite]`,
    );
    video = "[withSite]";
  }

  for (const [index, overlay] of item.overlays.entries()) {
    inputs.push("-loop", "1", "-framerate", String(FPS), "-t", String(seconds), "-i", overlay.file);
    const overlayIndex = nextInput++;
    const label = `[o${index}]`;
    filters.push(`${video}[${overlayIndex}:v]overlay=0:0:enable='between(t,${overlay.start.toFixed(3)},${overlay.end.toFixed(3)})'${label}`);
    video = label;
  }

  if (!audio) {
    inputs.push("-f", "lavfi", "-t", String(seconds), "-i", "anullsrc=r=48000:cl=stereo");
    audio = `${nextInput++}:a`;
  }
  const fades = segment.id === SEGMENTS[0].id ? `,fade=t=in:d=${OPENING_FADE_SECONDS}` : "";
  filters.push(`${video}trim=0:${seconds},setpts=PTS-STARTPTS,format=yuv420p${fades}[video]`);

  const output = path.join(WORK_DIR, `segment-${segment.id}.mp4`);
  ffmpeg([
    ...inputs, "-filter_complex", filters.join(";"), "-map", "[video]", "-map", audio, "-t", String(seconds),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", String(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", output,
  ]);
  return output;
}

async function main() {
  const onlyIds = process.argv.slice(2);
  const words = JSON.parse(readFileSync(WORDS_FILE, "utf8"));
  rmSync(WORK_DIR, { recursive: true, force: true });
  mkdirSync(WORK_DIR, { recursive: true });

  const timeline = SEGMENTS.map((segment) => ({
    segment,
    seconds: segmentSeconds(segment),
    captions: segment.caption ? timeCaptions(segment, words[segment.take]) : [],
  }));
  writeFileSync(path.join(WORK_DIR, "captions.json"), JSON.stringify(timeline.map(({ segment, captions }) => ({ id: segment.id, captions })), null, 1));
  await renderOverlays(timeline);

  const outputs = [];
  for (const item of timeline) {
    if (onlyIds.length && !onlyIds.includes(item.segment.id)) continue;
    outputs.push(renderSegment(item));
    console.log("segment", item.segment.id, item.segment.title, item.seconds.toFixed(1) + "s");
  }
  if (onlyIds.length) return;

  const list = path.join(WORK_DIR, "segments.txt");
  writeFileSync(list, outputs.map((file) => `file '${file}'`).join("\n"));
  ffmpeg([
    "-f", "concat", "-safe", "0", "-i", list, "-c:v", "copy",
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", OUTPUT_FILE,
  ]);
  console.log("wrote", OUTPUT_FILE, probeDuration(OUTPUT_FILE).toFixed(1) + "s");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
