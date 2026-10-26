import { cacheLife } from "next/cache";
import type { ContactAddress, DataSource, Official } from "./types";

const LEGISLATORS_URL =
  "https://unitedstates.github.io/congress-legislators/legislators-current.json";
const OFFICES_URL =
  "https://unitedstates.github.io/congress-legislators/legislators-district-offices.json";
const PHOTO_BASE = "https://unitedstates.github.io/images/congress/225x275";
const SOURCE_PAGE = "https://github.com/unitedstates/congress-legislators";

interface RawTerm {
  type: "sen" | "rep";
  state: string;
  district?: number;
  party?: string;
  phone?: string;
  url?: string;
  contact_form?: string;
  address?: string;
  end: string;
}

interface RawLegislator {
  id: { bioguide: string };
  name: { first: string; last: string; official_full?: string };
  terms: RawTerm[];
}

interface RawOffice {
  address?: string;
  suite?: string;
  building?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  hours?: string;
}

interface RawOffices {
  id: { bioguide: string };
  offices: RawOffice[];
}

export function mapFederal(
  people: RawLegislator[],
  offices: RawOffices[],
  source: DataSource,
): Official[] {
  const officeMap = new Map(offices.map((o) => [o.id.bioguide, o.offices]));
  return people
    .filter((p) => p.terms.at(-1)?.state === "AR")
    .map((p): Official => {
      const t = p.terms.at(-1)!;
      const isSenate = t.type === "sen";
      const addresses: ContactAddress[] = [];
      if (t.address) {
        addresses.push({
          label: "Washington, D.C. office",
          lines: splitDcAddress(t.address),
          phone: t.phone,
        });
      }
      for (const o of officeMap.get(p.id.bioguide) ?? []) {
        addresses.push({
          label: `${o.city ?? "Arkansas"} office`,
          lines: [
            [o.address, o.suite].filter(Boolean).join(", "),
            o.building,
            [o.city, o.state].filter(Boolean).join(", ") + (o.zip ? ` ${o.zip}` : ""),
          ].filter((l): l is string => Boolean(l && l.trim())),
          phone: o.phone,
          hours: o.hours,
        });
      }
      return {
        id: p.id.bioguide,
        name: p.name.official_full ?? `${p.name.first} ${p.name.last}`,
        office: isSenate ? "us-senate" : "us-house",
        title: isSenate ? "U.S. Senator for Arkansas" : "U.S. Representative",
        district: isSenate ? undefined : `Congressional District ${t.district}`,
        party: t.party ?? "Not listed",
        photoUrl: `${PHOTO_BASE}/${p.id.bioguide}.jpg`,
        phone: t.phone,
        contactFormUrl: t.contact_form,
        website: t.url,
        officialPageUrl: t.url,
        addresses,
        source,
      };
    });
}

/** "555 Dirksen Senate Office Building Washington DC 20510" -> two lines */
function splitDcAddress(addr: string) {
  const m = addr.match(/^(.*?)\s+(Washington,? DC.*)$/);
  return m ? [m[1], m[2].replace(/Washington,? DC/, "Washington, DC")] : [addr];
}

export async function getFederalOfficials(): Promise<Official[]> {
  "use cache";
  cacheLife("days");
  const [peopleRes, officesRes] = await Promise.all([
    fetch(LEGISLATORS_URL, { signal: AbortSignal.timeout(20000) }),
    fetch(OFFICES_URL, { signal: AbortSignal.timeout(20000) }),
  ]);
  if (!peopleRes.ok) throw new Error(`congress-legislators returned ${peopleRes.status}`);
  const people: RawLegislator[] = await peopleRes.json();
  const offices: RawOffices[] = officesRes.ok ? await officesRes.json() : [];
  const source: DataSource = {
    name: "congress-legislators (public-domain dataset maintained by the @unitedstates project)",
    url: SOURCE_PAGE,
    fetchedAt: new Date().toISOString(),
  };
  const officials = mapFederal(people, offices, source);
  if (officials.length === 0) throw new Error("No Arkansas members found in congress-legislators");
  return officials;
}
