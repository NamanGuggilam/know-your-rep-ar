import type { LookupResult } from "./types";

const SESSION_KEY = "kyr-lineup";

export type SavedLineup = Pick<LookupResult, "seats" | "districts" | "sources" | "shapes" | "voting">;

export function saveLineup(r: LookupResult) {
  try {
    const { seats, districts, sources, shapes, voting } = r;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ seats, districts, sources, shapes, voting }));
  } catch {
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
  } catch {
    return;
  }
}
