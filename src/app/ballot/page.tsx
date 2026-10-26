import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Comparison } from "@/components/Comparison";
import { WhereToVote } from "@/components/WhereToVote";
import { ExtLink } from "@/components/PageIntro";
import { ELECTION, contestsFor, getPositions, type CandidatePositions } from "@/lib/ballot";

export const metadata: Metadata = { title: "Your ballot" };

const VOTERVIEW = "https://www.voterview.ar-nova.org/voterview";

function electionDate() {
  return new Date(`${ELECTION.date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** District numbers are 1-3 digits. Anything else is ignored. */
function district(v: string | string[] | undefined) {
  return typeof v === "string" && /^\d{1,3}$/.test(v) ? String(Number(v)) : null;
}

async function BallotBody({ searchParams }: { searchParams: PageProps<"/ballot">["searchParams"] }) {
  const sp = await searchParams;
  const cd = district(sp.cd);
  const ss = district(sp.ss);
  const sh = district(sp.sh);

  if (!cd || !ss || !sh) {
    return (
      <div className="panel p-6">
        <p className="text-xl">We need your address to show your ballot.</p>
        <p className="mt-3">
          <Link href="/" className="btn btn-primary">
            Type your address
          </Link>
        </p>
      </div>
    );
  }

  const { contests, missing } = contestsFor({ congressional: cd, stateSenate: ss, stateHouse: sh });
  const ids = contests.flatMap((c) => c.candidates.map((k) => k.id));
  const loaded = await Promise.all(ids.map((id) => getPositions(id)));
  const positions: Record<string, CandidatePositions | null> = Object.fromEntries(ids.map((id, i) => [id, loaded[i]]));
  const anyGathered = loaded.some(Boolean);

  return (
    <>
      <p className="text-lg">
        You live in <strong>Congressional District {cd}</strong>, <strong>State Senate District {ss}</strong>, and{" "}
        <strong>State House District {sh}</strong>.{" "}
        <Link href="/my-reps">See who represents you now →</Link>
      </p>

      <nav aria-label="Races on your ballot" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {contests.map((c) => (
            <li key={c.id}>
              <a href={`#race-${c.id}`} className="btn btn-secondary">
                {c.office}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <WhereToVote />
        <section aria-labelledby="how-h" className="card p-5">
          <h2 id="how-h" className="text-2xl font-bold">
            How this comparison works
          </h2>
          <p className="mt-2">
            {anyGathered
              ? "An AI read each candidate's own campaign website and sorted what they say into the same topics. Every quote is their exact words, checked by our code. If a candidate doesn't talk about a topic, we say so."
              : "We are still gathering each candidate's positions from their own campaign website. Until then, the table shows who is running."}{" "}
            <Link href="/neutral">How we stay fair</Link>
          </p>
        </section>
      </div>

      {missing.length > 0 && (
        <p className="mt-6 border-l-4 border-accent bg-accent-soft p-4">
          <strong>Also on your ballot:</strong> {missing.join("; ")}. We don&apos;t have these candidate lists yet. See
          your official sample ballot on <ExtLink href={VOTERVIEW}>VoterView</ExtLink>. Your ballot may also have county
          and city races and ballot issues.
        </p>
      )}

      {contests.map((c) => (
        <Comparison key={c.id} contest={c} positions={positions} />
      ))}

      <p className="mt-10 text-sm text-ink-muted">
        Candidates, parties, and ballot order: <ExtLink href={ELECTION.source.url}>{ELECTION.source.name}</ExtLink>,
        checked {ELECTION.checkedAt}. Always check your own official sample ballot.
      </p>
    </>
  );
}

export default function BallotPage({ searchParams }: PageProps<"/ballot">) {
  return (
    <>
      <p className="eyebrow">
        {ELECTION.name} · {electionDate()}
      </p>
      <h1 className="mt-2 text-5xl leading-tight font-bold">Your ballot, side by side</h1>
      <p className="mt-4 max-w-[60ch] text-xl text-ink-muted">
        Every candidate, the same topics, in their own words. We never say who is right.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p role="status">Loading your ballot…</p>}>
          <BallotBody searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
