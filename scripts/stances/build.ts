// Builds src/data/stances/<id>.json for every Arkansas official.
//
//   npx tsx scripts/stances/build.ts            # all officials, skips ones already built
//   npx tsx scripts/stances/build.ts --force    # rebuild everything
//   npx tsx scripts/stances/build.ts --only W000809,<uuid>
//   npx tsx scripts/stances/build.ts --limit 3
//
//   npx tsx scripts/stances/build.ts --no-ai    # records only: no topics, no plain-English lines
//
// Needs ANTHROPIC_API_KEY (from .env.local or the shell) unless --no-ai. CONGRESS_GOV_API_KEY is optional (falls back to the public DEMO_KEY).
// Review the JSON files before publishing: they are what the app shows.
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { mapFederal } from "../../src/lib/federal";
import { getArklegLinks, mapStateRow, parseOpenStatesCsv, withArklegLinks } from "../../src/lib/state";
import type { StanceFile } from "../../src/lib/stances";
import type { DataSource, Official } from "../../src/lib/types";
import { MODEL, organize } from "./organize";
import { closeBrowser, ownWords } from "./ownwords";
import { federalRecord, stateRecord } from "./records";

const OUT = path.join(process.cwd(), "src", "data", "stances");
const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
const noAi = args.includes("--no-ai");
const CONCURRENCY = 4;

// Keys in .env.local win over the shell, so a stale exported key can't shadow the project's key.
try {
  Object.assign(process.env, parseEnv(readFileSync(".env.local", "utf8")));
} catch {
  // No .env.local: use the shell environment.
}

async function loadOfficials(): Promise<Official[]> {
  const src: DataSource = { name: "", url: "", fetchedAt: new Date().toISOString() };
  const [people, offices, csv] = await Promise.all([
    fetch("https://unitedstates.github.io/congress-legislators/legislators-current.json").then((r) => r.json()),
    fetch("https://unitedstates.github.io/congress-legislators/legislators-district-offices.json").then((r) => r.json()),
    fetch("https://data.openstates.org/people/current/ar.csv").then((r) => r.text()),
  ]);
  const state = withArklegLinks(
    parseOpenStatesCsv(csv).map((r) => mapStateRow(r, src)),
    await getArklegLinks(),
  );
  return [...mapFederal(people, offices, src), ...state];
}

async function buildOne(o: Official): Promise<string> {
  const federal = o.office === "us-senate" || o.office === "us-house";
  const record = federal
    ? await federalRecord(o.id)
    : o.officialPageUrl
      ? await stateRecord(o.officialPageUrl, o.name)
      : { facts: [], committees: [], bills: [], billsNote: "We could not find this person's page on the Arkansas State Legislature website.", sources: [] };

  // State lawmakers rarely have an official issues page, so we only crawl federal .gov sites.
  const words = federal
    ? await ownWords(o.website)
    : {
        status: "none" as const,
        note: "Arkansas state lawmakers do not have official issue pages on the Legislature website. Their bills below show what they have worked on.",
        pages: [],
      };

  // --no-ai: list the real bills with their official titles, unsorted. Nothing is generated.
  const { topics, removed, refused } = noAi
    ? {
        topics: record.bills.length
          ? [{ topic: "Other topics" as const, statements: [], bills: record.bills.map((b) => ({ ...b, plain: "" })) }]
          : [],
        removed: 0,
        refused: false,
      }
    : await organize({ name: o.name, title: o.title }, words.pages, record.bills);
  if (refused) throw new Error("model declined");

  const file: StanceFile = {
    id: o.id,
    name: o.name,
    generatedAt: new Date().toISOString(),
    model: noAi ? "none" : MODEL,
    facts: record.facts,
    committees: record.committees,
    ownWords: { status: words.status, note: words.note, pages: words.pages.map((p) => ({ url: p.url, title: p.title })) },
    billsNote: record.billsNote,
    topics,
    sources: [
      ...record.sources,
      ...(words.pages.length ? [{ name: `${o.name}'s official website`, url: o.website! }] : []),
    ],
    removedByChecks: removed,
  };
  await writeFile(path.join(OUT, `${o.id}.json`), JSON.stringify(file, null, 2) + "\n");
  const statements = topics.reduce((n, t) => n + t.statements.length, 0);
  return `${o.name}: ${record.bills.length} bills, ${statements} statements, ${record.committees.length} committees, own words: ${words.status}, removed ${removed}`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let todo = (await loadOfficials()).filter((o) => (only ? only.includes(o.id) : true));
  if (!force) todo = todo.filter((o) => !existsSync(path.join(OUT, `${o.id}.json`)));
  todo = todo.slice(0, limit);
  console.log(`Building ${todo.length} officials ${noAi ? "without AI" : `with ${MODEL}`}...`);

  const failures: string[] = [];
  let i = 0;
  async function worker() {
    while (i < todo.length) {
      const o = todo[i++];
      try {
        console.log("ok  ", await buildOne(o));
      } catch (e) {
        failures.push(`${o.name} (${o.id}): ${(e as Error).message}`);
        console.log("FAIL", o.name, (e as Error).message);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await closeBrowser();
  if (failures.length) {
    console.log(`\n${failures.length} failed:\n` + failures.join("\n"));
    process.exitCode = 1;
  }
}

main();
