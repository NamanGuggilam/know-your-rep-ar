import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import ballot from "@/data/ballot-2026.json";
import type { CandidatePositions, Contest } from "./ballot";
import { getAllOfficials } from "./officials";
import { partyName } from "./party";
import { ROLES, STATEWIDE } from "./roles";
import type { StanceFile } from "./stances";

export type ResultKind = "candidate" | "official" | "role";

interface Field {
  label: string;
  text: string;
  weight: number;
}

export interface SearchDoc {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  party?: string;
  photo?: string;
  fields: Field[];
}

export interface SearchHit {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  party?: string;
  photo?: string;
  matches: { label: string; text: string }[];
}

const MAX_MATCHES_SHOWN = 3;
const RACE_QUESTION_CANDIDATE_BOOST = 10;
const TITLE_MATCH_BOOST = 8;
const RACE_QUESTION_PATTERN = /\b(running|run|candidates?|race|ballot|on the ballot|vote for)\b/i;

const SYNONYMS = [
  ["farm", "farming", "farmer", "agriculture", "agricultural", "rural", "crop", "livestock"],
  ["school", "education", "teacher", "student", "college", "university"],
  ["tax", "taxes", "taxation", "revenue"],
  ["gun", "guns", "firearm", "firearms", "ammunition", "second amendment"],
  ["police", "crime", "law enforcement", "public safety", "prison", "correction"],
  ["road", "roads", "highway", "highways", "bridge", "transportation", "infrastructure"],
  ["veteran", "veterans", "military", "national guard"],
  ["health", "medicaid", "medicare", "hospital", "medical"],
  ["vote", "voting", "election", "elections", "ballot"],
  ["veto", "vetoes"],
  ["impeach", "impeachment", "impeaches"],
  ["border", "immigration", "immigrant"],
  ["energy", "oil", "gas", "electric", "environment", "water"],
  ["budget", "spending", "appropriation", "appropriations"],
];

function stem(w: string) {
  return w.length > 4 ? w.replace(/(ies)$/, "y").replace(/(es|s)$/, "") : w;
}

export function expandQuery(q: string): string[][] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => {
      const alts = new Set([w, stem(w)]);
      for (const g of SYNONYMS) if (g.some((s) => s === w || stem(s) === stem(w))) g.forEach((s) => alts.add(s));
      return [...alts];
    });
}
const STOP = new Set(["the", "and", "who", "what", "for", "about", "with", "does", "is", "of", "in", "on", "to", "a", "my", "me", "can", "do"]);

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function startsAtWordBoundary(alternative: string, text: string) {
  return new RegExp(`\\b${escapeRegExp(alternative)}`).test(text);
}

export function search(docs: SearchDoc[], query: string, limit = 40): SearchHit[] {
  const terms = expandQuery(query);
  if (!terms.length) return [];
  const scored: { hit: SearchHit; score: number }[] = [];
  for (const doc of docs) {
    let score = 0;
    const matches: SearchHit["matches"] = [];
    let allFound = true;
    for (const alternatives of terms) {
      let bestWeight = 0;
      let bestField: Field | null = null;
      for (const field of doc.fields) {
        const text = field.text.toLowerCase();
        if (alternatives.some((alt) => startsAtWordBoundary(alt, text)) && field.weight > bestWeight) {
          bestWeight = field.weight;
          bestField = field;
        }
      }
      if (!bestField) {
        allFound = false;
        break;
      }
      score += bestWeight;
      const matchedText = bestField.text;
      if (!matches.some((m) => m.text === matchedText)) matches.push({ label: bestField.label, text: matchedText });
    }
    if (allFound) {
      const { fields: _fields, ...rest } = doc;
      void _fields;
      scored.push({ hit: { ...rest, matches: matches.slice(0, MAX_MATCHES_SHOWN) }, score });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title))
    .slice(0, limit)
    .map((scoredHit) => scoredHit.hit);
}

export function retrieve(docs: SearchDoc[], query: string, limit = 12): SearchDoc[] {
  const terms = expandQuery(query);
  if (!terms.length) return [];
  const aboutRace = RACE_QUESTION_PATTERN.test(query);
  return docs
    .map((doc) => {
      let score = aboutRace && doc.kind === "candidate" ? RACE_QUESTION_CANDIDATE_BOOST : 0;
      for (const alternatives of terms) {
        let bestWeight = 0;
        for (const field of doc.fields) {
          const text = field.text.toLowerCase();
          if (field.weight > bestWeight && alternatives.some((alt) => text.includes(alt))) bestWeight = field.weight;
        }
        score += bestWeight;
        if (alternatives.some((alt) => doc.title.toLowerCase().includes(alt))) score += TITLE_MATCH_BOOST;
      }
      return { doc, score };
    })
    .filter((scoredDoc) => scoredDoc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((scoredDoc) => scoredDoc.doc);
}

async function readJsonDir<T>(dir: string): Promise<T[]> {
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
    return Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(dir, f), "utf8")) as T));
  } catch {
    return [];
  }
}

export async function getSearchDocs(): Promise<SearchDoc[]> {
  "use cache";
  cacheLife("hours");
  const data = path.join(process.cwd(), "src", "data");
  const [officials, stances, positions] = await Promise.all([
    getAllOfficials(),
    readJsonDir<StanceFile>(path.join(data, "stances")),
    readJsonDir<CandidatePositions>(path.join(data, "positions")),
  ]);
  const stanceById = new Map(stances.map((s) => [s.id, s]));
  const posById = new Map(positions.map((p) => [p.candidateId, p]));
  const docs: SearchDoc[] = [];

  for (const c of ballot.contests as Contest[]) {
    for (const k of c.candidates) {
      const pos = posById.get(k.id);
      docs.push({
        kind: "candidate",
        id: k.id,
        title: k.name,
        subtitle: `Candidate for ${c.office}`,
        href: `/candidates/${k.id}`,
        party: k.party,
        photo: pos?.photo?.src,
        fields: [
          { label: "Name", text: k.name, weight: 10 },
          { label: "Running for", text: c.office, weight: 6 },
          { label: "Party", text: partyName(k.party), weight: 5 },
          ...(k.currentOffice ? [{ label: "Currently", text: k.currentOffice, weight: 5 }] : []),
          ...Object.entries(pos?.positions ?? {}).map(([topic, p]) => ({ label: topic, text: p!.summary, weight: 3 })),
        ],
      });
    }
  }

  for (const o of officials) {
    const s = stanceById.get(o.id);
    const bills = s?.topics.flatMap((t) => t.bills) ?? [];
    docs.push({
      kind: "official",
      id: o.id,
      title: o.name,
      subtitle: [o.title, o.district].filter(Boolean).join(" · "),
      href: `/rep/${o.id}`,
      party: o.party,
      photo: o.photoUrl,
      fields: [
        { label: "Name", text: o.name, weight: 10 },
        { label: "Office", text: `${o.title} ${o.office.startsWith("us") ? "Congress federal" : "state legislature lawmaker"}`, weight: 6 },
        ...(o.district ? [{ label: "District", text: o.district, weight: 6 }] : []),
        { label: "Party", text: partyName(o.party), weight: 4 },
        ...(s?.committees ?? []).map((c) => ({ label: "Committee", text: c.role ? `${c.name} (${c.role})` : c.name, weight: 4 })),
        ...(s?.facts ?? []).map((f) => ({ label: f.label, text: f.value, weight: 2 })),
        ...bills.map((b) => ({ label: `Sponsored ${b.id}`, text: b.plain || b.title, weight: 1 })),
      ],
    });
  }

  for (const r of ROLES) {
    docs.push({
      kind: "role",
      id: r.id,
      title: r.name,
      subtitle: `${r.level === "Arkansas" ? "Arkansas government" : "National government"} · ${r.howMany}`,
      href: `/who-does-what#${r.id}`,
      fields: [
        { label: "Office", text: r.name, weight: 10 },
        ...r.powers.map((p) => ({ label: "Power", text: p, weight: 5 })),
        ...r.responsibleFor.map((p) => ({ label: "Responsible for", text: p, weight: 5 })),
      ],
    });
  }
  for (const s of STATEWIDE) {
    docs.push({
      kind: "role",
      id: s.name,
      title: s.name,
      subtitle: "Arkansas government · statewide office",
      href: "/who-does-what#statewide",
      fields: [
        { label: "Office", text: s.name, weight: 10 },
        { label: "Job", text: s.job, weight: 5 },
      ],
    });
  }
  return docs;
}
