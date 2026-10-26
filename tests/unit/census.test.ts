import { describe, expect, it } from "vitest";
import { LookupError, parseGeographies, pickLayer } from "@/lib/census";

// Shape copied from a real Census Geocoder response for a Bentonville address.
const bentonville = {
  "120th Congressional Districts": [{ STATE: "05", BASENAME: "3", GEOID: "0503" }],
  "2026 State Legislative Districts - Upper": [{ STATE: "05", BASENAME: "33", SLDU: "033" }],
  "2026 State Legislative Districts - Lower": [{ STATE: "05", BASENAME: "13", SLDL: "013" }],
  "Unified School Districts": [{ STATE: "05", BASENAME: "Bentonville" }],
};

describe("parseGeographies", () => {
  it("reads all three districts", () => {
    expect(parseGeographies(bentonville)).toEqual({ congressional: "3", stateSenate: "33", stateHouse: "13" });
  });

  it("prefers the newest layer when the Census returns more than one", () => {
    const geos = { ...bentonville, "119th Congressional Districts": [{ STATE: "05", BASENAME: "9" }] };
    expect(parseGeographies(geos).congressional).toBe("3");
    expect(pickLayer(geos, /Congressional Districts$/)?.BASENAME).toBe("3");
  });

  it("falls back to codes when BASENAME is missing", () => {
    const geos = {
      "120th Congressional Districts": [{ STATE: "05", GEOID: "0504" }],
      "2026 State Legislative Districts - Upper": [{ STATE: "05", SLDU: "007" }],
      "2026 State Legislative Districts - Lower": [{ STATE: "05", SLDL: "100" }],
    };
    expect(parseGeographies(geos)).toEqual({ congressional: "4", stateSenate: "7", stateHouse: "100" });
  });

  it("rejects addresses outside Arkansas", () => {
    const dc = { "120th Congressional Districts": [{ STATE: "11", BASENAME: "98" }] };
    expect(() => parseGeographies(dc)).toThrow(LookupError);
  });
});
