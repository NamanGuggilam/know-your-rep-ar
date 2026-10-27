import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const VIDEO_DIR = path.join(process.cwd(), "media", "video");
const GIF_DIR = path.join(process.cwd(), "media", "gif");
const MP4_DIR = path.join(process.cwd(), "media", "mp4");
const GIF_FPS = 12;
const PHONE_WIDTH = 390;
const DESKTOP_WIDTH = 960;
const GIF_MAX_COLORS = 192;
const MP4_CRF = "20";

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args]);
}

function convertToGif(source, name) {
  const width = name.includes("phone") ? PHONE_WIDTH : DESKTOP_WIDTH;
  const scale = `fps=${GIF_FPS},scale=${width}:-1:flags=lanczos`;
  const palette = `split[a][b];[a]palettegen=max_colors=${GIF_MAX_COLORS}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`;
  ffmpeg(["-i", source, "-vf", `${scale},${palette}`, "-loop", "0", path.join(GIF_DIR, `${name}.gif`)]);
}

function convertToMp4(source, name) {
  ffmpeg([
    "-i", source, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", MP4_CRF,
    "-movflags", "+faststart", path.join(MP4_DIR, `${name}.mp4`),
  ]);
}

function main() {
  mkdirSync(GIF_DIR, { recursive: true });
  mkdirSync(MP4_DIR, { recursive: true });
  for (const file of readdirSync(VIDEO_DIR).filter((entry) => entry.endsWith(".webm"))) {
    const source = path.join(VIDEO_DIR, file);
    const name = file.replace(/\.webm$/, "");
    convertToGif(source, name);
    convertToMp4(source, name);
    console.log("gif + mp4", name);
  }
}

main();
