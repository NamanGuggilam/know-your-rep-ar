export type OfficeKind = "us-senate" | "us-house" | "state-senate" | "state-house";

export interface ContactAddress {
  label: string;
  lines: string[];
  phone?: string;
  hours?: string;
}

export interface Official {
  id: string;
  name: string;
  office: OfficeKind;
  title: string;
  district?: string;
  party: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  contactFormUrl?: string;
  website?: string;
  officialPageUrl?: string;
  addresses: ContactAddress[];
  source: DataSource;
}

export interface DataSource {
  name: string;
  url: string;
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
  missingNote?: string;
  missingLink?: { label: string; url: string };
}

export interface DistrictShape {
  label: string;
  geojson: GeoJSON.Geometry;
}

import type { VotingInfo } from "./civic";

export interface LookupResult {
  matchedAddress?: string;
  point: { lat: number; lon: number };
  districts: Districts;
  seats: Seat[];
  shapes: DistrictShape[];
  sources: DataSource[];
  voting: VotingInfo | null;
}
