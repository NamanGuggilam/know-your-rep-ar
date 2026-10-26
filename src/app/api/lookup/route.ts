import { geocodeAddress, geocodePoint, LookupError } from "@/lib/census";
import { getFederalOfficials } from "@/lib/federal";
import { buildLineup } from "@/lib/lineup";
import { getDistrictShapes } from "@/lib/shapes";
import { getStateOfficials } from "@/lib/state";
import { votingInfo } from "@/lib/civic";
import type { LookupResult } from "@/lib/types";

// Addresses arrive in the POST body (never the URL) and are never stored or logged.
export async function POST(request: Request) {
  let body: { address?: unknown; lat?: unknown; lon?: unknown };
  try {
    body = await request.json();
  } catch {
    return error("bad-request", "Please type an address.", 400);
  }

  try {
    let geo;
    let voting: Promise<LookupResult["voting"]> = Promise.resolve(null);
    if (typeof body.lat === "number" && typeof body.lon === "number") {
      geo = await geocodePoint(body.lat, body.lon);
    } else if (typeof body.address === "string" && body.address.trim().length >= 5) {
      const address = body.address.trim().slice(0, 200);
      // Most people in Arkansas leave off the state. Help the geocoder out.
      const withState = /\b(AR|Arkansas)\b/i.test(address) ? address : `${address}, AR`;
      voting = votingInfo(withState);
      geo = await geocodeAddress(withState);
    } else {
      return error("bad-request", "Please type your full street address, city, and ZIP code.", 400);
    }

    const [federal, state, shapes, votingResult] = await Promise.all([
      getFederalOfficials(),
      getStateOfficials(),
      getDistrictShapes(geo.point.lat, geo.point.lon),
      voting,
    ]);

    const result: LookupResult = {
      matchedAddress: geo.matchedAddress,
      point: geo.point,
      districts: geo.districts,
      seats: buildLineup(geo.districts, federal, state),
      shapes,
      voting: votingResult,
      sources: [
        {
          name: "U.S. Census Bureau Geocoder (districts)",
          url: "https://geocoding.geo.census.gov/geocoder/",
          fetchedAt: new Date().toISOString(),
        },
        federal[0].source,
        state[0].source,
      ],
    };
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof LookupError) {
      return error(e.code, e.message, e.code === "upstream" ? 502 : 422);
    }
    // Log the failure type only, never the address.
    console.error("lookup failed:", e instanceof Error ? e.message : "unknown");
    return error(
      "upstream",
      "One of our data sources is not answering right now. Please try again in a minute.",
      502,
    );
  }
}

function error(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}
