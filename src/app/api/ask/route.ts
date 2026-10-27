import { ask } from "@/lib/ask";
import ballot from "@/data/ballot-2026.json";
import { getSearchDocs } from "@/lib/search";

const BALLOT_OFFICES = new Set(ballot.contests.map((c) => c.office));

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestTimesByVisitor = new Map<string, number[]>();

function isRateLimited(visitorKey: string) {
  const now = Date.now();
  const recent = (requestTimesByVisitor.get(visitorKey) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestTimesByVisitor.set(visitorKey, recent);
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: Request) {
  let question = "";
  let race: string | undefined;
  try {
    const body = await request.json();
    question = String(body.question ?? "")
      .trim()
      .slice(0, 300);
    if (typeof body.race === "string" && BALLOT_OFFICES.has(body.race)) race = body.race;
  } catch {}
  if (question.length < 3) return Response.json({ error: "Please type a question." }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(ip)) {
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
