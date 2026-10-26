// Shared by server and browser code: no file access here.

/**
 * Every candidate is compared on this same list, in this order.
 * If a candidate says nothing about a topic, we say so. We never fill the gap.
 */
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
  /** The title printed on the ballot, e.g. "State Senator" */
  currentOffice?: string;
}

export interface Contest {
  id: string;
  office: string;
  /** Matches a section on the Who does what page */
  role: string;
  scope: "statewide" | "congressional" | "state-senate" | "state-house";
  district?: string;
  candidates: Candidate[];
}

export interface Position {
  /** AI restatement, always starting with "Says" */
  summary: string;
  /** The candidate's exact words, checked word-for-word by code */
  quote: string;
  url: string;
  /** Where the words came from, when it is not their campaign website (e.g. "Arkansas Advocate, Sept 12, 2026") */
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
