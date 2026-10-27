import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import ballot from "@/data/ballot-2026.json";
import type { Districts } from "./types";

export { COMPARE_TOPICS } from "./topics";
export type { Candidate, CandidatePositions, CompareTopic, Contest, Position } from "./topics";
import type { CandidatePositions, Contest } from "./topics";

export const ELECTION = ballot.election;
const CONTESTS = ballot.contests as Contest[];

function isOnBallot(c: Contest, d: Districts) {
  switch (c.scope) {
    case "statewide":
      return true;
    case "congressional":
      return c.district === d.congressional;
    case "state-senate":
      return c.district === d.stateSenate;
    case "state-house":
      return c.district === d.stateHouse;
  }
}

export function contestsFor(d: Districts) {
  const known = CONTESTS.filter((contest) => isOnBallot(contest, d));
  const missing: string[] = [];
  if (!known.some((c) => c.scope === "congressional")) missing.push(`U.S. House, District ${d.congressional}`);
  if (!known.some((c) => c.scope === "state-house")) missing.push(`State House, District ${d.stateHouse}`);
  if (!known.some((c) => c.scope === "state-senate")) missing.push(`State Senate, District ${d.stateSenate} (if it is up this year)`);
  return { contests: known, missing };
}

const DIR = path.join(process.cwd(), "src", "data", "positions");

export async function getPositions(candidateId: string): Promise<CandidatePositions | null> {
  "use cache";
  cacheLife("max");
  if (!/^[a-z0-9-]+$/.test(candidateId)) return null;
  try {
    return JSON.parse(await readFile(path.join(DIR, `${candidateId}.json`), "utf8"));
  } catch {
    return null;
  }
}
