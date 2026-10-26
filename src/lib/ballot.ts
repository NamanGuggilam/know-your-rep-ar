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

/** The contests on this person's ballot that we have candidate lists for, plus the ones we don't. */
export function contestsFor(d: Districts) {
  const known = CONTESTS.filter(
    (c) =>
      c.scope === "statewide" ||
      (c.scope === "congressional" && c.district === d.congressional) ||
      (c.scope === "state-senate" && c.district === d.stateSenate) ||
      (c.scope === "state-house" && c.district === d.stateHouse),
  );
  const missing: string[] = [];
  if (!known.some((c) => c.scope === "congressional")) missing.push(`U.S. House, District ${d.congressional}`);
  if (!known.some((c) => c.scope === "state-house")) missing.push(`State House, District ${d.stateHouse}`);
  // About half of state senate seats are on the ballot in a given year, so this one may or may not be.
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
