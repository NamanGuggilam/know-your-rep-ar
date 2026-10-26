import Link from "next/link";
import { COMPARE_TOPICS, type CandidatePositions, type Contest } from "@/lib/ballot";
import { memberSentence, partyKey } from "@/lib/party";
import { PartyBadge } from "./PartyBadge";
import { ExtLink } from "./PageIntro";

/**
 * Side-by-side comparison for one race. Candidates appear in official ballot order.
 * Every candidate gets the same rows. On phones each topic stacks into its own block.
 */
export function Comparison({
  contest,
  positions,
}: {
  contest: Contest;
  positions: Record<string, CandidatePositions | null>;
}) {
  const n = contest.candidates.length;
  const headingId = `race-${contest.id}`;

  return (
    <section aria-labelledby={headingId} className="panel mt-10 p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-3xl font-bold">
          {contest.office}
        </h2>
        <Link
          href={`/who-does-what#${contest.role === "statewide" ? "statewide" : contest.role}`}
          className="font-semibold"
        >
          What does this office do?
        </Link>
      </div>
      <p className="mt-1 text-ink-muted">
        {n === 1
          ? "One candidate is running for this office (unopposed)."
          : `${n} candidates, listed in the same order as the official ballot.`}
      </p>

      <table className="compare mt-6 w-full border-collapse text-left">
        <caption className="sr-only">
          {contest.office}: where each candidate stands, by topic. Columns are candidates, rows are topics.
        </caption>
        <thead>
          <tr>
            <td className="compare-corner" />
            {contest.candidates.map((c) => {
              const site = positions[c.id]?.website;
              return (
                <th key={c.id} scope="col" className={`compare-head party-bar-${partyKey(c.party)}`}>
                  {/* Photos are copies saved with credit, so a plain img keeps it simple. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={positions[c.id]?.photo?.src ?? "/candidates/placeholder.svg"}
                    alt={positions[c.id]?.photo ? `Photo of ${c.name}` : ""}
                    width={96}
                    height={116}
                    loading="lazy"
                    className="mb-3 h-[116px] w-24 rounded bg-surface-2 object-cover"
                  />
                  <Link href={`/candidates/${c.id}`} className="block font-display text-xl leading-tight font-bold">
                    {c.name}
                  </Link>
                  <span className="mt-2 block">
                    <PartyBadge party={c.party} />
                  </span>
                  {c.currentOffice && (
                    <span className="mt-2 block text-sm font-normal text-ink-muted">Currently: {c.currentOffice}</span>
                  )}
                  {positions[c.id]?.photo && (
                    <span className="mt-2 block text-xs font-normal text-ink-muted">
                      Photo: {positions[c.id]!.photo!.credit}
                    </span>
                  )}
                  {site && (
                    <span className="mt-2 block text-sm font-normal">
                      <ExtLink href={site}>Campaign website</ExtLink>
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {COMPARE_TOPICS.map((topic) => (
            <tr key={topic}>
              <th scope="row" className="compare-topic">
                {topic}
              </th>
              {contest.candidates.map((c) => {
                const data = positions[c.id];
                const p = data?.positions[topic];
                return (
                  <td key={c.id} className="compare-cell">
                    <span className="compare-cand-label">{c.name}</span>
                    {p ? (
                      <>
                        <p>{p.summary}</p>
                        <blockquote className="mt-2 border-l-4 border-line pl-3 text-sm text-ink-muted">
                          &ldquo;{p.quote}&rdquo;
                        </blockquote>
                        <p className="mt-1 text-sm">
                          <ExtLink href={p.url}>Source</ExtLink>
                        </p>
                      </>
                    ) : (
                      <p className="text-ink-muted italic">
                        {!data
                          ? "Not gathered yet."
                          : data.website
                            ? "Not stated on their campaign website."
                            : "No campaign website found."}
                      </p>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="compare-topic">
              Party
            </th>
            {contest.candidates.map((c) => (
              <td key={c.id} className="compare-cell">
                <span className="compare-cand-label">{c.name}</span>
                <p className="font-semibold">{memberSentence(c.party)}</p>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
