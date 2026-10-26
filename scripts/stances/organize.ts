// Uses Claude to sort an official's own words and sponsored bills into a fixed list of topics.
// The AI only sorts and restates. Code then checks its work:
//   - every quote must appear word-for-word on the page it came from
//   - every bill id must be a real bill from the official record
// Anything that fails a check is thrown away.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { TOPICS, type StanceTopic } from "../../src/lib/stances";
import type { RawBill } from "./records";
import type { OwnWordsPage } from "./ownwords";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
let client: Anthropic | null = null;

export const SYSTEM = `You organize public records about Arkansas elected officials for a strictly nonpartisan civic app. Many readers have limited formal education or use screen readers.

You receive two kinds of material about ONE official:
1. Text from the issue pages of the official's own government website (may be empty).
2. A list of bills the official was the main sponsor of, with each bill's official title.

Your only job is to SORT and RESTATE this material. Rules:
- Use ONLY the material provided. Never add outside facts, news, ratings, or anything you know about the person.
- Be strictly neutral. Never say or imply that a position or bill is good, bad, extreme, moderate, popular, or controversial. Never describe motives. Never use persuasive or emotional words. Never use ideology labels (conservative, liberal, progressive, right-wing, left-wing, MAGA, woke, and similar). Never mention political parties.
- Write at a 6th-8th grade reading level, in short sentences with common words.
- Topics: put every item in exactly one topic from the allowed list. Resolutions that honor or remember a person, group, or event go in "Honors and ceremonies".

For EACH bill: write "plain", one sentence (at most 20 words) that restates what the official title says the bill does. Base it only on the title. Start with a verb, like "Changes...", "Creates...", "Sets money for...". If the title does not make clear what the bill does, write "The title does not make clear what this bill does."

For the website text: write "statements" for the positions the official states. Each statement has:
- "summary": one sentence in third person that starts with "Says", for example "Says they want to lower the cost of child care." Report what they say they believe, want, or did. Do not judge it.
- "quote": an exact passage copied character-for-character from the page text that supports the summary (one or two sentences, at most 45 words). Do not change, fix, shorten inside, or join separate passages.
- "page": the number of the page the quote came from.
Give at most 3 statements per topic, choosing the clearest ones. Skip biography, event announcements, and lists of past press releases. If the website text is empty or states no positions, return an empty statements list.`;

const Output = z.object({
  bills: z.array(z.object({ id: z.string(), topic: z.enum(TOPICS), plain: z.string() })),
  statements: z.array(
    z.object({ topic: z.enum(TOPICS), summary: z.string(), quote: z.string(), page: z.number().int() }),
  ),
});

/** Compare text ignoring spacing, curly quotes, and dash styles. */
export function normalize(s: string) {
  return s
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const BANNED = /\b(conservative|liberal|progressive|right-wing|left-wing|far-right|far-left|radical|extreme|maga|woke|republican|democrat(ic)?)\b/i;

export async function organize(
  official: { name: string; title: string },
  pages: OwnWordsPage[],
  bills: RawBill[],
): Promise<{ topics: StanceTopic[]; removed: number; refused: boolean }> {
  const pageBlock = pages.length
    ? pages.map((p, i) => `<page number="${i + 1}" title="${p.title}" url="${p.url}">\n${p.text}\n</page>`).join("\n\n")
    : "(No website text available.)";
  const billBlock = bills.length ? bills.map((b) => `${b.id} | ${b.title}`).join("\n") : "(No bills.)";

  client ??= new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { format: zodOutputFormat(Output), effort: "medium" },
    messages: [
      {
        role: "user",
        content: `Official: ${official.name}, ${official.title}\n\n<website_text>\n${pageBlock}\n</website_text>\n\n<sponsored_bills>\n${billBlock}\n</sponsored_bills>`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { topics: [], removed: 0, refused: true };
  }
  const out = response.parsed_output;
  let removed = 0;
  const byId = new Map(bills.map((b) => [b.id, b]));
  const topics = new Map<string, StanceTopic>();
  const topicFor = (t: (typeof TOPICS)[number]) => {
    if (!topics.has(t)) topics.set(t, { topic: t, statements: [], bills: [] });
    return topics.get(t)!;
  };

  const usedBills = new Set<string>();
  for (const b of out.bills) {
    const real = byId.get(b.id);
    if (!real || usedBills.has(b.id) || BANNED.test(b.plain)) {
      removed++;
      continue;
    }
    usedBills.add(b.id);
    topicFor(b.topic).bills.push({ ...real, plain: b.plain.trim() });
  }
  // Any real bill the AI skipped still gets listed, with its official title only.
  for (const b of bills) {
    if (!usedBills.has(b.id)) topicFor("Other topics").bills.push({ ...b, plain: "" });
  }

  for (const s of out.statements) {
    const page = pages[s.page - 1];
    const ok =
      page &&
      s.quote.trim().length >= 20 &&
      normalize(page.text).includes(normalize(s.quote)) &&
      /^Says\b/.test(s.summary.trim()) &&
      !BANNED.test(s.summary);
    if (!ok) {
      removed++;
      continue;
    }
    topicFor(s.topic).statements.push({ summary: s.summary.trim(), quote: s.quote.trim(), url: page.url });
  }

  const ordered = TOPICS.map((t) => topics.get(t)).filter((t): t is StanceTopic => !!t);
  return { topics: ordered, removed, refused: false };
}
