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

type CompareTopic = (typeof COMPARE_TOPICS)[number];
type DraftPosition = Draft["positions"][number];
type CrawledPage = { url: string; text: string; source?: string };

const USAGE = "usage: finalize.ts <candidate-id>";
const BANNED_WORDS = /\b(conservative|liberal|progressive|right-wing|left-wing|far-right|far-left|radical|extreme|maga|woke|republican|democrat(ic)?|libertarian)\b/i;
const PHOTO_USER_AGENT = "KnowYourRepAR/1.0 (student civic project)";
const PHOTO_TIMEOUT_MS = 30000;
const MIN_PHOTO_BYTES = 2000;
const MIN_QUOTE_CHARS = 20;
const NO_WEBSITE_NOTE = "We could not find a campaign website for this candidate.";
const projectRoot = process.cwd();

const readJson = (filePath: string) => JSON.parse(readFileSync(filePath, "utf8"));

function photoExtension(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

async function savePhoto(candidateId: string, photo: NonNullable<Draft["photo"]>) {
  const response = await fetch(photo.url, {
    headers: { "user-agent": PHOTO_USER_AGENT },
    signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS),
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !/^image\/(jpeg|png|webp)/.test(contentType)) throw new Error(`photo: ${response.status} ${contentType}`);
  const extension = photoExtension(contentType);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < MIN_PHOTO_BYTES) throw new Error("photo: file too small");
  const directory = path.join(projectRoot, "public", "candidates");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${candidateId}.${extension}`), bytes);
  return `/candidates/${candidateId}.${extension}`;
}

function rejectionReason(
  position: DraftPosition,
  topic: CompareTopic,
  page: CrawledPage | undefined,
  alreadyKept: boolean,
): string | null {
  if (!COMPARE_TOPICS.includes(topic)) return "unknown topic";
  if (alreadyKept) return "duplicate topic";
  if (!page) return "no such page";
  if (position.quote.trim().length < MIN_QUOTE_CHARS) return "quote too short";
  if (!normalize(page.text).includes(normalize(position.quote))) return "quote not found word-for-word on the page";
  if (!/^Says\b/.test(position.summary.trim())) return 'summary must start with "Says"';
  if (BANNED_WORDS.test(position.summary)) return "summary uses a label or party name";
  return null;
}

async function main() {
  const candidateId = process.argv[2];
  if (!candidateId || !/^[a-z0-9-]+$/.test(candidateId)) throw new Error(USAGE);
  const draft: Draft = readJson(path.join(projectRoot, ".cache", "drafts", `${candidateId}.json`));
  const crawlPath = path.join(projectRoot, ".cache", "campaign", `${candidateId}.json`);
  const crawl = existsSync(crawlPath)
    ? readJson(crawlPath)
    : { pages: [], note: draft.websiteNote ?? NO_WEBSITE_NOTE };
  const pages: CrawledPage[] = crawl.pages;

  const keptPositions: Partial<Record<CompareTopic, Position>> = {};
  const problems: string[] = [];
  for (const position of draft.positions) {
    const page = pages[position.page - 1];
    const topic = position.topic as CompareTopic;
    const reason = rejectionReason(position, topic, page, Boolean(keptPositions[topic]));
    if (reason) {
      problems.push(`${position.topic}: ${reason}`);
      continue;
    }
    keptPositions[topic] = {
      summary: position.summary.trim(),
      quote: position.quote.trim(),
      url: page.url,
      ...(page.source ? { source: page.source } : {}),
    };
  }

  let photo: CandidatePositions["photo"];
  if (draft.photo) {
    try {
      photo = {
        src: await savePhoto(candidateId, draft.photo),
        credit: draft.photo.credit,
        sourcePage: draft.photo.sourcePage,
      };
    } catch (error) {
      problems.push((error as Error).message);
    }
  }

  const file: CandidatePositions = {
    candidateId,
    website: draft.website ?? crawl.website,
    websiteNote: draft.websiteNote ?? crawl.note,
    generatedAt: new Date().toISOString(),
    model: "Claude (reviewed by code)",
    positions: keptPositions,
    photo,
  };
  await mkdir(path.join(projectRoot, "src", "data", "positions"), { recursive: true });
  await writeFile(path.join(projectRoot, "src", "data", "positions", `${candidateId}.json`), JSON.stringify(file, null, 2) + "\n");
  console.log(`${candidateId}: kept ${Object.keys(keptPositions).length} topics, photo ${photo?.src ?? "none"}`);
  for (const problem of problems) console.log(`  REMOVED ${problem}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
