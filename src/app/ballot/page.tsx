import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CandidatePicker } from "@/components/CandidatePicker";
import { Comparison, UnopposedCard } from "@/components/Comparison";
import { RaceAsk } from "@/components/RaceAsk";
import { RaceTabs } from "@/components/RaceTabs";
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

const DISTRICT_NUMBER_PATTERN = /^\d{1,3}$/;

function parseDistrictNumber(value: string | string[] | undefined) {
  return typeof value === "string" && DISTRICT_NUMBER_PATTERN.test(value) ? String(Number(value)) : null;
}

async function BallotBody({ searchParams }: { searchParams: PageProps<"/ballot">["searchParams"] }) {
  const sp = await searchParams;
  const cd = parseDistrictNumber(sp.cd);
  const ss = parseDistrictNumber(sp.ss);
  const sh = parseDistrictNumber(sp.sh);

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

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <WhereToVote />
        <section aria-labelledby="how-h" className="card p-5">
          <h2 id="how-h" className="text-2xl font-bold">
            How to read this
          </h2>
          <p className="mt-2">
            Each row is a topic. Each line is what that candidate has said in their own words, on their campaign website
            or quoted in news, debates, and questionnaires, sorted by AI. Tap &ldquo;Their exact words&rdquo; to see the
            quote and where it came from. <Link href="/neutral">How we stay fair</Link>
          </p>
        </section>
      </div>

      {missing.length > 0 && (
        <p className="mt-6 border-l-4 border-accent bg-accent-soft p-4">
          <strong>Also on your ballot:</strong> {missing.join("; ")}. We don&apos;t have these candidate lists yet. See
          your official sample ballot on <ExtLink href={VOTERVIEW}>VoterView</ExtLink>.
        </p>
      )}

      <h2 className="mt-10 text-3xl font-bold">Pick a race</h2>
      <p className="mt-1 mb-4 text-ink-muted">Tap a race to compare its candidates.</p>
      <RaceTabs
        tabs={[
          ...contested.map((c) => ({
            id: c.id,
            title: c.office,
            subtitle: `${c.candidates.length} candidates`,
            faces: c.candidates.map((k) => ({
              src: positions[k.id]?.photo?.src ?? "/candidates/placeholder.svg",
              ring: partyKey(k.party),
            })),
          })),
          ...(unopposed.length
            ? [
                {
                  id: "unopposed",
                  title: "Unopposed races",
                  subtitle: unopposed.map((c) => c.office).join(", "),
                  faces: [],
                },
              ]
            : []),
        ]}
        panels={{
          ...Object.fromEntries(
            contested.map((c) => [
              c.id,
              <div key={c.id}>
                <CandidatePicker
                  contest={c}
                  positions={Object.fromEntries(c.candidates.map((k) => [k.id, positions[k.id]]))}
                />
                <Comparison contest={c} positions={positions} />
                <RaceAsk race={c.office} names={c.candidates.map((k) => k.name)} />
              </div>,
            ]),
          ),
          unopposed: (
            <section aria-labelledby="unopposed-h" className="card mt-8 p-5 sm:p-7">
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
          ),
        }}
      />

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
