"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  COMPARE_TOPICS,
  type Candidate,
  type CandidatePositions,
  type CompareTopic,
  type Contest,
  type Position,
} from "@/lib/topics";
import { memberSentence, partyKey } from "@/lib/party";
import { ExtLink } from "./PageIntro";
import { PartyBadge } from "./PartyBadge";
import { ResearchLinks } from "./ResearchLinks";

const PLACEHOLDER_PHOTO = "/candidates/placeholder.svg";

function websiteHostname(website: string) {
  return new URL(website).hostname.replace(/^www\./, "");
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="font-semibold text-ink-muted">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

function CandidateTile({
  candidate,
  data,
  isOpen,
  panelId,
  onToggle,
}: {
  candidate: Candidate;
  data: CandidatePositions | null | undefined;
  isOpen: boolean;
  panelId: string;
  onToggle: () => void;
}) {
  const topicsCovered = COMPARE_TOPICS.filter((topic) => data?.positions[topic]).length;
  const stateClasses = isOpen ? "bg-accent-soft outline-2 outline-accent" : "hover:bg-surface-2";

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={panelId}
      onClick={onToggle}
      className={`card flex h-full w-full items-center gap-3 border-t-4 p-4 text-left party-topbar-${partyKey(candidate.party)} ${stateClasses}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data?.photo?.src ?? PLACEHOLDER_PHOTO}
        alt=""
        width={56}
        height={68}
        className="h-[68px] w-14 flex-none rounded bg-surface-2 object-cover"
      />
      <span className="min-w-0">
        <span className="block font-display text-lg leading-tight font-bold">{candidate.name}</span>
        <span className="mt-1 block">
          <PartyBadge party={candidate.party} />
        </span>
        <span className="mt-1 block text-sm text-ink-muted">
          {topicsCovered} of {COMPARE_TOPICS.length} topics · {isOpen ? "Hide" : "Show"} profile
        </span>
      </span>
    </button>
  );
}

function TopicPosition({
  candidate,
  topic,
  position,
  website,
}: {
  candidate: Candidate;
  topic: CompareTopic;
  position: Position | undefined;
  website: string | undefined;
}) {
  if (!position) {
    return (
      <>
        <p className="text-ink-muted">Nothing found in their own words.</p>
        <ResearchLinks name={candidate.name} topic={topic} website={website} className="mt-1" />
      </>
    );
  }
  return (
    <>
      <p>{position.summary}</p>
      <blockquote lang="en" translate="no" className="mt-2 border-l-4 border-line-soft pl-3 text-ink-muted">
        &ldquo;{position.quote}&rdquo;
      </blockquote>
      <p className="mt-1 text-sm">
        Source:{" "}
        <ExtLink href={position.url}>{position.source ?? "their campaign website"}</ExtLink>
      </p>
    </>
  );
}

function CandidateProfile({
  id,
  candidate,
  office,
  data,
  hidden,
}: {
  id: string;
  candidate: Candidate;
  office: string;
  data: CandidatePositions | null | undefined;
  hidden: boolean;
}) {
  return (
    <div
      id={id}
      hidden={hidden}
      className={`card mt-4 border-t-4 p-5 sm:p-6 party-topbar-${partyKey(candidate.party)}`}
    >
      <div className="flex flex-wrap items-start gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data?.photo?.src ?? PLACEHOLDER_PHOTO}
          alt={data?.photo ? `Photo of ${candidate.name}` : ""}
          width={110}
          height={132}
          className="h-[132px] w-[110px] rounded bg-surface-2 object-cover"
        />
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-3xl font-bold">{candidate.name}</h4>
          <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-[max-content_1fr]">
            <Fact label="Running for">{office}</Fact>
            <Fact label="Party">
              <PartyBadge party={candidate.party} />
            </Fact>
            {candidate.currentOffice && <Fact label="Currently">{candidate.currentOffice}</Fact>}
            <Fact label="Campaign website">
              {data?.website ? (
                <ExtLink href={data.website}>{websiteHostname(data.website)}</ExtLink>
              ) : (
                "None found"
              )}
            </Fact>
          </dl>
        </div>
      </div>

      <h5 className="mt-6 border-b border-line-soft pb-2 font-display text-xl font-bold">Where they stand</h5>
      <dl className="divide-y divide-line-soft">
        {COMPARE_TOPICS.map((topic) => (
          <div key={topic} className="grid gap-1 py-4 md:grid-cols-[14rem_1fr] md:gap-6">
            <dt className="font-bold">{topic}</dt>
            <dd>
              <TopicPosition
                candidate={candidate}
                topic={topic}
                position={data?.positions[topic]}
                website={data?.website}
              />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 font-semibold">{memberSentence(candidate.party)}</p>
      <p className="mt-2 text-sm">
        <Link href={`/candidates/${candidate.id}`}>Open {candidate.name}&apos;s full page</Link>
      </p>
    </div>
  );
}

export function CandidatePicker({
  contest,
  positions,
}: {
  contest: Contest;
  positions: Record<string, CandidatePositions | null>;
}) {
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);
  const idPrefix = useId();
  const panelIdFor = (candidateId: string) => `${idPrefix}-${candidateId}`;

  return (
    <section aria-labelledby={`${idPrefix}-h`} className="mt-6">
      <h3 id={`${idPrefix}-h`} className="text-2xl font-bold">
        The candidates
      </h3>
      <p className="mt-1 text-ink-muted">Select a candidate to see where they stand on each topic.</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contest.candidates.map((candidate) => {
          const isOpen = openCandidateId === candidate.id;
          return (
            <li key={candidate.id}>
              <CandidateTile
                candidate={candidate}
                data={positions[candidate.id]}
                isOpen={isOpen}
                panelId={panelIdFor(candidate.id)}
                onToggle={() => setOpenCandidateId(isOpen ? null : candidate.id)}
              />
            </li>
          );
        })}
      </ul>

      {contest.candidates.map((candidate) => (
        <CandidateProfile
          key={candidate.id}
          id={panelIdFor(candidate.id)}
          candidate={candidate}
          office={contest.office}
          data={positions[candidate.id]}
          hidden={openCandidateId !== candidate.id}
        />
      ))}
    </section>
  );
}
