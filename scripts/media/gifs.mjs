// Turns media/video/*.webm into media/gif/*.gif (good-quality palette) and media/mp4/*.mp4.
//   node scripts/media/gifs.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const VID = path.join(process.cwd(), "media", "video");
const GIF = path.join(process.cwd(), "media", "gif");
const MP4 = path.join(process.cwd(), "media", "mp4");
mkdirSync(GIF, { recursive: true });
mkdirSync(MP4, { recursive: true });

for (const f of readdirSync(VID).filter((x) => x.endsWith(".webm"))) {
  const src = path.join(VID, f);
  const name = f.replace(/\.webm$/, "");
  const phone = name.includes("phone");
  const width = phone ? 390 : 960;
  const filters = `fps=12,scale=${width}:-1:flags=lanczos`;
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-i", src,
    "-vf", `${filters},split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
    "-loop", "0", path.join(GIF, `${name}.gif`),
  ]);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-i", src, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
    "-movflags", "+faststart", path.join(MP4, `${name}.mp4`),
  ]);
  console.log("gif + mp4", name);
}
