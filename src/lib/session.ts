import type { LookupResult } from "./types";

// We keep the lineup for this browser tab only, so it survives moving between pages.
// The typed address and the exact location are never saved: only districts, officials,
// and the district outlines (which cover thousands of homes).
const SESSION_KEY = "kyr-lineup";

export type SavedLineup = Pick<LookupResult, "seats" | "districts" | "sources" | "shapes">;

export function saveLineup(r: LookupResult) {
  try {
    const { seats, districts, sources, shapes } = r;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ seats, districts, sources, shapes }));
  } catch {
    // Storage blocked: the results page will ask the person to look up again.
  }
}

export function loadLineup(): SavedLineup | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLineup() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}
