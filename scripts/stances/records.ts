import * as cheerio from "cheerio";
import { surname } from "../../src/lib/state";

export interface RawBill {
  id: string;
  title: string;
  url: string;
  status?: string;
  session: string;
}

export interface OfficialRecord {
  facts: { label: string; value: string }[];
  committees: { name: string; role?: string }[];
  bills: RawBill[];
  billsNote: string;
  sources: { name: string; url: string }[];
}

const USER_AGENT = "Mozilla/5.0 (compatible; KnowYourRepAR/1.0; student civic project)";
const REQUEST_TIMEOUT_MS = 30000;
const ARKLEG_BASE_URL = "https://arkleg.state.ar.us";
const STATE_SESSIONS = [
  { code: "2025/2025R", label: "2025 Regular Session" },
  { code: "2025/2026F", label: "2026 Fiscal Session" },
];
const JOB_RELATED_PROFILE_LABELS = new Set(["Occupation", "Counties Served", "Public Service", "Veteran"]);
const LEGISLATORS_DATA_URL = "https://unitedstates.github.io/congress-legislators";
const CONGRESS_API_PAGE_SIZE = 250;
const CONGRESS = 119;
const BILL_URL_SLUGS: { [billType: string]: string } = {
  HR: "house-bill",
  S: "senate-bill",
  HJRES: "house-joint-resolution",
  SJRES: "senate-joint-resolution",
  HRES: "house-resolution",
  SRES: "senate-resolution",
  HCONRES: "house-concurrent-resolution",
  SCONRES: "senate-concurrent-resolution",
};

async function get(url: string) {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function dedupeBills(bills: RawBill[]) {
  const seen = new Set<string>();
  return bills.filter((bill) => {
    const key = `${bill.session}:${bill.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatFederalBillId(type: string, number: string) {
  if (type === "HR") return `H.R. ${number}`;
  if (type === "S") return `S. ${number}`;
  return `${type} ${number}`;
}

export async function stateRecord(arklegUrl: string, name: string): Promise<OfficialRecord> {
  const facts: OfficialRecord["facts"] = [];
  const committees = new Map<string, { name: string }>();
  const bills: RawBill[] = [];
  let cosponsoredCount = 0;

  for (const [sessionIndex, session] of STATE_SESSIONS.entries()) {
    const url = `${arklegUrl.replace(/^http:/, "https:")}&ddBienniumSession=${encodeURIComponent(session.code)}`;
    const $ = cheerio.load(await (await get(url)).text());
    const pageTitle = $("title").text();
    if (!pageTitle.toLowerCase().includes(surname(name))) {
      throw new Error(`arkleg page "${clean(pageTitle)}" does not match ${name}`);
    }

    if (sessionIndex === 0) {
      $(".col-md-3 > b").each((_, labelElement) => {
        const label = clean($(labelElement).text()).replace(/:$/, "");
        const value = clean($(labelElement).parent().next(".col-md-9").text());
        if (JOB_RELATED_PROFILE_LABELS.has(label) && value && !facts.some((fact) => fact.label === label)) {
          facts.push({ label, value });
        }
      });
    }
    const sessionCommittees = $("#meetingBodyWrapper a[href*='/Committees/Detail']")
      .map((_, anchor) => clean($(anchor).text()))
      .get()
      .filter(Boolean);
    if (sessionCommittees.length) {
      committees.clear();
      for (const committeeName of sessionCommittees) committees.set(committeeName, { name: committeeName });
    }

    let sponsorSection = "";
    $(".tableSectionHeader, .tableRow, .tableRowAlt").each((_, rowElement) => {
      const row = $(rowElement);
      if (row.hasClass("tableSectionHeader")) {
        sponsorSection = clean(row.text());
        return;
      }
      const link = row.find("a[aria-label^='Bill Number']").not("[aria-label$='History']").first();
      const id = clean(link.text());
      if (!id) return;
      if (!/^Primary Sponsor/i.test(sponsorSection)) {
        cosponsoredCount++;
        return;
      }
      const title = clean(row.find("[aria-colindex='2']").first().text());
      const act = row.find("a[aria-label^='Act']").first().attr("aria-label");
      bills.push({
        id,
        title,
        url: ARKLEG_BASE_URL + link.attr("href"),
        status: act ? `Became law (${act.replace(/\.pdf$/i, "").replace(/^Act/, "Act ")})` : undefined,
        session: session.label,
      });
    });
  }

  return {
    facts,
    committees: [...committees.values()],
    bills: dedupeBills(bills),
    billsNote: `Bills they were the main sponsor of in the 2025 Regular Session and 2026 Fiscal Session. They also co-sponsored ${cosponsoredCount} other bills, not listed here.`,
    sources: [{ name: "Arkansas State Legislature", url: arklegUrl }],
  };
}

type CommitteeData = { membership: Record<string, { bioguide: string; title?: string }[]>; names: Map<string, string> };
let committeeCache: CommitteeData | null = null;

async function loadCommitteeData(): Promise<CommitteeData> {
  if (committeeCache) return committeeCache;
  const [membership, committees] = await Promise.all([
    get(`${LEGISLATORS_DATA_URL}/committee-membership-current.json`).then((response) => response.json()),
    get(`${LEGISLATORS_DATA_URL}/committees-current.json`).then((response) => response.json()),
  ]);
  const names = new Map<string, string>();
  for (const committee of committees as { thomas_id: string; name: string; subcommittees?: { thomas_id: string; name: string }[] }[]) {
    names.set(committee.thomas_id, committee.name);
    for (const subcommittee of committee.subcommittees ?? []) {
      names.set(committee.thomas_id + subcommittee.thomas_id, `${committee.name}: ${subcommittee.name} Subcommittee`);
    }
  }
  committeeCache = { membership, names };
  return committeeCache;
}

export async function federalRecord(bioguide: string): Promise<OfficialRecord> {
  const { membership, names } = await loadCommitteeData();
  const committees: OfficialRecord["committees"] = [];
  for (const [committeeCode, members] of Object.entries(membership)) {
    const member = members.find((candidate) => candidate.bioguide === bioguide);
    if (member && names.has(committeeCode)) committees.push({ name: names.get(committeeCode)!, role: member.title });
  }

  const apiKey = process.env.CONGRESS_GOV_API_KEY || "DEMO_KEY";
  const bills: RawBill[] = [];
  let nextPageUrl: string | null =
    `https://api.congress.gov/v3/member/${bioguide}/sponsored-legislation?format=json&limit=${CONGRESS_API_PAGE_SIZE}&api_key=${apiKey}`;
  while (nextPageUrl) {
    const data = await (await get(nextPageUrl)).json();
    for (const bill of data.sponsoredLegislation ?? []) {
      if (bill.congress !== CONGRESS || !bill.type || !bill.number) continue;
      const type = String(bill.type).toUpperCase();
      bills.push({
        id: formatFederalBillId(type, bill.number),
        title: clean(bill.title ?? ""),
        url: `https://www.congress.gov/bill/${CONGRESS}th-congress/${BILL_URL_SLUGS[type] ?? "bill"}/${bill.number}`,
        status: bill.latestAction?.text ? clean(bill.latestAction.text) : undefined,
        session: `${CONGRESS}th Congress (2025-2026)`,
      });
    }
    nextPageUrl = data.pagination?.next ? `${data.pagination.next}&api_key=${apiKey}` : null;
    const pageOfBills: { congress?: number }[] = data.sponsoredLegislation ?? [];
    const onlyOlderCongresses = pageOfBills.length && pageOfBills.every((bill) => (bill.congress ?? 0) < CONGRESS);
    if (onlyOlderCongresses) nextPageUrl = null;
  }

  return {
    facts: [],
    committees,
    bills,
    billsNote: `Bills and resolutions they were the main sponsor of in the ${CONGRESS}th Congress (2025-2026).`,
    sources: [
      { name: "Congress.gov (Library of Congress)", url: `https://www.congress.gov/` },
      { name: "congress-legislators committee data", url: "https://github.com/unitedstates/congress-legislators" },
    ],
  };
}
