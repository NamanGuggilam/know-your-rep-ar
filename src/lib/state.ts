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
  const officials = rows.map((r) => mapStateRow(r, source));
  if (officials.length < 100) throw new Error("Open States returned too few Arkansas legislators");
  return officials;
}
