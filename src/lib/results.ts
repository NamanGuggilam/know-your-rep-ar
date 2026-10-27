import { cacheLife } from "next/cache";

const API = "https://enr-results-api.totalresults.com";
const CID = "arkansas";
const REQUEST_TIMEOUT_MS = 20_000;
const GROUP_ORDER = ["Federal", "Statewide", "Ballot issues"] as const;
const RESULTS_STALE_AND_REVALIDATE_SECONDS = 60;
const RESULTS_EXPIRE_SECONDS = 600;
const UNKNOWN_CHOICE_NAME = "Unknown";
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

export function splitName(raw: string) {
  const m = raw.match(/^(REP|DEM|LIB|IND|GRN)\s+(.+)$/);
  return m ? { name: m[2], party: PARTY_PREFIX[m[1]] } : { name: raw, party: undefined };
}

export function contestLabel(raw: string) {
  const cd = raw.match(/^U\.S\. Congress District 0?(\d+)$/);
  if (cd) return `U.S. House, District ${cd[1]}`;
  const issue = raw.match(/^ISSUE NO\.\s*(\d+)$/i);
  if (issue) return `Issue ${issue[1]}`;
  return raw === "State Treasurer" ? "Treasurer of State" : raw;
}

type OrderedContest = ResultContest & { order: number };

function contestGroup(meta: RawContestInfo): ResultContest["group"] {
  if (meta.contestTypeCode === "Federal") return "Federal";
  return /^ISSUE/i.test(meta.contestName) ? "Ballot issues" : "Statewide";
}

function toOrderedContest(contest: RawResultContest, meta: RawContestInfo): OrderedContest {
  const choices = contest.choices
    .map((choice) => {
      const rawChoice = meta.choices[choice.choiceID];
      return {
        ...splitName(rawChoice?.name ?? UNKNOWN_CHOICE_NAME),
        votes: choice.totalVotes,
        percent: choice.votePercent,
        order: rawChoice?.order ?? 0,
      };
    })
    .sort((a, b) => b.votes - a.votes || a.order - b.order)
    .map(({ name, party, votes, percent }) => ({ name, party, votes, percent }));
  return {
    id: contest.contestID,
    name: contestLabel(meta.contestName),
    group: contestGroup(meta),
    order: meta.contestOrder,
    precinctsReporting: contest.precinctsReporting,
    totalPrecincts: contest.totalPrecincts,
    totalVotes: contest.totalVotes,
    choices,
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: "no-store" });
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

export async function getGeneralResults(): Promise<Results | null> {
  "use cache";
  cacheLife({
    stale: RESULTS_STALE_AND_REVALIDATE_SECONDS,
    revalidate: RESULTS_STALE_AND_REVALIDATE_SECONDS,
    expire: RESULTS_EXPIRE_SECONDS,
  });
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
    const rows: OrderedContest[] = [];
    for (const rawResults of [federal, statewide]) {
      for (const rawContest of Object.values(rawResults.response.contests)) {
        const meta = info.response.contests[rawContest.contestID];
        if (meta) rows.push(toOrderedContest(rawContest, meta));
      }
    }
    rows.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.order - b.order);
    const contests: ResultContest[] = rows.map(({ order, ...contest }) => {
      void order;
      return contest;
    });
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
