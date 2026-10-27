import { describe, expect, it } from "vitest";
import { mapFederal } from "@/lib/federal";
import { buildLineup } from "@/lib/lineup";
import { mapStateRow, parseOpenStatesCsv } from "@/lib/state";
import type { DataSource } from "@/lib/types";

const src: DataSource = { name: "test", url: "https://example.org", fetchedAt: "2026-10-25T00:00:00Z" };

const people = [
  { id: { bioguide: "S1" }, name: { first: "A", last: "Senator", official_full: "Ann Senator" }, terms: [{ type: "sen" as const, state: "AR", party: "Independent", phone: "202-224-0000", contact_form: "https://x.senate.gov/contact", address: "1 Russell Senate Office Building Washington DC 20510", end: "2029-01-03" }] },
  { id: { bioguide: "S2" }, name: { first: "B", last: "Second" }, terms: [{ type: "sen" as const, state: "AR", party: "Democrat", end: "2027-01-03" }] },
  { id: { bioguide: "H3" }, name: { first: "C", last: "House" }, terms: [{ type: "rep" as const, state: "AR", district: 3, party: "Republican", url: "https://h.house.gov", end: "2027-01-03" }] },
  { id: { bioguide: "TX1" }, name: { first: "D", last: "Texan" }, terms: [{ type: "rep" as const, state: "TX", district: 3, party: "Republican", end: "2027-01-03" }] },
];

const csv = `id,name,current_party,current_district,current_chamber,email,image,links,capitol_address,capitol_voice,district_address,district_voice
ocd-person/aaa,Pat Rep,Republican,13,lower,pat@arkansashouse.org,https://img/1.jpg,"https://arkleg.state.ar.us/Legislators/Detail?member=Rep;https://arkleg.state.ar.us/Legislators/Detail?member=Rep&ddBienniumSession=2023%2F2023R",,,"4106 SW Main St., Bentonville, AR 72713",479-555-0100
ocd-person/bbb,Sam Sen,Democrat,33,upper,sam@senate.ar.gov,,"https://arkleg.state.ar.us/Legislators/Detail?member=Sen",,,,
`;

describe("mapFederal", () => {
  const fed = mapFederal(people, [{ id: { bioguide: "H3" }, offices: [{ address: "1 Main", city: "Rogers", state: "AR", zip: "72758", phone: "479-555-0000" }] }], src);

  it("keeps only Arkansas members", () => {
    expect(fed.map((o) => o.id)).toEqual(["S1", "S2", "H3"]);
  });

  it("maps party as plain text and keeps contact details", () => {
    const s1 = fed.find((o) => o.id === "S1")!;
    expect(s1.party).toBe("Independent");
    expect(s1.contactFormUrl).toBe("https://x.senate.gov/contact");
    expect(s1.addresses[0].lines).toEqual(["1 Russell Senate Office Building", "Washington, DC 20510"]);
  });

  it("adds district offices", () => {
    const h = fed.find((o) => o.id === "H3")!;
    expect(h.district).toBe("Congressional District 3");
    expect(h.addresses.map((a) => a.label)).toContain("Rogers office");
  });
});

describe("Open States mapping", () => {
  const rows = parseOpenStatesCsv(csv);
  const state = rows.map((r) => mapStateRow(r, src));

  it("parses quoted CSV fields", () => {
    expect(rows).toHaveLength(2);
    expect(state[0].addresses[0].lines).toEqual(["4106 SW Main St.", "Bentonville, AR 72713"]);
  });

  it("uses the current arkleg profile, not an old session", () => {
    expect(state[0].officialPageUrl).toBe("https://arkleg.state.ar.us/Legislators/Detail?member=Rep");
  });

  it("strips the ocd-person prefix from ids", () => {
    expect(state[0].id).toBe("aaa");
  });

  it("does not invent a phone number when none is listed", () => {
    expect(state[1].phone).toBeUndefined();
    expect(state[1].photoUrl).toBeUndefined();
  });
});

describe("buildLineup", () => {
  const fed = mapFederal(people, [], src);
  const state = parseOpenStatesCsv(csv).map((r) => mapStateRow(r, src));

  it("returns 5 seats with the right people", () => {
    const seats = buildLineup({ congressional: "3", stateSenate: "33", stateHouse: "13" }, fed, state);
    expect(seats.map((s) => s.official?.name)).toEqual(["Ann Senator", "B Second", "C House", "Sam Sen", "Pat Rep"]);
  });

  it("shows an honest empty seat instead of a placeholder person", () => {
    const seats = buildLineup({ congressional: "3", stateSenate: "33", stateHouse: "99" }, fed, state);
    const house = seats.find((s) => s.office === "state-house")!;
    expect(house.official).toBeNull();
    expect(house.missingNote).toMatch(/State House District 99/);
    expect(house.missingLink?.url).toMatch(/arkleg\.state\.ar\.us/);
  });

  it("does not match district 3 to district 33", () => {
    const seats = buildLineup({ congressional: "3", stateSenate: "3", stateHouse: "13" }, fed, state);
    expect(seats.find((s) => s.office === "state-senate")!.official).toBeNull();
  });
});

describe("Arkansas Legislature links", () => {
  it("picks the row whose name matches when a district has two rows", async () => {
    const { withArklegLinks } = await import("@/lib/state");
    const [pat] = parseOpenStatesCsv(csv).map((r) => mapStateRow(r, src));
    const links = new Map([
      [
        "lower-13",
        [
          { url: "https://arkleg.state.ar.us/Legislators/Detail?member=Old", name: "Former Member" },
          { url: "https://arkleg.state.ar.us/Legislators/Detail?member=P.+Rep", name: "Pat Rep" },
        ],
      ],
    ]);
    expect(withArklegLinks([pat], links)[0].officialPageUrl).toBe("https://arkleg.state.ar.us/Legislators/Detail?member=P.+Rep");
  });

  it("keeps the original link when no name matches", async () => {
    const { withArklegLinks } = await import("@/lib/state");
    const [pat] = parseOpenStatesCsv(csv).map((r) => mapStateRow(r, src));
    const links = new Map([["lower-13", [{ url: "https://x/other", name: "Someone Else" }]]]);
    expect(withArklegLinks([pat], links)[0].officialPageUrl).toBe(pat.officialPageUrl);
  });
});
