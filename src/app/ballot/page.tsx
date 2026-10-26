import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Comparison, UnopposedCard } from "@/components/Comparison";
import { ResultsTabs } from "@/components/ResultsTabs";
import { WhereToVote } from "@/components/WhereToVote";
import { ExtLink } from "@/components/PageIntro";
import { ELECTION, contestsFor, getPositions, type CandidatePositions } from "@/lib/ballot";
import { partyKey } from "@/lib/party";

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
      <div className="card p-6">
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
  const contested = contests.filter((c) => c.candidates.length > 1);
  const unopposed = contests.filter((c) => c.candidates.length === 1);

  return (
    <>
      <p className="text-lg">
        Congressional District <strong>{cd}</strong> · State Senate District <strong>{ss}</strong> · State House
        District <strong>{sh}</strong>
      </p>

      <details className="card mt-6 p-5">
        <summary className="cursor-pointer font-display text-lg font-bold">
          New to this? How your ballot works <span aria-hidden="true">▾</span>
        </summary>
        <ul className="prose-civic mt-3">
          <li>You pick one candidate in each race. You can skip any race you want.</li>
          <li>
            <strong>Statewide races</strong> (like Governor and U.S. Senate) are the same for every Arkansas voter.
          </li>
          <li>
            <strong>District races</strong> (U.S. House, State Senate, State House) depend on where you live.
          </li>
          <li>
            <strong>Unopposed</strong> means only one person is running, so their name is the only choice.
          </li>
          <li>Your real ballot may also have county and city races, plus yes-or-no questions called ballot issues.</li>
        </ul>
      </details>

      <nav aria-label="Races on your ballot" className="mt-6">
        <h2 className="sr-only">Races on your ballot</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contested.map((c) => (
            <li key={c.id}>
              <a
                href={`#sec-${c.id}`}
                className="card flex h-full items-center justify-between gap-3 p-4 text-ink no-underline hover:border-accent"
              >
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold">{c.office}</span>
                  <span className="block text-sm text-ink-muted">{c.candidates.length} candidates</span>
                </span>
                <span className="flex flex-none -space-x-3" aria-hidden="true">
                  {c.candidates.map((k) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={k.id}
                      src={positions[k.id]?.photo?.src ?? "/candidates/placeholder.svg"}
                      alt=""
                      width={40}
                      height={40}
                      className={`size-10 rounded-full border-2 bg-surface-2 object-cover party-ring-${partyKey(k.party)}`}
                    />
                  ))}
                </span>
              </a>
            </li>
          ))}
          {unopposed.length > 0 && (
            <li>
              <a
                href="#unopposed"
                className="card flex h-full flex-col justify-center p-4 text-ink no-underline hover:border-accent"
              >
                <span className="font-display text-lg font-bold">Unopposed races</span>
                <span className="text-sm text-ink-muted">{unopposed.map((c) => c.office).join(", ")}</span>
              </a>
            </li>
          )}
        </ul>
      </nav>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <WhereToVote />
        <section aria-labelledby="how-h" className="card p-5">
          <h2 id="how-h" className="text-2xl font-bold">
            How to read this
          </h2>
          <p className="mt-2">
            Each row is a topic. Each line is what that candidate&apos;s own campaign website says, sorted by AI. Tap
            &ldquo;Their exact words&rdquo; to see the quote. <Link href="/neutral">How we stay fair</Link>
          </p>
        </section>
      </div>

      {missing.length > 0 && (
        <p className="mt-6 border-l-4 border-accent bg-accent-soft p-4">
          <strong>Also on your ballot:</strong> {missing.join("; ")}. We don&apos;t have these candidate lists yet. See
          your official sample ballot on <ExtLink href={VOTERVIEW}>VoterView</ExtLink>.
        </p>
      )}

      {contested.map((c) => (
        <Comparison key={c.id} contest={c} positions={positions} />
      ))}

      {unopposed.length > 0 && (
        <section id="unopposed" aria-labelledby="unopposed-h" className="mt-10 scroll-mt-4">
          <h2 id="unopposed-h" className="text-3xl font-bold">
            Unopposed races
          </h2>
          <p className="mt-1 text-ink-muted">Only one candidate is running for each of these offices.</p>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {unopposed.map((c) => (
              <UnopposedCard key={c.id} contest={c} data={positions[c.candidates[0].id]} />
            ))}
          </ul>
        </section>
      )}

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
      <p className="mt-4 mb-8 max-w-[60ch] text-xl text-ink-muted">
        Every candidate, the same topics, in their own words. We never say who is right.
      </p>
      <ResultsTabs active="ballot" />
      <div>
        <Suspense fallback={<p role="status">Loading your ballot…</p>}>
          <BallotBody searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
