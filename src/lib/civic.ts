import { cacheLife } from "next/cache";

const ELECTIONS_TIMEOUT_MS = 10_000;
const VOTER_INFO_TIMEOUT_MS = 12_000;
const ARKANSAS_OR_NATIONAL_DIVISION = /state:ar$|country:us$/;
const TEST_ELECTION_ID = "2000";
const BASE = "https://www.googleapis.com/civicinfo/v2";

export interface VotingPlace {
  name?: string;
  address: string;
  hours?: string;
  startDate?: string;
  endDate?: string;
}

export interface VotingInfo {
  electionName: string;
  electionDay: string;
  pollingPlaces: VotingPlace[];
  earlyVoteSites: VotingPlace[];
  source: { name: string; url: string };
}

interface RawAddress {
  locationName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
}
interface RawPlace {
  address?: RawAddress;
  pollingHours?: string;
  startDate?: string;
  endDate?: string;
}

export function mapPlaces(raw: RawPlace[] | undefined): VotingPlace[] {
  return (raw ?? [])
    .filter((p) => p.address?.line1)
    .map((p) => {
      const a = p.address!;
      return {
        name: a.locationName || undefined,
        address: [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", ") + (a.zip ? ` ${a.zip}` : "")]
          .filter((l) => l && l.trim())
          .join(", "),
        hours: p.pollingHours || undefined,
        startDate: p.startDate,
        endDate: p.endDate,
      };
    });
}

async function upcomingElection(key: string): Promise<{ id: string; name: string; day: string } | null> {
  "use cache";
  cacheLife("hours");
  const res = await fetch(`${BASE}/elections?key=${key}`, { signal: AbortSignal.timeout(ELECTIONS_TIMEOUT_MS) });
  if (!res.ok) return null;
  const { elections } = (await res.json()) as {
    elections?: { id: string; name: string; electionDay: string; ocdDivisionId: string }[];
  };
  const today = new Date().toISOString().slice(0, 10);
  const match = (elections ?? [])
    .filter((e) => e.electionDay >= today && ARKANSAS_OR_NATIONAL_DIVISION.test(e.ocdDivisionId) && e.id !== TEST_ELECTION_ID)
    .sort((a, b) => a.electionDay.localeCompare(b.electionDay))[0];
  return match ? { id: match.id, name: match.name, day: match.electionDay } : null;
}

export async function votingInfo(address: string): Promise<VotingInfo | null> {
  const key = process.env.GOOGLE_CIVIC_API_KEY;
  if (!key) return null;
  try {
    const election = await upcomingElection(key);
    if (!election) return null;
    const qs = new URLSearchParams({ key, address, electionId: election.id, officialOnly: "true" });
    const res = await fetch(`${BASE}/voterinfo?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(VOTER_INFO_TIMEOUT_MS) });
    if (!res.ok) return null;
    const data = await res.json();
    const info: VotingInfo = {
      electionName: data.election?.name ?? election.name,
      electionDay: data.election?.electionDay ?? election.day,
      pollingPlaces: mapPlaces(data.pollingLocations),
      earlyVoteSites: mapPlaces(data.earlyVoteSites),
      source: { name: "Voting Information Project, via Google Civic Information API", url: "https://votinginfoproject.org/" },
    };
    return info.pollingPlaces.length || info.earlyVoteSites.length ? info : null;
  } catch {
    return null;
  }
}
