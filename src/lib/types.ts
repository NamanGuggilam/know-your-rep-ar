export type OfficeKind = "us-senate" | "us-house" | "state-senate" | "state-house";

export interface ContactAddress {
  label: string;
  lines: string[];
  phone?: string;
  hours?: string;
}

export interface Official {
  /** URL-safe id: bioguide id for Congress, Open States uuid for the legislature. */
  id: string;
  name: string;
  office: OfficeKind;
  /** e.g. "U.S. Senator for Arkansas" */
  title: string;
  /** e.g. "District 3", undefined for statewide offices */
  district?: string;
  party: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  contactFormUrl?: string;
  website?: string;
  /** The official legislature page for this person. Ground truth for contact info. */
  officialPageUrl?: string;
  addresses: ContactAddress[];
  source: DataSource;
}

export interface DataSource {
  name: string;
  url: string;
  /** ISO timestamp of when we last fetched this dataset */
  fetchedAt: string;
}

export interface Districts {
  congressional: string;
  stateSenate: string;
  stateHouse: string;
}

export interface Seat {
  office: OfficeKind;
  district?: string;
  official: Official | null;
  /** Shown when official is null (vacancy or data gap) */
  missingNote?: string;
  missingLink?: { label: string; url: string };
}

export interface DistrictShape {
  label: string;
  geojson: GeoJSON.Geometry;
}

export interface LookupResult {
  matchedAddress?: string;
  point: { lat: number; lon: number };
  districts: Districts;
  seats: Seat[];
  shapes: DistrictShape[];
  sources: DataSource[];
}
