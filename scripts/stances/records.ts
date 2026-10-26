// Official legislative records: committees and sponsored bills.
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

const UA = "Mozilla/5.0 (compatible; KnowYourRepAR/1.0; student civic project)";

async function get(url: string) {
  const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

// ---------- Arkansas Legislature ----------

const ARKLEG = "https://arkleg.state.ar.us";
// The 2025-2026 term: regular session and the 2026 fiscal session.
const STATE_SESSIONS = [
  { code: "2025/2025R", label: "2025 Regular Session" },
  { code: "2025/2026F", label: "2026 Fiscal Session" },
];

function clean(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

export async function stateRecord(arklegUrl: string, name: string): Promise<OfficialRecord> {
  const facts: OfficialRecord["facts"] = [];
  const committees = new Map<string, { name: string }>();
  const bills: RawBill[] = [];
  let cosponsored = 0;

  for (const [i, s] of STATE_SESSIONS.entries()) {
    const url = `${arklegUrl.replace(/^http:/, "https:")}&ddBienniumSession=${encodeURIComponent(s.code)}`;
    const $ = cheerio.load(await (await get(url)).text());
    // Make sure this profile is really this person, so we never show someone else's record.
    const pageTitle = $("title").text();
    if (!pageTitle.toLowerCase().includes(surname(name))) {
      throw new Error(`arkleg page "${clean(pageTitle)}" does not match ${name}`);
    }

    if (i === 0) {
      // Labeled profile facts: <div class="col-md-3"><b>Occupation:</b></div><div class="col-md-9">...</div>
      // We leave out personal details like church affiliation: they are not about the job.
      const wanted = new Set(["Occupation", "Counties Served", "Public Service", "Veteran"]);
      $(".col-md-3 > b").each((_, b) => {
        const label = clean($(b).text()).replace(/:$/, "");
        const value = clean($(b).parent().next(".col-md-9").text());
        if (wanted.has(label) && value && !facts.some((f) => f.label === label)) facts.push({ label, value });
      });
    }
    // Committees: keep the most recent session's list (new members only appear there).
    const sessionCommittees = $("#meetingBodyWrapper a[href*='/Committees/Detail']")
      .map((_, a) => clean($(a).text()))
      .get()
      .filter(Boolean);
    if (sessionCommittees.length) {
      committees.clear();
      for (const c of sessionCommittees) committees.set(c, { name: c });
    }

    // Bill rows sit under section headers like "Primary Sponsor" and "CoSponsor".
    let section = "";
    $(".tableSectionHeader, .tableRow, .tableRowAlt").each((_, el) => {
      const $el = $(el);
      if ($el.hasClass("tableSectionHeader")) {
        section = clean($el.text());
        return;
      }
      const link = $el.find("a[aria-label^='Bill Number']").not("[aria-label$='History']").first();
      const id = clean(link.text());
      if (!id) return;
      if (!/^Primary Sponsor/i.test(section)) {
        cosponsored++;
        return;
      }
      const title = clean($el.find("[aria-colindex='2']").first().text());
      const act = $el.find("a[aria-label^='Act']").first().attr("aria-label");
      bills.push({
        id,
        title,
        url: ARKLEG + link.attr("href"),
        status: act ? `Became law (${act.replace(/\.pdf$/i, "").replace(/^Act/, "Act ")})` : undefined,
        session: s.label,
      });
    });
  }

  return {
    facts,
    committees: [...committees.values()],
    bills: dedupe(bills),
    billsNote: `Bills they were the main sponsor of in the 2025 Regular Session and 2026 Fiscal Session. They also co-sponsored ${cosponsored} other bills, not listed here.`,
    sources: [{ name: "Arkansas State Legislature", url: arklegUrl }],
  };
}

function dedupe(bills: RawBill[]) {
  const seen = new Set<string>();
  return bills.filter((b) => {
    const k = `${b.session}:${b.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------- Congress ----------

const CL = "https://unitedstates.github.io/congress-legislators";
let committeeCache: { membership: Record<string, { bioguide: string; title?: string }[]>; names: Map<string, string> } | null = null;

async function committeeData() {
  if (committeeCache) return committeeCache;
  const [membership, committees] = await Promise.all([
    get(`${CL}/committee-membership-current.json`).then((r) => r.json()),
    get(`${CL}/committees-current.json`).then((r) => r.json()),
  ]);
  const names = new Map<string, string>();
  for (const c of committees as { thomas_id: string; name: string; subcommittees?: { thomas_id: string; name: string }[] }[]) {
    names.set(c.thomas_id, c.name);
    for (const s of c.subcommittees ?? []) names.set(c.thomas_id + s.thomas_id, `${c.name}: ${s.name} Subcommittee`);
  }
  committeeCache = { membership, names };
  return committeeCache;
}

const BILL_PATHS: { [k: string]: string } = {
  HR: "house-bill",
  S: "senate-bill",
  HJRES: "house-joint-resolution",
  SJRES: "senate-joint-resolution",
  HRES: "house-resolution",
  SRES: "senate-resolution",
  HCONRES: "house-concurrent-resolution",
  SCONRES: "senate-concurrent-resolution",
};
const CONGRESS = 119;

export async function federalRecord(bioguide: string): Promise<OfficialRecord> {
  const { membership, names } = await committeeData();
  const committees: OfficialRecord["committees"] = [];
  for (const [code, members] of Object.entries(membership)) {
    const m = members.find((x) => x.bioguide === bioguide);
    if (m && names.has(code)) committees.push({ name: names.get(code)!, role: m.title });
  }

  const key = process.env.CONGRESS_GOV_API_KEY || "DEMO_KEY";
  const bills: RawBill[] = [];
  let next: string | null =
    `https://api.congress.gov/v3/member/${bioguide}/sponsored-legislation?format=json&limit=250&api_key=${key}`;
  while (next) {
    const data = await (await get(next)).json();
    for (const b of data.sponsoredLegislation ?? []) {
      if (b.congress !== CONGRESS || !b.type || !b.number) continue; // amendments have no type/number
      const type = String(b.type).toUpperCase();
      bills.push({
        id: `${type === "HR" ? "H.R." : type === "S" ? "S." : type} ${b.number}`,
        title: clean(b.title ?? ""),
        url: `https://www.congress.gov/bill/${CONGRESS}th-congress/${BILL_PATHS[type] ?? "bill"}/${b.number}`,
        status: b.latestAction?.text ? clean(b.latestAction.text) : undefined,
        session: `${CONGRESS}th Congress (2025-2026)`,
      });
    }
    next = data.pagination?.next ? `${data.pagination.next}&api_key=${key}` : null;
    // Results come newest first. Once a whole page is from older Congresses, stop paging.
    const page: { congress?: number }[] = data.sponsoredLegislation ?? [];
    if (page.length && page.every((b) => (b.congress ?? 0) < CONGRESS)) next = null;
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
