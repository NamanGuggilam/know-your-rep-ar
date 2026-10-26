import type { Metadata } from "next";
import { Suspense } from "react";
import { PartyBadge } from "@/components/PartyBadge";
import { ResultsRefresh } from "@/components/ResultsRefresh";
import { getGeneralResults, RESULTS_SITE, SOS_RESULTS, type ResultContest } from "@/lib/results";
import { formatUpdated } from "@/lib/format";

export const metadata: Metadata = { title: "Live election results" };

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

function Contest({ c }: { c: ResultContest }) {
  const anyVotes = c.totalVotes > 0;
  return (
    <section aria-labelledby={`r-${c.id}`} className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`r-${c.id}`} className="text-xl font-bold">
          {c.name}
        </h3>
        <p className="text-sm text-ink-muted">
          {c.precinctsReporting.toLocaleString()} of {c.totalPrecincts.toLocaleString()} precincts reporting
        </p>
      </div>
      {/* At very large text sizes the table can scroll sideways inside its own box, not the whole page. */}
      <div className="mt-3 overflow-x-auto" role="region" aria-label={`Votes for ${c.name}`} tabIndex={0}>
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Votes for {c.name}</caption>
          <thead>
            <tr className="border-b border-line-soft text-sm text-ink-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">
                {c.group === "Ballot issues" ? "Choice" : "Candidate"}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">
                Votes
              </th>
              <th scope="col" className="w-2/5 py-2 font-semibold">
                Percent
              </th>
            </tr>
          </thead>
          <tbody>
            {c.choices.map((ch) => (
              <tr key={ch.name} className="border-b border-line-soft align-middle">
                <th scope="row" className="py-3 pr-3 font-semibold">
                  <span className="block">{ch.name}</span>
                  {ch.party && (
                    <span className="mt-1 block">
                      <PartyBadge party={ch.party} />
                    </span>
                  )}
                </th>
                <td className="py-3 pr-3 text-right tabular-nums">{ch.votes.toLocaleString()}</td>
                <td className="py-3">
                  <span className="flex items-center gap-2">
                    <span className="h-3 flex-1 rounded-sm bg-surface-2" aria-hidden="true">
                      <span className="block h-3 rounded-sm bg-accent" style={{ width: `${ch.percent}%` }} />
                    </span>
                    <span className="w-12 text-right tabular-nums">{ch.percent}%</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!anyVotes && <p className="mt-2 text-sm text-ink-muted">No votes reported yet.</p>}
    </section>
  );
}

async function ResultsBody() {
  const r = await getGeneralResults();
  if (!r) {
    return (
      <div className="card p-6">
        <p className="text-lg font-semibold">We can&apos;t load results right now.</p>
        <p className="mt-2">
          See the official results on the{" "}
          <a href={RESULTS_SITE} {...ext}>
            Arkansas election results site<span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </div>
    );
  }
  const counting = r.precinctsReporting > 0 || r.ballotsCast > 0;
  const groups = ["Federal", "Statewide", "Ballot issues"] as const;
  const groupTitle = {
    Federal: "Federal races",
    Statewide: "Statewide races",
    "Ballot issues": "Statewide ballot issues",
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm font-semibold text-ink-muted">Status</p>
          <p className="mt-1 text-lg font-bold">
            {r.isOfficial
              ? "Official (certified)"
              : counting
                ? "Counting: unofficial results"
                : "Polls have not closed"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-semibold text-ink-muted">Precincts reporting</p>
          <p className="mt-1 text-lg font-bold">
            {r.precinctsReporting.toLocaleString()} of {r.totalPrecincts.toLocaleString()}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-semibold text-ink-muted">Last update from the state</p>
          <p className="mt-1 text-lg font-bold">{formatUpdated(r.lastUpdated)}</p>
        </div>
      </div>

      {!counting && (
        <p className="mt-4 border-l-4 border-accent bg-accent-soft p-4">
          Results start coming in after polls close at <strong>7:30 p.m.</strong> on Election Day. Early and absentee
          votes are usually reported first. All results stay <strong>unofficial</strong> until counties certify them.
        </p>
      )}

      <div className="mt-6">
        <ResultsRefresh auto={!r.isOfficial} />
      </div>

      {groups.map((g) => {
        const list = r.contests.filter((c) => c.group === g);
        if (!list.length) return null;
        return (
          <section key={g} aria-labelledby={`g-${g}`} className="mt-10">
            <h2 id={`g-${g}`} className="border-b border-line-soft pb-2 text-2xl font-bold">
              {groupTitle[g]}
            </h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {list.map((c) => (
                <Contest key={c.id} c={c} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="mt-10 text-sm text-ink-muted">
        Source: official results reported by Arkansas counties through the{" "}
        <a href={SOS_RESULTS} {...ext}>
          Arkansas Secretary of State<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        (
        <a href={RESULTS_SITE} {...ext}>
          election results site<span className="sr-only"> (opens in a new tab)</span>
        </a>
        ). County, city, legislative, and school races are on the official site. We show results exactly as reported and
        never project winners.
      </p>
    </>
  );
}

export default function ResultsPage() {
  return (
    <>
      <p className="eyebrow">2026 General Election</p>
      <h1 className="mt-2 text-4xl leading-tight font-bold sm:text-5xl">Live election results</h1>
      <p className="mt-4 mb-8 max-w-[60ch] text-xl text-ink-muted">
        Vote counts for federal and statewide races and ballot issues, straight from the official state results.
      </p>
      <Suspense fallback={<p role="status">Loading results…</p>}>
        <ResultsBody />
      </Suspense>
    </>
  );
}
