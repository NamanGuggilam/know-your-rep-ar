import { describe, expect, it } from "vitest";
import { contestsFor } from "@/lib/ballot";
import { mapPlaces } from "@/lib/civic";
import { memberSentence, partyKey, partyName } from "@/lib/party";

describe("party helpers", () => {
  it("maps parties to the three color groups", () => {
    expect(partyKey("Republican")).toBe("r");
    expect(partyKey("Democratic")).toBe("d");
    expect(partyKey("Democrat")).toBe("d");
    expect(partyKey("Libertarian")).toBe("o");
    expect(partyKey("Independent")).toBe("o");
  });
  it("writes the closing sentence for each candidate", () => {
    expect(memberSentence("Democratic")).toBe("Member of the Democratic Party.");
    expect(memberSentence("Republican")).toBe("Member of the Republican Party.");
    expect(memberSentence("Libertarian")).toBe("Member of the Libertarian Party.");
    expect(memberSentence("Independent")).toBe("Running as independent, not as a member of a party.");
    expect(partyName("Not listed")).toBe("No party listed");
  });
});

describe("contestsFor", () => {
  it("includes statewide races for everyone and only the matching district", () => {
    const { contests, missing } = contestsFor({ congressional: "2", stateSenate: "14", stateHouse: "74" });
    const ids = contests.map((c) => c.id);
    expect(ids).toContain("governor");
    expect(ids).toContain("us-house-2");
    expect(missing.some((m) => m.startsWith("State House, District 74"))).toBe(true);
  });
  it("does not show another district's House race", () => {
    const { contests, missing } = contestsFor({ congressional: "3", stateSenate: "33", stateHouse: "13" });
    expect(contests.map((c) => c.id)).not.toContain("us-house-2");
    expect(missing).toContain("U.S. House, District 3");
  });
  it("keeps official ballot order", () => {
    const senate = contestsFor({ congressional: "3", stateSenate: "1", stateHouse: "1" }).contests.find((c) => c.id === "us-senate")!;
    expect(senate.candidates.map((c) => c.name)).toEqual(["Hallie Shoffner", "Tom Cotton", "Jeff Wadlin"]);
  });
});

describe("mapPlaces", () => {
  it("formats Civic API addresses", () => {
    expect(
      mapPlaces([
        { address: { locationName: "West Side Church", line1: "2715 W 7th St", city: "Little Rock", state: "AR", zip: "72205" }, pollingHours: "7:30 AM - 7:30 PM" },
        { address: {} },
      ]),
    ).toEqual([
      { name: "West Side Church", address: "2715 W 7th St, Little Rock, AR 72205", hours: "7:30 AM - 7:30 PM", startDate: undefined, endDate: undefined },
    ]);
  });
});
