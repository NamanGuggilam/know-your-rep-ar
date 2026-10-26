import type { Districts } from "./types";

const BASE = "https://geocoding.geo.census.gov/geocoder/geographies";
const ARKANSAS_FIPS = "05";

export class LookupError extends Error {
  constructor(
    public code: "not-found" | "not-arkansas" | "upstream",
    message: string,
  ) {
    super(message);
  }
}

type Geographies = Record<string, Array<Record<string, string>>>;

export interface GeocodeResult {
  matchedAddress?: string;
  point: { lat: number; lon: number };
  districts: Districts;
}

/**
 * The Census renames its layers every cycle ("119th Congressional Districts",
 * "120th Congressional Districts", "2024 State Legislative Districts - Upper", ...).
 * Pick the newest layer whose name matches the pattern.
 */
export function pickLayer(geos: Geographies, pattern: RegExp) {
  const keys = Object.keys(geos)
    .filter((k) => pattern.test(k) && geos[k]?.length)
    .sort((a, b) => (parseInt(b) || 0) - (parseInt(a) || 0));
  return keys.length ? geos[keys[0]][0] : undefined;
}

/** "033" -> "33" */
function trimDistrict(code: string | undefined) {
  if (!code) return undefined;
  const n = parseInt(code, 10);
  return Number.isNaN(n) ? code : String(n);
}

export function parseGeographies(geos: Geographies): Districts {
  const cd = pickLayer(geos, /Congressional Districts$/);
  const upper = pickLayer(geos, /State Legislative Districts - Upper$/);
  const lower = pickLayer(geos, /State Legislative Districts - Lower$/);
  const state = cd?.STATE ?? upper?.STATE ?? lower?.STATE;
  if (state !== ARKANSAS_FIPS) {
    throw new LookupError(
      "not-arkansas",
      "That address is not in Arkansas. This app only covers Arkansas.",
    );
  }
  const congressional = cd?.BASENAME ?? trimDistrict(cd?.GEOID?.slice(2));
  const stateSenate = upper?.BASENAME ?? trimDistrict(upper?.SLDU);
  const stateHouse = lower?.BASENAME ?? trimDistrict(lower?.SLDL);
  if (!congressional || !stateSenate || !stateHouse) {
    throw new LookupError("upstream", "We could not find all of your districts.");
  }
  return { congressional, stateSenate, stateHouse };
}

async function callCensus(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "all",
    format: "json",
    ...params,
  });
  let res: Response;
  try {
    res = await fetch(`${BASE}/${path}?${qs}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new LookupError("upstream", "The U.S. Census address service did not respond.");
  }
  if (!res.ok) throw new LookupError("upstream", "The U.S. Census address service had a problem.");
  return res.json();
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const data = await callCensus("onelineaddress", { address });
  const match = data?.result?.addressMatches?.[0];
  if (!match) {
    throw new LookupError(
      "not-found",
      "We could not find that address. Check the spelling, or add your city and ZIP code.",
    );
  }
  return {
    matchedAddress: match.matchedAddress,
    point: { lat: match.coordinates.y, lon: match.coordinates.x },
    districts: parseGeographies(match.geographies),
  };
}

export async function geocodePoint(lat: number, lon: number): Promise<GeocodeResult> {
  const data = await callCensus("coordinates", { x: String(lon), y: String(lat) });
  const geos = data?.result?.geographies;
  if (!geos) throw new LookupError("not-found", "We could not find districts for your location.");
  return { point: { lat, lon }, districts: parseGeographies(geos) };
}
