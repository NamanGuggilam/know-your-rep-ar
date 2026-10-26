// AI web scraper for the ballot comparison page.
// For each candidate on src/data/ballot-2026.json:
//   1. Find their campaign website: src/data/campaign-sites.json (checked by a person) wins;
//      otherwise Claude searches the web for it, and code confirms the page names the candidate.
//   2. Read the site's issues pages (robots.txt respected; blocked sites are skipped, never bypassed).
//   3. Claude sorts what the candidate says into the same fixed topics for everyone.
//   4. Code checks every quote word-for-word against the page, and drops anything that fails.
//
//   npx tsx scripts/positions/build.ts                 # candidates not yet built
//   npx tsx scripts/positions/build.ts --force --only tom-cotton,hallie-shoffner
//
// Needs ANTHROPIC_API_KEY (.env.local wins over the shell). Review the JSON before publishing.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import { z } from "zod";
import ballot from "../../src/data/ballot-2026.json";
import { COMPARE_TOPICS, type CandidatePositions, type Contest, type Position } from "../../src/lib/ballot";
import { normalize } from "../stances/organize";
import { closeBrowser, ownWords, type OwnWordsPage } from "../stances/ownwords";

try {
  Object.assign(process.env, parseEnv(readFileSync(".env.local", "utf8")));
} catch {
  // No .env.local: use the shell environment.
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const OUT = path.join(process.cwd(), "src", "data", "positions");
const SITES_FILE = path.join(process.cwd(), "src", "data", "campaign-sites.json");
const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

// Sites that are never a candidate's own campaign website.
const NOT_CAMPAIGN = /(ballotpedia|wikipedia|facebook|x\.com|twitter|instagram|youtube|linkedin|tiktok|votesmart|opensecrets|fec\.gov|\.gov\/?|news|times|gazette|kark|thv11|ardemgazette|arktimes|talkbusiness)/i;

async function findWebsite(name: string, office: string, party: string): Promise<string | null> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Find the official campaign website of ${name}, the ${party} candidate for ${office} in Arkansas in the November 3, 2026 general election.
Rules: It must be the candidate's own campaign site (often has "Donate", "Volunteer", or "Issues"). Not a news site, not Ballotpedia or Wikipedia, not social media, and not a government (.gov) office site.
End your answer with exactly one line: "WEBSITE: <url>" or "WEBSITE: NONE" if you cannot find one with confidence.`,
    },
  ];
  for (let i = 0; i < 4; i++) {
    const res = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 4000,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
      messages,
    });
    if (res.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: res.content });
      continue;
    }
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");
    const m = text.match(/WEBSITE:\s*(\S+)/i);
    if (!m || /^none$/i.test(m[1])) return null;
    const url = m[1].replace(/[)>.,]+$/, "");
    return /^https?:\/\//.test(url) && !NOT_CAMPAIGN.test(new URL(url).hostname) ? url : null;
  }
  return null;
}

/** The home page must mention the candidate's last name, or we don't trust the match. */
async function confirmSite(url: string, name: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { "user-agent": "Mozilla/5.0" } });
    const html = (await res.text()).toLowerCase();
    return res.ok && html.includes(name.split(" ").at(-1)!.toLowerCase());
  } catch {
    return false;
  }
}

const SYSTEM = `You compare election candidates for a strictly nonpartisan civic app used by people with limited formal education.
You receive text from ONE candidate's own campaign website. For each topic in the allowed list, find what the candidate says they want to do about it.
Rules:
- Use ONLY the website text provided. Never add outside facts or anything you know about the person.
- Strictly neutral: never say or imply a position is good, bad, extreme, moderate, popular, or controversial. No persuasive or emotional words. No ideology labels (conservative, liberal, progressive, right-wing, left-wing, MAGA, woke, and similar). Do not mention parties.
- "summary": one sentence, 6th-8th grade reading level, third person, starting with "Says", describing how they say they would handle the topic. Example: "Says they would cut the state income tax."
- "quote": an exact passage copied character-for-character from the page that supports the summary (one or two sentences, at most 45 words). Do not change, shorten inside, or join separate passages.
- "page": the number of the page the quote came from.
- At most ONE entry per topic: pick the clearest, most specific statement. If the site says nothing about a topic, leave that topic out. Do not stretch a vague slogan to fit a topic.`;

const Output = z.object({
  positions: z.array(
    z.object({ topic: z.enum(COMPARE_TOPICS), summary: z.string(), quote: z.string(), page: z.number().int() }),
  ),
});
const BANNED = /\b(conservative|liberal|progressive|right-wing|left-wing|far-right|far-left|radical|extreme|maga|woke|republican|democrat(ic)?|libertarian)\b/i;

async function organize(name: string, office: string, pages: OwnWordsPage[]) {
  const block = pages.map((p, i) => `<page number="${i + 1}" url="${p.url}">\n${p.text}\n</page>`).join("\n\n");
  const res = await anthropic().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { format: zodOutputFormat(Output), effort: "medium" },
    messages: [{ role: "user", content: `Candidate: ${name}, running for ${office}\n\n<website_text>\n${block}\n</website_text>` }],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("model declined");
  const kept: Partial<Record<(typeof COMPARE_TOPICS)[number], Position>> = {};
  let removed = 0;
  for (const p of res.parsed_output.positions) {
    const page = pages[p.page - 1];
    const ok =
      page &&
      !kept[p.topic] &&
      p.quote.trim().length >= 20 &&
      normalize(page.text).includes(normalize(p.quote)) &&
      /^Says\b/.test(p.summary.trim()) &&
      !BANNED.test(p.summary);
    if (!ok) {
      removed++;
      continue;
    }
    kept[p.topic] = { summary: p.summary.trim(), quote: p.quote.trim(), url: page.url };
  }
  return { positions: kept, removed };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const curated: Record<string, string> = existsSync(SITES_FILE) ? JSON.parse(readFileSync(SITES_FILE, "utf8")) : {};
  const todo = (ballot.contests as Contest[])
    .flatMap((c) => c.candidates.map((k) => ({ ...k, office: c.office })))
    .filter((k) => (only ? only.includes(k.id) : true))
    .filter((k) => force || !existsSync(path.join(OUT, `${k.id}.json`)));
  console.log(`Gathering positions for ${todo.length} candidates with ${MODEL}...`);

  for (const k of todo) {
    try {
      let website: string | null = curated[k.id] ?? null;
      if (!website) {
        const found = await findWebsite(k.name, k.office, k.party);
        website = found && (await confirmSite(found, k.name)) ? found : null;
      }
      const words = website
        ? await ownWords(website, "campaign", true)
        : { status: "none" as const, note: "We could not find a campaign website for this candidate.", pages: [] };
      const { positions, removed } = words.pages.length
        ? await organize(k.name, k.office, words.pages)
        : { positions: {}, removed: 0 };
      const file: CandidatePositions = {
        candidateId: k.id,
        website: website ?? undefined,
        websiteNote: words.note,
        generatedAt: new Date().toISOString(),
        model: MODEL,
        positions,
      };
      await writeFile(path.join(OUT, `${k.id}.json`), JSON.stringify(file, null, 2) + "\n");
      console.log(
        `ok   ${k.name}: site ${website ?? "none"} (${words.status}), ${Object.keys(positions).length} topics, removed ${removed}`,
      );
    } catch (e) {
      console.log(`FAIL ${k.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  await closeBrowser();
}

main();
