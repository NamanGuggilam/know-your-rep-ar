import * as cheerio from "cheerio";
import Papa from "papaparse";
import { cacheLife } from "next/cache";
import type { ContactAddress, DataSource, Official } from "./types";

const CSV_URL = "https://data.openstates.org/people/current/ar.csv";
const SOURCE_PAGE = "https://open.pluralpolicy.com/data/legislator-csv/";

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

/** "ocd-person/7dff69f1-..." -> "7dff69f1-..." */
export function stateIdFromOcd(ocd: string) {
  return ocd.replace(/^ocd-person\//, "");
}

export function mapStateRow(r: OpenStatesRow, source: DataSource): Official {
  const isSenate = r.current_chamber === "upper";
  const links = r.links.split(";").map((l) => l.trim());
  // The first arkleg.state.ar.us link without a biennium parameter is the current profile.
  const arkleg = links.find((l) => /arkleg\.state\.ar\.us\/Legislators\/Detail/i.test(l) && !/ddBiennium/i.test(l));
  const addresses: ContactAddress[] = [];
  if (r.capitol_address || r.capitol_voice) {
    addresses.push({
      label: "Capitol office",
      lines: r.capitol_address ? splitAddress(r.capitol_address) : [],
      phone: r.capitol_voice || undefined,
    });
  }
  if (r.district_address || r.district_voice) {
    addresses.push({
      label: "District office",
      lines: r.district_address ? splitAddress(r.district_address) : [],
      phone: r.district_voice || undefined,
    });
  }
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
    officialPageUrl: arkleg?.replace(/^http:/, "https:"),
    website: links.find((l) => /arkansashouse\.org|senate\.arkansas\.gov/i.test(l)),
    addresses,
    source,
  };
}

/** "4106 SW Rhinestone Blvd., Bentonville, AR 72713" -> ["4106 SW Rhinestone Blvd.", "Bentonville, AR 72713"] */
function splitAddress(addr: string) {
  const parts = addr.split(",").map((s) => s.trim());
  if (parts.length < 3) return [addr];
  return [parts.slice(0, -2).join(", "), parts.slice(-2).join(", ")];
}

const ARKLEG_LIST = "https://www.arkleg.state.ar.us/Legislators/List";

/**
 * The Legislature's own member list, keyed "upper-34" / "lower-13".
 * Open States sometimes lists an old profile link first, so we prefer the official list.
 * A district can have more than one row (for example, a member and the person they replaced),
 * so we keep every row and match on name too.
 */
export function parseArklegList(html: string): Map<string, { url: string; name: string }[]> {
  const $ = cheerio.load(html);
  const out = new Map<string, { url: string; name: string }[]>();
  $("[role=row]").each((_, row) => {
    const $row = $(row);
    const a = $row.find("a[href*='/Legislators/Detail']").first();
    const href = a.attr("href");
    const chamber = $row.find("[aria-colindex='2']").text().replace(/Chamber:/, "").trim();
    const district = $row.find("[aria-colindex='4']").text().replace(/District:/, "").trim();
    if (!href || !/^(Senate|House)$/.test(chamber) || !/^\d+$/.test(district)) return;
    const url = new URL(href, "https://arkleg.state.ar.us");
    url.searchParams.delete("ddBienniumSession");
    const key = `${chamber === "Senate" ? "upper" : "lower"}-${district}`;
    out.set(key, [...(out.get(key) ?? []), { url: url.toString(), name: a.text().replace(/\s+/g, " ").trim() }]);
  });
  return out;
}

/** Last word of a name, lowercased, ignoring suffixes like "Jr." */
export function surname(name: string) {
  const parts = name.toLowerCase().replace(/[.,]/g, "").split(/\s+/).filter((p) => !/^(jr|sr|ii|iii|iv)$/.test(p));
  return parts.at(-1) ?? "";
}

export function withArklegLinks(officials: Official[], links: Map<string, { url: string; name: string }[]>) {
  return officials.map((o) => {
    const key = `${o.office === "state-senate" ? "upper" : "lower"}-${o.district?.match(/(\d+)$/)?.[1]}`;
    const match = links.get(key)?.find((l) => surname(l.name) === surname(o.name));
    return match ? { ...o, officialPageUrl: match.url } : o;
  });
}

export async function getArklegLinks(): Promise<Map<string, { url: string; name: string }[]>> {
  try {
    const res = await fetch(ARKLEG_LIST, { signal: AbortSignal.timeout(20000) });
    return res.ok ? parseArklegList(await res.text()) : new Map();
  } catch {
    return new Map();
  }
}

export async function getStateOfficials(): Promise<Official[]> {
  "use cache";
  cacheLife("days");
  const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(20000) });
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
  if (officials.length < 100) throw new Error("Open States returned too few Arkansas legislators");
  return officials;
}
