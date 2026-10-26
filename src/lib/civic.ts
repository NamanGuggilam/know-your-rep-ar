import { cacheLife } from "next/cache";

// Google Civic Information API: official polling place and early voting data (from the
// Voting Information Project). Needs GOOGLE_CIVIC_API_KEY. Without a key we skip it.
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

/** The upcoming Arkansas general election id, or null if Google hasn't listed it. */
async function electionId(key: string): Promise<{ id: string; name: string; day: string } | null> {
  "use cache";
  cacheLife("hours");
  const res = await fetch(`${BASE}/elections?key=${key}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  const { elections } = (await res.json()) as {
    elections?: { id: string; name: string; electionDay: string; ocdDivisionId: string }[];
  };
  const today = new Date().toISOString().slice(0, 10);
  const match = (elections ?? [])
    .filter((e) => e.electionDay >= today && /state:ar$|country:us$/.test(e.ocdDivisionId) && e.id !== "2000")
    .sort((a, b) => a.electionDay.localeCompare(b.electionDay))[0];
  return match ? { id: match.id, name: match.name, day: match.electionDay } : null;
}

export async function votingInfo(address: string): Promise<VotingInfo | null> {
  const key = process.env.GOOGLE_CIVIC_API_KEY;
  if (!key) return null;
  try {
    const election = await electionId(key);
    if (!election) return null;
    const qs = new URLSearchParams({ key, address, electionId: election.id, officialOnly: "true" });
    const res = await fetch(`${BASE}/voterinfo?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(12000) });
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
