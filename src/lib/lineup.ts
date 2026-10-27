import type { Districts, Official, OfficeKind, Seat } from "./types";

const OFFICIAL_LISTS: Record<OfficeKind, { label: string; url: string }> = {
  "us-senate": {
    label: "Official list of U.S. Senators (senate.gov)",
    url: "https://www.senate.gov/senators/senators-contact.htm",
  },
  "us-house": {
    label: "Official list of U.S. Representatives (house.gov)",
    url: "https://www.house.gov/representatives",
  },
  "state-senate": {
    label: "Official list of Arkansas State Senators (arkleg.state.ar.us)",
    url: "https://www.arkleg.state.ar.us/Legislators/List?chamber=Senate",
  },
  "state-house": {
    label: "Official list of Arkansas State Representatives (arkleg.state.ar.us)",
    url: "https://www.arkleg.state.ar.us/Legislators/List?chamber=House",
  },
};

function districtNumber(o: Official) {
  return o.district?.match(/(\d+)$/)?.[1];
}

function seat(office: OfficeKind, district: string | undefined, official: Official | undefined): Seat {
  if (official) return { office, district, official };
  const where = district ?? "this seat";
  return {
    office,
    district,
    official: null,
    missingNote: `We could not find a current member for ${where}. The seat may be empty right now, or our data source may be behind.`,
    missingLink: OFFICIAL_LISTS[office],
  };
}

export function buildLineup(districts: Districts, federal: Official[], state: Official[]): Seat[] {
  const senators = federal.filter((o) => o.office === "us-senate");
  const find = (list: Official[], office: OfficeKind, n: string) =>
    list.find((o) => o.office === office && districtNumber(o) === n);

  return [
    seat("us-senate", undefined, senators[0]),
    seat("us-senate", undefined, senators[1]),
    seat(
      "us-house",
      `Congressional District ${districts.congressional}`,
      find(federal, "us-house", districts.congressional),
    ),
    seat(
      "state-senate",
      `State Senate District ${districts.stateSenate}`,
      find(state, "state-senate", districts.stateSenate),
    ),
    seat(
      "state-house",
      `State House District ${districts.stateHouse}`,
      find(state, "state-house", districts.stateHouse),
    ),
  ];
}
