// Step 2 of the agent-assisted path: check a draft and publish it.
//   npx tsx scripts/positions/finalize.ts <candidate-id>
// Reads .cache/drafts/<id>.json (written by the reviewer) and .cache/campaign/<id>.json (crawler output).
// Every quote must appear word-for-word on the page it cites, or it is dropped.
// Downloads the photo to public/candidates/<id>.<ext>; its credit is saved in the positions file.
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { COMPARE_TOPICS, type CandidatePositions, type Position } from "../../src/lib/ballot";
import { normalize } from "../stances/organize";

interface Draft {
  website?: string;
  websiteNote?: string;
  photo?: { url: string; credit: string; sourcePage: string };
  positions: { topic: string; summary: string; quote: string; page: number }[];
}

const BANNED = /\b(conservative|liberal|progressive|right-wing|left-wing|far-right|far-left|radical|extreme|maga|woke|republican|democrat(ic)?|libertarian)\b/i;
const root = process.cwd();
const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

async function savePhoto(id: string, photo: NonNullable<Draft["photo"]>) {
  const res = await fetch(photo.url, {
    headers: { "user-agent": "KnowYourRepAR/1.0 (student civic project)" },
    signal: AbortSignal.timeout(30000),
  });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !/^image\/(jpeg|png|webp)/.test(type)) throw new Error(`photo: ${res.status} ${type}`);
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error("photo: file too small");
  const dir = path.join(root, "public", "candidates");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${id}.${ext}`), buf);
  return `/candidates/${id}.${ext}`;
}

async function main() {
  const id = process.argv[2];
  if (!id || !/^[a-z0-9-]+$/.test(id)) throw new Error("usage: finalize.ts <candidate-id>");
  const draft: Draft = read(path.join(root, ".cache", "drafts", `${id}.json`));
  const crawl = existsSync(path.join(root, ".cache", "campaign", `${id}.json`))
    ? read(path.join(root, ".cache", "campaign", `${id}.json`))
    : { pages: [], note: draft.websiteNote ?? "We could not find a campaign website for this candidate." };
  const pages: { url: string; text: string; source?: string }[] = crawl.pages;

  const kept: Partial<Record<(typeof COMPARE_TOPICS)[number], Position>> = {};
  const problems: string[] = [];
  for (const p of draft.positions) {
    const page = pages[p.page - 1];
    const topic = p.topic as (typeof COMPARE_TOPICS)[number];
    const why = !COMPARE_TOPICS.includes(topic)
      ? "unknown topic"
      : kept[topic]
        ? "duplicate topic"
        : !page
          ? "no such page"
          : p.quote.trim().length < 20
            ? "quote too short"
            : !normalize(page.text).includes(normalize(p.quote))
              ? "quote not found word-for-word on the page"
              : !/^Says\b/.test(p.summary.trim())
                ? 'summary must start with "Says"'
                : BANNED.test(p.summary)
                  ? "summary uses a label or party name"
                  : null;
    if (why) {
      problems.push(`${p.topic}: ${why}`);
      continue;
    }
    kept[topic] = {
      summary: p.summary.trim(),
      quote: p.quote.trim(),
      url: page.url,
      ...(page.source ? { source: page.source } : {}),
    };
  }

  let photo: CandidatePositions["photo"];
  if (draft.photo) {
    try {
      photo = { src: await savePhoto(id, draft.photo), credit: draft.photo.credit, sourcePage: draft.photo.sourcePage };
    } catch (e) {
      problems.push((e as Error).message);
    }
  }

  const file: CandidatePositions = {
    candidateId: id,
    website: draft.website ?? crawl.website,
    websiteNote: draft.websiteNote ?? crawl.note,
    generatedAt: new Date().toISOString(),
    model: "Claude (reviewed by code)",
    positions: kept,
    photo,
  };
  await mkdir(path.join(root, "src", "data", "positions"), { recursive: true });
  await writeFile(path.join(root, "src", "data", "positions", `${id}.json`), JSON.stringify(file, null, 2) + "\n");
  console.log(`${id}: kept ${Object.keys(kept).length} topics, photo ${photo?.src ?? "none"}`);
  for (const p of problems) console.log(`  REMOVED ${p}`);
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
