
export const COMPARE_TOPICS = [
  "Jobs and the economy",
  "Taxes and spending",
  "Schools and education",
  "Health care",
  "Public safety",
  "Immigration",
  "Farming and rural life",
  "Energy and the environment",
  "Roads and infrastructure",
  "Elections and government",
] as const;
export type CompareTopic = (typeof COMPARE_TOPICS)[number];

export interface Candidate {
  id: string;
  name: string;
  party: string;
  currentOffice?: string;
}

export interface Contest {
  id: string;
  office: string;
  role: string;
  scope: "statewide" | "congressional" | "state-senate" | "state-house";
  district?: string;
  candidates: Candidate[];
}

export interface Position {
  summary: string;
  quote: string;
  url: string;
  source?: string;
}

export interface CandidatePositions {
  candidateId: string;
  website?: string;
  websiteNote: string;
  generatedAt: string;
  model: string;
  positions: Partial<Record<CompareTopic, Position>>;
  photo?: { src: string; credit: string; sourcePage: string };
}
