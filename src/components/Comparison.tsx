import Link from "next/link";
import { COMPARE_TOPICS, type CandidatePositions, type Contest } from "@/lib/ballot";
import { memberSentence, partyKey } from "@/lib/party";
import { PartyBadge } from "./PartyBadge";
import { ExtLink } from "./PageIntro";
import { ResearchLinks } from "./ResearchLinks";

export function CandidatePhoto({ src, name, size = 96 }: { src?: string; name: string; size?: number }) {
  return (
    // Photos are copies saved with credit, so a plain img keeps it simple.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? "/candidates/placeholder.svg"}
      alt={src ? `Photo of ${name}` : ""}
      width={size}
      height={Math.round(size * 1.2)}
      loading="lazy"
      className="flex-none rounded bg-surface-2 object-cover"
      style={{ width: size, height: Math.round(size * 1.2) }}
    />
  );
}

/**
 * Side-by-side comparison for one contested race, in official ballot order.
 * Only topics at least one candidate talks about get a row; the rest are listed in one line.
 */
export function Comparison({
  contest,
  positions,
}: {
  contest: Contest;
  positions: Record<string, CandidatePositions | null>;
}) {
  const headingId = `race-h-${contest.id}`;
  const covered = COMPARE_TOPICS.filter((t) => contest.candidates.some((c) => positions[c.id]?.positions[t]));
  const silent = COMPARE_TOPICS.filter((t) => !covered.includes(t));

  return (
    <section aria-labelledby={headingId} id={`sec-${contest.id}`} className="card mt-8 scroll-mt-4 p-5 sm:p-7">
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
      <p className="mt-1 text-ink-muted">Compare side by side: {contest.candidates.length} candidates, in official ballot order.</p>

      <table className="compare mt-6 w-full border-collapse text-left">
        <caption className="sr-only">
          {contest.office}: where each candidate stands. Columns are candidates, rows are topics.
        </caption>
        <thead>
          <tr>
            <td className="compare-corner" />
            {contest.candidates.map((c) => {
              const data = positions[c.id];
              return (
                <th key={c.id} scope="col" className={`compare-head party-bar-${partyKey(c.party)}`}>
                  <div className="flex items-center gap-3">
                    <CandidatePhoto src={data?.photo?.src} name={c.name} size={64} />
                    <div className="min-w-0">
                      <Link href={`/candidates/${c.id}`} className="block font-display text-xl leading-tight font-bold">
                        {c.name}
                      </Link>
                      <span className="mt-1.5 block">
                        <PartyBadge party={c.party} />
                      </span>
                    </div>
                  </div>
                  {c.currentOffice && (
                    <span className="mt-2 block text-sm font-normal text-ink-muted">Currently: {c.currentOffice}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {covered.map((topic) => (
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
                        <details className="mt-1 text-sm">
                          <summary className="cursor-pointer text-accent underline">Their exact words</summary>
                          <blockquote lang="en" translate="no" className="mt-2 border-l-4 border-line pl-3 text-ink-muted">
                            &ldquo;{p.quote}&rdquo;
                          </blockquote>
                          <p className="mt-1">
                            Source: <ExtLink href={p.url}>{p.source ?? "their campaign website"}</ExtLink>
                          </p>
                        </details>
                      </>
                    ) : (
                      <>
                        <p className="text-ink-muted">
                          {!data ? "Not gathered yet." : "Nothing found in their own words."}
                        </p>
                        <ResearchLinks name={c.name} topic={topic} website={data?.website} className="mt-1" />
                      </>
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
      {silent.length > 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          <strong className="text-ink">No candidate in this race talks about:</strong> {silent.join(", ").toLowerCase()}
          .
        </p>
      )}
    </section>
  );
}

/** One candidate running alone. A short card instead of an empty table. */
export function UnopposedCard({ contest, data }: { contest: Contest; data: CandidatePositions | null }) {
  const c = contest.candidates[0];
  const said = COMPARE_TOPICS.filter((t) => data?.positions[t]);
  return (
    <li id={`unopposed-${contest.id}`} className={`card scroll-mt-4 p-5 party-bar-${partyKey(c.party)}`}>
      <p className="eyebrow">{contest.office}</p>
      <div className="mt-3 flex items-center gap-3">
        <CandidatePhoto src={data?.photo?.src} name={c.name} size={56} />
        <div className="min-w-0">
          <Link href={`/candidates/${c.id}`} className="block font-display text-xl font-bold">
            {c.name}
          </Link>
          <span className="mt-1 block">
            <PartyBadge party={c.party} />
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        {said.length
          ? `Talks about: ${said.join(", ").toLowerCase()}.`
          : data?.website
            ? "We didn't find their own words on our topics."
            : "No campaign website found, and nothing else in their own words."}
      </p>
      <ResearchLinks name={c.name} website={data?.website} className="mt-2" />
      <p className="mt-2 text-sm font-semibold">{memberSentence(c.party)}</p>
    </li>
  );
}
