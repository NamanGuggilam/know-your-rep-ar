import { ask } from "@/lib/ask";
import ballot from "@/data/ballot-2026.json";
import { getSearchDocs } from "@/lib/search";

const RACES = new Set(ballot.contests.map((c) => c.office));

// Simple per-visitor limit so the AI helper can't run up a bill. Best effort: resets when the server restarts.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

// Questions are not stored or logged.
export async function POST(request: Request) {
  let question = "";
  let race: string | undefined;
  try {
    const body = await request.json();
    question = String(body.question ?? "")
      .trim()
      .slice(0, 300);
    // Only real races on the ballot can be used as context.
    if (typeof body.race === "string" && RACES.has(body.race)) race = body.race;
  } catch {}
  if (question.length < 3) return Response.json({ error: "Please type a question." }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) {
    return Response.json(
      { error: "You've asked a lot of questions. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }
  try {
    return Response.json(await ask(question, await getSearchDocs(), race), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("ask failed:", e instanceof Error ? e.message : "unknown");
    return Response.json(
      { error: "The question helper isn't working right now. Please try search instead." },
      { status: 502 },
    );
  }
}
