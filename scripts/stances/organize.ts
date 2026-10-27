import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { TOPICS, type StanceTopic } from "../../src/lib/stances";
import type { RawBill } from "./records";
import type { OwnWordsPage } from "./ownwords";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const MAX_OUTPUT_TOKENS = 16000;
const MIN_QUOTE_CHARS = 20;
const OTHER_TOPICS: StanceTopic["topic"] = "Other topics";
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

const OrganizedOutput = z.object({
  bills: z.array(z.object({ id: z.string(), topic: z.enum(TOPICS), plain: z.string() })),
  statements: z.array(
    z.object({ topic: z.enum(TOPICS), summary: z.string(), quote: z.string(), page: z.number().int() }),
  ),
});

export function normalize(text: string) {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const BANNED_WORDS = /\b(conservative|liberal|progressive|right-wing|left-wing|far-right|far-left|radical|extreme|maga|woke|republican|democrat(ic)?)\b/i;

export async function organize(
  official: { name: string; title: string },
  pages: OwnWordsPage[],
  bills: RawBill[],
): Promise<{ topics: StanceTopic[]; removed: number; refused: boolean }> {
  const pageBlock = pages.length
    ? pages.map((page, index) => `<page number="${index + 1}" title="${page.title}" url="${page.url}">\n${page.text}\n</page>`).join("\n\n")
    : "(No website text available.)";
  const billBlock = bills.length ? bills.map((bill) => `${bill.id} | ${bill.title}`).join("\n") : "(No bills.)";

  client ??= new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM,
    output_config: { format: zodOutputFormat(OrganizedOutput), effort: "medium" },
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
  const organized = response.parsed_output;
  let removed = 0;
  const billsById = new Map(bills.map((bill) => [bill.id, bill]));
  const topicsByName = new Map<string, StanceTopic>();
  const topicFor = (topic: (typeof TOPICS)[number]) => {
    if (!topicsByName.has(topic)) topicsByName.set(topic, { topic, statements: [], bills: [] });
    return topicsByName.get(topic)!;
  };

  const usedBillIds = new Set<string>();
  for (const sortedBill of organized.bills) {
    const realBill = billsById.get(sortedBill.id);
    if (!realBill || usedBillIds.has(sortedBill.id) || BANNED_WORDS.test(sortedBill.plain)) {
      removed++;
      continue;
    }
    usedBillIds.add(sortedBill.id);
    topicFor(sortedBill.topic).bills.push({ ...realBill, plain: sortedBill.plain.trim() });
  }
  for (const bill of bills) {
    if (!usedBillIds.has(bill.id)) topicFor(OTHER_TOPICS).bills.push({ ...bill, plain: "" });
  }

  for (const statement of organized.statements) {
    const sourcePage = pages[statement.page - 1];
    const passesChecks =
      sourcePage &&
      statement.quote.trim().length >= MIN_QUOTE_CHARS &&
      normalize(sourcePage.text).includes(normalize(statement.quote)) &&
      /^Says\b/.test(statement.summary.trim()) &&
      !BANNED_WORDS.test(statement.summary);
    if (!passesChecks) {
      removed++;
      continue;
    }
    topicFor(statement.topic).statements.push({
      summary: statement.summary.trim(),
      quote: statement.quote.trim(),
      url: sourcePage.url,
    });
  }

  const ordered = TOPICS.map((topic) => topicsByName.get(topic)).filter((topic): topic is StanceTopic => !!topic);
  return { topics: ordered, removed, refused: false };
}
