import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PartyBadge } from "@/components/PartyBadge";
import { ExtLink } from "@/components/PageIntro";
import { ResearchLinks } from "@/components/ResearchLinks";
import ballot from "@/data/ballot-2026.json";
import { COMPARE_TOPICS, ELECTION, getPositions, type Contest } from "@/lib/ballot";
import { formatUpdated } from "@/lib/format";
import { memberSentence, partyKey } from "@/lib/party";

const CONTESTS = ballot.contests as Contest[];

function find(id: string) {
  for (const c of CONTESTS) {
    const k = c.candidates.find((x) => x.id === id);
    if (k) return { contest: c, candidate: k };
  }
  return null;
}

export function generateStaticParams() {
  return CONTESTS.flatMap((c) => c.candidates.map((k) => ({ id: k.id })));
}

export async function generateMetadata({ params }: PageProps<"/candidates/[id]">): Promise<Metadata> {
  const f = find((await params).id);
  return { title: f ? `${f.candidate.name}, candidate for ${f.contest.office}` : "Candidate not found" };
}

export default async function CandidatePage({ params }: PageProps<"/candidates/[id]">) {
  const f = find((await params).id);
  if (!f) notFound();
  const { contest, candidate: c } = f;
  const data = await getPositions(c.id);
  const others = contest.candidates.filter((x) => x.id !== c.id);

  return (
    <article>
      <p className="eyebrow">
        {ELECTION.name} · Candidate for {contest.office}
      </p>
      <div className={`card mt-4 flex flex-wrap gap-6 p-6 party-bar-${partyKey(c.party)}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data?.photo?.src ?? "/candidates/placeholder.svg"}
          alt={data?.photo ? `Photo of ${c.name}` : ""}
          width={150}
          height={180}
          className="h-[180px] w-[150px] rounded bg-surface-2 object-cover"
        />
        <div className="min-w-0">
          <h1 className="text-5xl leading-tight font-bold">{c.name}</h1>
          <p className="mt-3">
            <PartyBadge party={c.party} />
          </p>
          {c.currentOffice && <p className="mt-2 text-lg">Currently: {c.currentOffice}</p>}
          {data?.website && (
            <p className="mt-2">
              <ExtLink href={data.website}>Campaign website</ExtLink>
            </p>
          )}
          {data?.photo && (
            <p className="mt-2 text-sm text-ink-muted">
              Photo: <ExtLink href={data.photo.sourcePage}>{data.photo.credit}</ExtLink>
            </p>
          )}
        </div>
      </div>

      <h2 className="mt-10 text-3xl font-bold">Where they stand</h2>
      <p className="mt-2 max-w-[65ch] text-ink-muted">
        {data
          ? "From their campaign website first, then other public places where they are quoted in their own words (like news interviews, debates, and candidate questionnaires). Each line was sorted by AI, and every quote was checked word-for-word against its source."
          : "We have not gathered this candidate's positions yet."}
      </p>
      <dl className="mt-6 grid gap-4">
        {COMPARE_TOPICS.map((t) => {
          const p = data?.positions[t];
          return (
            <div key={t} className="card p-5">
              <dt className="font-display text-xl font-bold">{t}</dt>
              <dd className="mt-2">
                {p ? (
                  <>
                    <p>{p.summary}</p>
                    <blockquote lang="en" translate="no" className="mt-2 border-l-4 border-line pl-3 text-ink-muted">
                      &ldquo;{p.quote}&rdquo;
                    </blockquote>
                    <p className="mt-1 text-sm">
                      Source: <ExtLink href={p.url}>{p.source ?? "their campaign website"}</ExtLink>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-ink-muted italic">
                      {!data ? "Not gathered yet." : "Nothing found in their own words."}
                    </p>
                    <ResearchLinks name={c.name} topic={t} website={data?.website} className="mt-1" />
                  </>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-8 text-lg font-semibold">{memberSentence(c.party)}</p>

      {others.length > 0 && (
        <p className="mt-6">
          Also running for {contest.office}:{" "}
          {others.map((o, i) => (
            <span key={o.id}>
              {i > 0 && ", "}
              <Link href={`/candidates/${o.id}`}>{o.name}</Link>
            </span>
          ))}
          .
        </p>
      )}
      <p className="mt-2">
        <Link href={`/who-does-what#${contest.role === "statewide" ? "statewide" : contest.role}`}>
          What does the {contest.office} do?
        </Link>
      </p>
      {data && <p className="mt-8 text-sm text-ink-muted">Gathered {formatUpdated(data.generatedAt)}.</p>}
    </article>
  );
}
