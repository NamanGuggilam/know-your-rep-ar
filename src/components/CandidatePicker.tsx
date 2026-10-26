"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { COMPARE_TOPICS, type CandidatePositions, type Contest } from "@/lib/topics";
import { memberSentence, partyKey } from "@/lib/party";
import { PartyBadge } from "./PartyBadge";
import { ResearchLinks } from "./ResearchLinks";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * One card per candidate, in ballot order. Pick one to read everything they have said,
 * topic by topic. Every candidate's profile has the same sections in the same order.
 */
export function CandidatePicker({
  contest,
  positions,
}: {
  contest: Contest;
  positions: Record<string, CandidatePositions | null>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const base = useId();

  return (
    <section aria-labelledby={`${base}-h`} className="mt-6">
      <h3 id={`${base}-h`} className="text-2xl font-bold">
        The candidates
      </h3>
      <p className="mt-1 text-ink-muted">Select a candidate to see where they stand on each topic.</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contest.candidates.map((c) => {
          const data = positions[c.id];
          const count = COMPARE_TOPICS.filter((t) => data?.positions[t]).length;
          const isOpen = open === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${base}-${c.id}`}
                onClick={() => setOpen(isOpen ? null : c.id)}
                className={`card flex h-full w-full items-center gap-3 border-t-4 p-4 text-left party-topbar-${partyKey(c.party)} ${
                  isOpen ? "bg-accent-soft outline-2 outline-accent" : "hover:bg-surface-2"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data?.photo?.src ?? "/candidates/placeholder.svg"}
                  alt=""
                  width={56}
                  height={68}
                  className="h-[68px] w-14 flex-none rounded bg-surface-2 object-cover"
                />
                <span className="min-w-0">
                  <span className="block font-display text-lg leading-tight font-bold">{c.name}</span>
                  <span className="mt-1 block">
                    <PartyBadge party={c.party} />
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {count} of {COMPARE_TOPICS.length} topics · {isOpen ? "Hide" : "Show"} profile
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {contest.candidates.map((c) => {
        const data = positions[c.id];
        return (
          <div
            key={c.id}
            id={`${base}-${c.id}`}
            hidden={open !== c.id}
            className={`card mt-4 border-t-4 p-5 sm:p-6 party-topbar-${partyKey(c.party)}`}
          >
            <div className="flex flex-wrap items-start gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data?.photo?.src ?? "/candidates/placeholder.svg"}
                alt={data?.photo ? `Photo of ${c.name}` : ""}
                width={110}
                height={132}
                className="h-[132px] w-[110px] rounded bg-surface-2 object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-display text-3xl font-bold">{c.name}</h4>
                <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-[max-content_1fr]">
                  <dt className="font-semibold text-ink-muted">Running for</dt>
                  <dd>{contest.office}</dd>
                  <dt className="font-semibold text-ink-muted">Party</dt>
                  <dd>
                    <PartyBadge party={c.party} />
                  </dd>
                  {c.currentOffice && (
                    <>
                      <dt className="font-semibold text-ink-muted">Currently</dt>
                      <dd>{c.currentOffice}</dd>
                    </>
                  )}
                  <dt className="font-semibold text-ink-muted">Campaign website</dt>
                  <dd>
                    {data?.website ? (
                      <a href={data.website} {...ext}>
                        {new URL(data.website).hostname.replace(/^www\./, "")}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      "None found"
                    )}
                  </dd>
                </dl>
              </div>
            </div>

            <h5 className="mt-6 border-b border-line-soft pb-2 font-display text-xl font-bold">Where they stand</h5>
            <dl className="divide-y divide-line-soft">
              {COMPARE_TOPICS.map((t) => {
                const p = data?.positions[t];
                return (
                  <div key={t} className="grid gap-1 py-4 md:grid-cols-[14rem_1fr] md:gap-6">
                    <dt className="font-bold">{t}</dt>
                    <dd>
                      {p ? (
                        <>
                          <p>{p.summary}</p>
                          <blockquote lang="en" translate="no" className="mt-2 border-l-4 border-line-soft pl-3 text-ink-muted">
                            &ldquo;{p.quote}&rdquo;
                          </blockquote>
                          <p className="mt-1 text-sm">
                            Source:{" "}
                            <a href={p.url} {...ext}>
                              {p.source ?? "their campaign website"}
                              <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-ink-muted">Nothing found in their own words.</p>
                          <ResearchLinks name={c.name} topic={t} website={data?.website} className="mt-1" />
                        </>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-4 font-semibold">{memberSentence(c.party)}</p>
            <p className="mt-2 text-sm">
              <Link href={`/candidates/${c.id}`}>Open {c.name}&apos;s full page</Link>
            </p>
          </div>
        );
      })}
    </section>
  );
}
