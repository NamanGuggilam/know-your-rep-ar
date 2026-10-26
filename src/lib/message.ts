import { lastName } from "./format";
import { OFFICES } from "./offices";
import type { Official } from "./types";

export interface MessageInput {
  issue: string;
  why: string;
  ask: string;
  name: string;
  town: string;
}

/** Builds a short, respectful message. Uses only what the person typed: no opinions are added. */
export function buildMessage(o: Pick<Official, "name" | "office">, m: MessageInput) {
  const greeting = `Dear ${OFFICES[o.office].honorific} ${lastName(o.name)},`;
  const intro = [
    m.name.trim() ? `My name is ${m.name.trim()}` : "I am writing to you",
    m.town.trim() ? `${m.name.trim() ? ", and I" : ". I"} live in ${m.town.trim()}` : "",
  ].join("");
  const lines = [
    greeting,
    "",
    `${intro}.${m.issue.trim() ? ` I am writing about ${stripEnd(m.issue)}.` : ""}`,
  ];
  if (m.why.trim()) lines.push("", ensureEnd(m.why));
  if (m.ask.trim()) lines.push("", ensureEnd(m.ask));
  lines.push("", "Thank you for your time and for reading my message.", "", "Sincerely,", m.name.trim() || "[Your name]");
  if (m.town.trim()) lines.push(m.town.trim());
  return lines.join("\n");
}

export function buildSubject(m: MessageInput) {
  const issue = stripEnd(m.issue);
  return issue ? `A message from a constituent about ${issue}` : "A message from a constituent";
}

function stripEnd(s: string) {
  return s.trim().replace(/[.!?]+$/, "");
}

function ensureEnd(s: string) {
  const t = s.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}
