import { readFile } from "node:fs/promises";
import { cacheLife } from "next/cache";
import path from "node:path";

export const TOPICS = [
  "Jobs and the economy",
  "Taxes and the budget",
  "Schools and education",
  "Health care",
  "Farming and rural life",
  "Veterans and the military",
  "Public safety and courts",
  "Immigration",
  "Energy and the environment",
  "Roads, transportation, and internet",
  "Families and children",
  "Housing",
  "Elections and government",
  "Rights and freedoms",
  "Other countries and trade",
  "Honors and ceremonies",
  "Other topics",
] as const;
export type Topic = (typeof TOPICS)[number];

export interface StanceBill {
  id: string;
  title: string;
  plain: string;
  url: string;
  status?: string;
  session: string;
}

export interface StanceStatement {
  summary: string;
  quote: string;
  url: string;
}

export interface StanceTopic {
  topic: Topic;
  statements: StanceStatement[];
  bills: StanceBill[];
}

export interface StanceFile {
  id: string;
  name: string;
  generatedAt: string;
  model: string;
  facts: { label: string; value: string }[];
  committees: { name: string; role?: string }[];
  ownWords: {
    status: "ok" | "blocked" | "none" | "not-found";
    note: string;
    pages: { url: string; title: string }[];
  };
  billsNote: string;
  topics: StanceTopic[];
  sources: { name: string; url: string }[];
  removedByChecks: number;
}

const DIR = path.join(process.cwd(), "src", "data", "stances");

export async function getStances(id: string): Promise<StanceFile | null> {
  "use cache";
  cacheLife("max");
  if (!/^[A-Za-z0-9-]+$/.test(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(DIR, `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}
