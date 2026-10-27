import Link from "next/link";
import { COMPARE_TOPICS, type Candidate, type CandidatePositions, type CompareTopic, type Contest } from "@/lib/topics";
import { memberSentence, partyKey } from "@/lib/party";
import { PartyBadge } from "./PartyBadge";
import { ExtLink } from "./PageIntro";
import { ResearchLinks } from "./ResearchLinks";

const PHOTO_HEIGHT_RATIO = 1.2;

export function CandidatePhoto({ src, name, size = 96 }: { src?: string; name: string; size?: number }) {
  const height = Math.round(size * PHOTO_HEIGHT_RATIO);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? "/candidates/placeholder.svg"}
      alt={src ? `Photo of ${name}` : ""}
      width={size}
      height={height}
      loading="lazy"
      className="flex-none rounded bg-surface-2 object-cover"
      style={{ width: size, height }}
    />
  );
}

function ComparisonCell({
  candidate,
  topic,
  data,
}: {
  candidate: Candidate;
  topic: CompareTopic;
  data: CandidatePositions | null | undefined;
}) {
  const position = data?.positions[topic];
  return (
    <td className="compare-cell">
      <span className="compare-cand-label">{candidate.name}</span>
      {position ? (
        <>
          <p>{position.summary}</p>
          <details className="mt-1 text-sm">
            <summary className="cursor-pointer text-accent underline">Their exact words</summary>
            <blockquote lang="en" translate="no" className="mt-2 border-l-4 border-line pl-3 text-ink-muted">
              &ldquo;{position.quote}&rdquo;
            </blockquote>
            <p className="mt-1">
              Source: <ExtLink href={position.url}>{position.source ?? "their campaign website"}</ExtLink>
            </p>
          </details>
        </>
      ) : (
        <>
          <p className="text-ink-muted">{data ? "Nothing found in their own words." : "Not gathered yet."}</p>
          <ResearchLinks name={candidate.name} topic={topic} website={data?.website} className="mt-1" />
        </>
      )}
    </td>
  );
}

function CandidateColumnHeader({
  candidate,
  data,
}: {
  candidate: Candidate;
  data: CandidatePositions | null | undefined;
}) {
  return (
    <th scope="col" className={`compare-head party-bar-${partyKey(candidate.party)}`}>
      <div className="flex items-center gap-3">
        <CandidatePhoto src={data?.photo?.src} name={candidate.name} size={64} />
        <div className="min-w-0">
          <Link href={`/candidates/${candidate.id}`} className="block font-display text-xl leading-tight font-bold">
            {candidate.name}
          </Link>
          <span className="mt-1.5 block">
            <PartyBadge party={candidate.party} />
          </span>
        </div>
      </div>
      {candidate.currentOffice && (
        <span className="mt-2 block text-sm font-normal text-ink-muted">Currently: {candidate.currentOffice}</span>
      )}
    </th>
  );
}

export function Comparison({
  contest,
  positions,
}: {
  contest: Contest;
  positions: Record<string, CandidatePositions | null>;
}) {
  const headingId = `race-h-${contest.id}`;
  const topicsSomeoneCovers = COMPARE_TOPICS.filter((topic) =>
    contest.candidates.some((candidate) => positions[candidate.id]?.positions[topic]),
  );
  const topicsNobodyCovers = COMPARE_TOPICS.filter((topic) => !topicsSomeoneCovers.includes(topic));

  return (
    <section aria-labelledby={headingId} id={`sec-${contest.id}`} className="card mt-8 scroll-mt-4 p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-3xl font-bold">
          {contest.office}
        </h2>
        <Link href={`/who-does-what#${contest.role}`} className="font-semibold">
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
            {contest.candidates.map((candidate) => (
              <CandidateColumnHeader key={candidate.id} candidate={candidate} data={positions[candidate.id]} />
            ))}
          </tr>
        </thead>
        <tbody>
          {topicsSomeoneCovers.map((topic) => (
            <tr key={topic}>
              <th scope="row" className="compare-topic">
                {topic}
              </th>
              {contest.candidates.map((candidate) => (
                <ComparisonCell key={candidate.id} candidate={candidate} topic={topic} data={positions[candidate.id]} />
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="compare-topic">
              Party
            </th>
            {contest.candidates.map((candidate) => (
              <td key={candidate.id} className="compare-cell">
                <span className="compare-cand-label">{candidate.name}</span>
                <p className="font-semibold">{memberSentence(candidate.party)}</p>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
      {topicsNobodyCovers.length > 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          <strong className="text-ink">No candidate in this race talks about:</strong>{" "}
          {topicsNobodyCovers.join(", ").toLowerCase()}.
        </p>
      )}
    </section>
  );
}

function unopposedSummary(topicsSpokenAbout: string[], data: CandidatePositions | null) {
  if (topicsSpokenAbout.length) return `Talks about: ${topicsSpokenAbout.join(", ").toLowerCase()}.`;
  if (data?.website) return "We didn't find their own words on our topics.";
  return "No campaign website found, and nothing else in their own words.";
}

export function UnopposedCard({ contest, data }: { contest: Contest; data: CandidatePositions | null }) {
  const candidate = contest.candidates[0];
  const topicsSpokenAbout = COMPARE_TOPICS.filter((topic) => data?.positions[topic]);
  return (
    <li id={`unopposed-${contest.id}`} className={`card scroll-mt-4 p-5 party-bar-${partyKey(candidate.party)}`}>
      <p className="eyebrow">{contest.office}</p>
      <div className="mt-3 flex items-center gap-3">
        <CandidatePhoto src={data?.photo?.src} name={candidate.name} size={56} />
        <div className="min-w-0">
          <Link href={`/candidates/${candidate.id}`} className="block font-display text-xl font-bold">
            {candidate.name}
          </Link>
          <span className="mt-1 block">
            <PartyBadge party={candidate.party} />
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-muted">{unopposedSummary(topicsSpokenAbout, data)}</p>
      <ResearchLinks name={candidate.name} website={data?.website} className="mt-2" />
      <p className="mt-2 text-sm font-semibold">{memberSentence(candidate.party)}</p>
    </li>
  );
}
