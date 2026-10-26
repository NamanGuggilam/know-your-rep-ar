// AI web scraper for the ballot comparison page.
// Stage 1 reads the candidate's campaign website; stage 2 searches the wider web for topics it doesn't cover,
// keeping only the candidate's own words (news quotes, debates, questionnaires, official sites).
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
import { closeBrowser, ownWords, readPages, type OwnWordsPage } from "../stances/ownwords";

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
const NOT_CAMPAIGN =
  /(ballotpedia|wikipedia|facebook|x\.com|twitter|instagram|youtube|linkedin|tiktok|votesmart|opensecrets|fec\.gov|\.gov\/?|news|times|gazette|kark|thv11|ardemgazette|arktimes|talkbusiness)/i;

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
const BANNED =
  /\b(conservative|liberal|progressive|right-wing|left-wing|far-right|far-left|radical|extreme|maga|woke|republican|democrat(ic)?|libertarian)\b/i;

async function organize(name: string, office: string, pages: OwnWordsPage[]) {
  const block = pages.map((p, i) => `<page number="${i + 1}" url="${p.url}">\n${p.text}\n</page>`).join("\n\n");
  const res = await anthropic().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { format: zodOutputFormat(Output), effort: "medium" },
    messages: [
      {
        role: "user",
        content: `Candidate: ${name}, running for ${office}\n\n<website_text>\n${block}\n</website_text>`,
      },
    ],
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

// ---------- Stage 2: the wider web, for topics the campaign site doesn't cover ----------

// Only places that quote the candidate in their own words. Never opinion pieces, opponents, parties, PACs, or ratings.
const NOT_ALLOWED =
  /(wikipedia|ballotpedia\.org\/(?!.*candidate_connection)|facebook|x\.com|twitter|instagram|tiktok|youtube|ivoterguide|nra|plannedparenthood|gop\.org|democrats\.org|lp\.org|arkansasgop|arkdems|opinion|editorial|column)/i;

const FOUND = z.object({
  found: z.array(
    z.object({
      topic: z.enum(COMPARE_TOPICS),
      url: z.string(),
      sourceLabel: z.string(),
      quote: z.string(),
      summary: z.string(),
    }),
  ),
});

async function searchWeb(name: string, office: string, missing: string[]) {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `${name} is a candidate for ${office} in Arkansas's November 3, 2026 general election.
For these topics, find places on the web where ${name} is quoted in their OWN words: ${missing.join("; ")}.
Allowed: their official government website, nonpartisan candidate questionnaires (Vote411, Ballotpedia Candidate Connection, news-outlet questionnaires), debate coverage, and mainstream news articles that quote them directly.
Not allowed: opinion or editorial pieces, opponents, political party sites, PACs, advocacy ratings, Wikipedia, social media.
Rules: "quote" must be words the candidate said or wrote, copied exactly (in news, only text inside quotation marks attributed to them; never a reporter's paraphrase). "summary" is one neutral sentence starting with "Says". "sourceLabel" is "Outlet, Month Day, Year". Prefer 2025-2026. At most one per topic. Skip topics where nothing qualifies.
Use the same effort for this candidate as you would for any other: at most 8 searches.`,
    },
  ];
  for (let i = 0; i < 4; i++) {
    const res = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 8000,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
      messages,
    });
    if (res.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: res.content });
      continue;
    }
    // Second, tool-free call turns the findings into checked JSON.
    messages.push({ role: "assistant", content: res.content });
    messages.push({
      role: "user",
      content: "Return your findings as JSON now. Include only items that follow every rule.",
    });
    const out = await anthropic().messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { format: zodOutputFormat(FOUND) },
      messages,
    });
    return out.parsed_output?.found ?? [];
  }
  return [];
}

/** Fetch each page ourselves and keep a finding only if its quote is really on that page. */
async function verifyWeb(found: Awaited<ReturnType<typeof searchWeb>>) {
  const kept: Partial<Record<(typeof COMPARE_TOPICS)[number], Position>> = {};
  for (const f of found) {
    if (kept[f.topic] || NOT_ALLOWED.test(f.url) || !/^Says\b/.test(f.summary) || BANNED.test(f.summary)) continue;
    const page = (await readPages([f.url], "campaign")).pages[0];
    if (!page || f.quote.trim().length < 20 || !normalize(page.text).includes(normalize(f.quote))) continue;
    kept[f.topic] = { summary: f.summary.trim(), quote: f.quote.trim(), url: f.url, source: f.sourceLabel.trim() };
  }
  return kept;
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
      // Fill gaps from the wider web, in their own words only.
      const missing = COMPARE_TOPICS.filter((t) => !positions[t]);
      if (missing.length) Object.assign(positions, await verifyWeb(await searchWeb(k.name, k.office, missing)));
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
