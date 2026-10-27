import { cacheLife } from "next/cache";
import type { DistrictShape } from "./types";

const LAYER_LIST_TIMEOUT_MS = 10_000;
const SHAPE_QUERY_TIMEOUT_MS = 15_000;
const SERVICE = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer";

async function getLayerIds() {
  "use cache";
  cacheLife("days");
  const res = await fetch(`${SERVICE}?f=json`, { signal: AbortSignal.timeout(LAYER_LIST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`TIGERweb returned ${res.status}`);
  const { layers } = (await res.json()) as { layers: { id: number; name: string }[] };
  const first = (re: RegExp) => layers.find((l) => re.test(l.name))?.id;
  return {
    congressional: first(/Congressional Districts$/),
    stateSenate: first(/State Legislative Districts - Upper$/),
    stateHouse: first(/State Legislative Districts - Lower$/),
  };
}

async function shapeAt(layer: number, lat: number, lon: number): Promise<DistrictShape | null> {
  const qs = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "NAME",
    returnGeometry: "true",
    outSR: "4326",
    maxAllowableOffset: "0.0005",
    geometryPrecision: "5",
    f: "geojson",
  });
  const res = await fetch(`${SERVICE}/${layer}/query?${qs}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(SHAPE_QUERY_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const f = data?.features?.[0];
  return f?.geometry ? { label: f.properties?.NAME ?? "District", geojson: f.geometry } : null;
}

export async function getDistrictShapes(lat: number, lon: number): Promise<DistrictShape[]> {
  try {
    const ids = await getLayerIds();
    const layers = [ids.congressional, ids.stateSenate, ids.stateHouse].filter(
      (id): id is number => id !== undefined,
    );
    const shapes = await Promise.all(layers.map((id) => shapeAt(id, lat, lon).catch(() => null)));
    return shapes.filter((s): s is DistrictShape => s !== null);
  } catch {
    return [];
  }
}
