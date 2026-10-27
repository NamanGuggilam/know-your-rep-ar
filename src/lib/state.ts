import * as cheerio from "cheerio";
import Papa from "papaparse";
import { cacheLife } from "next/cache";
import type { ContactAddress, DataSource, Official } from "./types";

const CSV_URL = "https://data.openstates.org/people/current/ar.csv";
const SOURCE_PAGE = "https://open.pluralpolicy.com/data/legislator-csv/";
const FETCH_TIMEOUT_MS = 20_000;
const MIN_EXPECTED_LEGISLATORS = 100;
const ARKLEG_BASE_URL = "https://arkleg.state.ar.us";

export interface OpenStatesRow {
  id: string;
  name: string;
  current_party: string;
  current_district: string;
  current_chamber: string;
  email: string;
  image: string;
  links: string;
  capitol_address: string;
  capitol_voice: string;
  district_address: string;
  district_voice: string;
}

export function parseOpenStatesCsv(csv: string): OpenStatesRow[] {
  const { data } = Papa.parse<OpenStatesRow>(csv, { header: true, skipEmptyLines: true });
  return data.filter((r) => r.id && r.name);
}

export function stateIdFromOcd(ocd: string) {
  return ocd.replace(/^ocd-person\//, "");
}

export function mapStateRow(r: OpenStatesRow, source: DataSource): Official {
  const isSenate = r.current_chamber === "upper";
  const links = r.links.split(";").map((l) => l.trim());
  const currentProfile = links.find(isCurrentArklegProfile);
  const addresses = [
    officeAddress("Capitol office", r.capitol_address, r.capitol_voice),
    officeAddress("District office", r.district_address, r.district_voice),
  ].filter((address): address is ContactAddress => address !== null);
  return {
    id: stateIdFromOcd(r.id),
    name: r.name,
    office: isSenate ? "state-senate" : "state-house",
    title: isSenate ? "Arkansas State Senator" : "Arkansas State Representative",
    district: `${isSenate ? "State Senate" : "State House"} District ${r.current_district}`,
    party: r.current_party || "Not listed",
    photoUrl: r.image || undefined,
    phone: r.capitol_voice || r.district_voice || undefined,
    email: r.email || undefined,
    officialPageUrl: currentProfile?.replace(/^http:/, "https:"),
    website: links.find((l) => /arkansashouse\.org|senate\.arkansas\.gov/i.test(l)),
    addresses,
    source,
  };
}

function isCurrentArklegProfile(link: string) {
  return /arkleg\.state\.ar\.us\/Legislators\/Detail/i.test(link) && !/ddBiennium/i.test(link);
}

function officeAddress(label: string, address: string, phone: string): ContactAddress | null {
  if (!address && !phone) return null;
  return { label, lines: address ? splitAddress(address) : [], phone: phone || undefined };
}

function splitAddress(addr: string) {
  const parts = addr.split(",").map((s) => s.trim());
  if (parts.length < 3) return [addr];
  return [parts.slice(0, -2).join(", "), parts.slice(-2).join(", ")];
}

type ArklegLinks = Map<string, { url: string; name: string }[]>;
const ARKLEG_LIST = "https://www.arkleg.state.ar.us/Legislators/List";

function listKey(chamber: "upper" | "lower", district: string | undefined) {
  return `${chamber}-${district}`;
}

export function parseArklegList(html: string): ArklegLinks {
  const $ = cheerio.load(html);
  const out: ArklegLinks = new Map();
  $("[role=row]").each((_, row) => {
    const $row = $(row);
    const profileLink = $row.find("a[href*='/Legislators/Detail']").first();
    const href = profileLink.attr("href");
    const chamber = $row.find("[aria-colindex='2']").text().replace(/Chamber:/, "").trim();
    const district = $row.find("[aria-colindex='4']").text().replace(/District:/, "").trim();
    if (!href || !/^(Senate|House)$/.test(chamber) || !/^\d+$/.test(district)) return;
    const url = new URL(href, ARKLEG_BASE_URL);
    url.searchParams.delete("ddBienniumSession");
    const key = listKey(chamber === "Senate" ? "upper" : "lower", district);
    out.set(key, [...(out.get(key) ?? []), { url: url.toString(), name: profileLink.text().replace(/\s+/g, " ").trim() }]);
  });
  return out;
}

export function surname(name: string) {
  const parts = name.toLowerCase().replace(/[.,]/g, "").split(/\s+/).filter((p) => !/^(jr|sr|ii|iii|iv)$/.test(p));
  return parts.at(-1) ?? "";
}

export function withArklegLinks(officials: Official[], links: ArklegLinks) {
  return officials.map((o) => {
    const key = listKey(o.office === "state-senate" ? "upper" : "lower", o.district?.match(/(\d+)$/)?.[1]);
    const match = links.get(key)?.find((l) => surname(l.name) === surname(o.name));
    return match ? { ...o, officialPageUrl: match.url } : o;
  });
}

export async function getArklegLinks(): Promise<ArklegLinks> {
  try {
    const res = await fetch(ARKLEG_LIST, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    return res.ok ? parseArklegList(await res.text()) : new Map();
  } catch {
    return new Map();
  }
}

export async function getStateOfficials(): Promise<Official[]> {
  "use cache";
  cacheLife("days");
  const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Open States CSV returned ${res.status}`);
  const rows = parseOpenStatesCsv(await res.text());
  const source: DataSource = {
    name: "Open States / Plural Policy (Arkansas legislators)",
    url: SOURCE_PAGE,
    fetchedAt: new Date().toISOString(),
  };
  const officials = withArklegLinks(
    rows.map((r) => mapStateRow(r, source)),
    await getArklegLinks(),
  );
  if (officials.length < MIN_EXPECTED_LEGISLATORS) throw new Error("Open States returned too few Arkansas legislators");
  return officials;
}
