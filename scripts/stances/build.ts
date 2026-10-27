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
import { federalRecord, stateRecord, type RawBill } from "./records";

const OUTPUT_DIR = path.join(process.cwd(), "src", "data", "stances");
const CONCURRENCY = 4;
const LEGISLATORS_DATA_URL = "https://unitedstates.github.io/congress-legislators";
const OPEN_STATES_CSV_URL = "https://data.openstates.org/people/current/ar.csv";

function readOption(args: string[], flag: string) {
  return args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyIds = readOption(args, "--only")?.split(",") ?? null;
const limitOption = readOption(args, "--limit");
const limit = limitOption === undefined ? Infinity : Number(limitOption);
const withoutAi = args.includes("--no-ai");

function loadEnvLocal() {
  try {
    Object.assign(process.env, parseEnv(readFileSync(".env.local", "utf8")));
  } catch {
    return;
  }
}

async function loadOfficials(): Promise<Official[]> {
  const dataSource: DataSource = { name: "", url: "", fetchedAt: new Date().toISOString() };
  const [people, districtOffices, csv] = await Promise.all([
    fetch(`${LEGISLATORS_DATA_URL}/legislators-current.json`).then((response) => response.json()),
    fetch(`${LEGISLATORS_DATA_URL}/legislators-district-offices.json`).then((response) => response.json()),
    fetch(OPEN_STATES_CSV_URL).then((response) => response.text()),
  ]);
  const stateOfficials = withArklegLinks(
    parseOpenStatesCsv(csv).map((row) => mapStateRow(row, dataSource)),
    await getArklegLinks(),
  );
  return [...mapFederal(people, districtOffices, dataSource), ...stateOfficials];
}

const NO_STATE_PAGE_RECORD = {
  facts: [],
  committees: [],
  bills: [],
  billsNote: "We could not find this person's page on the Arkansas State Legislature website.",
  sources: [],
};

const NO_STATE_OWN_WORDS = {
  status: "none" as const,
  note: "Arkansas state lawmakers do not have official issue pages on the Legislature website. Their bills below show what they have worked on.",
  pages: [],
};

async function loadRecord(official: Official, isFederal: boolean) {
  if (isFederal) return federalRecord(official.id);
  if (official.officialPageUrl) return stateRecord(official.officialPageUrl, official.name);
  return NO_STATE_PAGE_RECORD;
}

function unsortedBillTopics(bills: RawBill[]) {
  if (!bills.length) return [];
  return [{ topic: "Other topics" as const, statements: [], bills: bills.map((bill) => ({ ...bill, plain: "" })) }];
}

async function buildOne(official: Official): Promise<string> {
  const isFederal = official.office === "us-senate" || official.office === "us-house";
  const record = await loadRecord(official, isFederal);
  const ownWordsResult = isFederal ? await ownWords(official.website) : NO_STATE_OWN_WORDS;

  const { topics, removed, refused } = withoutAi
    ? { topics: unsortedBillTopics(record.bills), removed: 0, refused: false }
    : await organize({ name: official.name, title: official.title }, ownWordsResult.pages, record.bills);
  if (refused) throw new Error("model declined");

  const file: StanceFile = {
    id: official.id,
    name: official.name,
    generatedAt: new Date().toISOString(),
    model: withoutAi ? "none" : MODEL,
    facts: record.facts,
    committees: record.committees,
    ownWords: {
      status: ownWordsResult.status,
      note: ownWordsResult.note,
      pages: ownWordsResult.pages.map((page) => ({ url: page.url, title: page.title })),
    },
    billsNote: record.billsNote,
    topics,
    sources: [
      ...record.sources,
      ...(ownWordsResult.pages.length ? [{ name: `${official.name}'s official website`, url: official.website! }] : []),
    ],
    removedByChecks: removed,
  };
  await writeFile(path.join(OUTPUT_DIR, `${official.id}.json`), JSON.stringify(file, null, 2) + "\n");
  const statementCount = topics.reduce((total, topic) => total + topic.statements.length, 0);
  return `${official.name}: ${record.bills.length} bills, ${statementCount} statements, ${record.committees.length} committees, own words: ${ownWordsResult.status}, removed ${removed}`;
}

async function main() {
  loadEnvLocal();
  await mkdir(OUTPUT_DIR, { recursive: true });
  const outputExists = (official: Official) => existsSync(path.join(OUTPUT_DIR, `${official.id}.json`));
  let queue = (await loadOfficials()).filter((official) => (onlyIds ? onlyIds.includes(official.id) : true));
  if (!force) queue = queue.filter((official) => !outputExists(official));
  queue = queue.slice(0, limit);
  console.log(`Building ${queue.length} officials ${withoutAi ? "without AI" : `with ${MODEL}`}...`);

  const failures: string[] = [];
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < queue.length) {
      const official = queue[nextIndex++];
      try {
        console.log("ok  ", await buildOne(official));
      } catch (error) {
        failures.push(`${official.name} (${official.id}): ${(error as Error).message}`);
        console.log("FAIL", official.name, (error as Error).message);
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
