import { cacheLife } from "next/cache";

// Official Arkansas election-night results, from the Secretary of State's results vendor (Tally).
// Public and keyless. We read it on the server at most once a minute.
const API = "https://enr-results-api.totalresults.com";
const CID = "arkansas";
export const RESULTS_SITE = "https://arkansas.tally-enr.com/";
export const SOS_RESULTS = "https://www.sos.arkansas.gov/elections/research/election-results";

export interface ResultChoice {
  name: string;
  party?: string;
  votes: number;
  percent: number;
}

export interface ResultContest {
  id: string;
  name: string;
  group: "Federal" | "Statewide" | "Ballot issues";
  precinctsReporting: number;
  totalPrecincts: number;
  totalVotes: number;
  choices: ResultChoice[];
}

export interface Results {
  electionName: string;
  electionDate: string;
  lastUpdated: string;
  isOfficial: boolean;
  precinctsReporting: number;
  totalPrecincts: number;
  ballotsCast: number;
  contests: ResultContest[];
}

const PARTY_PREFIX: Record<string, string> = { REP: "Republican", DEM: "Democratic", LIB: "Libertarian", IND: "Independent", GRN: "Green" };

/** "REP Tom Cotton" -> { name: "Tom Cotton", party: "Republican" } */
export function splitName(raw: string) {
  const m = raw.match(/^(REP|DEM|LIB|IND|GRN)\s+(.+)$/);
  return m ? { name: m[2], party: PARTY_PREFIX[m[1]] } : { name: raw, party: undefined };
}

/** "U.S. Congress District 03" -> "U.S. House, District 3"; "ISSUE NO. 1" -> "Issue 1" */
export function contestLabel(raw: string) {
  const cd = raw.match(/^U\.S\. Congress District 0?(\d+)$/);
  if (cd) return `U.S. House, District ${cd[1]}`;
  const issue = raw.match(/^ISSUE NO\.\s*(\d+)$/i);
  if (issue) return `Issue ${issue[1]}`;
  return raw === "State Treasurer" ? "Treasurer of State" : raw;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(20000), cache: "no-store" });
  if (!res.ok) throw new Error(`results ${res.status}`);
  return res.json();
}

interface RawChoiceInfo {
  name: string;
  order: number;
}
interface RawContestInfo {
  contestName: string;
  contestTypeCode: string;
  contestOrder: number;
  choices: Record<string, RawChoiceInfo>;
}
interface RawResultContest {
  contestID: string;
  precinctsReporting: number;
  totalPrecincts: number;
  totalVotes: number;
  choices: { choiceID: string; totalVotes: number; votePercent: number }[];
}
interface RawResults {
  lastUpdated: string;
  isOfficial: boolean;
  turnout: { precinctsReporting: number; totalPrecincts: number; totalBallotsCast: number } | null;
  response: { contests: Record<string, RawResultContest> };
}

/** The upcoming (or most recent) general election, with federal and statewide races and ballot issues. */
export async function getGeneralResults(): Promise<Results | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  try {
    const elections = await get<{ electionID: string; electionName: string; electionDate: string; isDefault: boolean }[]>(
      `/Election/GetElectionList?cid=${CID}`,
    );
    const election =
      elections.find((e) => e.isDefault && /general/i.test(e.electionName)) ??
      elections.find((e) => /general election/i.test(e.electionName));
    if (!election) return null;
    const id = election.electionID;
    const [info, federal, statewide] = await Promise.all([
      get<{ response: { contests: Record<string, RawContestInfo> } }>(
        `/Contest/GetContestSearchList?cid=${CID}&electionID=${id}`,
      ),
      get<RawResults>(`/Contest/GetContestResults?cId=${CID}&electionID=${id}&contestType=Federal`),
      get<RawResults>(`/Contest/GetContestResults?cId=${CID}&electionID=${id}&contestType=Statewide`),
    ]);
    const GROUPS = ["Federal", "Statewide", "Ballot issues"] as const;
    const rows: (ResultContest & { order: number })[] = [];
    for (const r of [federal, statewide]) {
      for (const c of Object.values(r.response.contests)) {
        const meta = info.response.contests[c.contestID];
        if (!meta) continue;
        rows.push({
          id: c.contestID,
          name: contestLabel(meta.contestName),
          group: meta.contestTypeCode === "Federal" ? "Federal" : /^ISSUE/i.test(meta.contestName) ? "Ballot issues" : "Statewide",
          order: meta.contestOrder,
          precinctsReporting: c.precinctsReporting,
          totalPrecincts: c.totalPrecincts,
          totalVotes: c.totalVotes,
          choices: c.choices
            .map((ch) => {
              const raw = meta.choices[ch.choiceID];
              return { ...splitName(raw?.name ?? "Unknown"), votes: ch.totalVotes, percent: ch.votePercent, order: raw?.order ?? 0 };
            })
            // Before votes come in, keep the official order; after, most votes first.
            .sort((a, b) => b.votes - a.votes || a.order - b.order)
            .map(({ name, party, votes, percent }) => ({ name, party, votes, percent })),
        });
      }
    }
    rows.sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.order - b.order);
    const contests: ResultContest[] = rows.map((c) => ({
      id: c.id,
      name: c.name,
      group: c.group,
      precinctsReporting: c.precinctsReporting,
      totalPrecincts: c.totalPrecincts,
      totalVotes: c.totalVotes,
      choices: c.choices,
    }));
    const t = statewide.turnout ?? federal.turnout;
    return {
      electionName: election.electionName.replace("Judical", "Judicial"),
      electionDate: election.electionDate.slice(0, 10),
      lastUpdated: statewide.lastUpdated,
      isOfficial: statewide.isOfficial,
      precinctsReporting: t?.precinctsReporting ?? 0,
      totalPrecincts: t?.totalPrecincts ?? 0,
      ballotsCast: t?.totalBallotsCast ?? 0,
      contests,
    };
  } catch {
    return null;
  }
}
