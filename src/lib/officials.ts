import { getFederalOfficials } from "./federal";
import { getStateOfficials } from "./state";
import type { Official } from "./types";

export async function getAllOfficials(): Promise<Official[]> {
  const [federal, state] = await Promise.all([getFederalOfficials(), getStateOfficials()]);
  return [...federal, ...state];
}

export async function getOfficialById(id: string): Promise<Official | undefined> {
  return (await getAllOfficials()).find((o) => o.id === id);
}
