"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { VotingInfo } from "@/lib/civic";
import { loadLineup } from "@/lib/session";
import { PinIcon } from "./icons";

const VOTERVIEW = "https://www.voterview.ar-nova.org/voterview";

function mapLink(address: string) {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
}

/** Polling place and early voting sites for the address typed this visit, when we have them. */
export function WhereToVote() {
  const [voting, setVoting] = useState<VotingInfo | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoting(loadLineup()?.voting ?? null);
  }, []);

  return (
    <section aria-labelledby="where-h" className="card p-5">
      <h2 id="where-h" className="text-2xl font-bold">
        Where to vote
      </h2>
      {voting && voting.pollingPlaces.length > 0 ? (
        <>
          <h3 className="mt-3 font-bold">On Election Day</h3>
          <ul className="mt-1 grid gap-2">
            {voting.pollingPlaces.slice(0, 2).map((p) => (
              <li key={p.address}>
                {p.name && <span className="block font-semibold">{p.name}</span>}
                <a href={mapLink(p.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                  <PinIcon size={18} />
                  {p.address}
                  <span className="sr-only"> (opens a map in a new tab)</span>
                </a>
                {p.hours && <span className="block text-ink-muted">{p.hours}</span>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2">
          Polls are open 7:30 a.m. to 7:30 p.m. on Election Day. Find your polling place on{" "}
          <a href={VOTERVIEW} target="_blank" rel="noopener noreferrer">
            VoterView<span className="sr-only"> (opens in a new tab)</span>
          </a>
          , the official Arkansas voter lookup.
        </p>
      )}
      {voting && voting.earlyVoteSites.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-bold text-accent underline">
            Early voting sites ({voting.earlyVoteSites.length})
          </summary>
          <ul className="mt-2 grid gap-2">
            {voting.earlyVoteSites.map((p) => (
              <li key={p.address}>
                {p.name && <span className="block font-semibold">{p.name}</span>}
                <span className="block">{p.address}</span>
                {p.hours && <span className="block text-ink-muted">{p.hours}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
      {voting && (
        <p className="mt-3 text-sm text-ink-muted">
          Source: {voting.source.name}. Double-check on{" "}
          <a href={VOTERVIEW} target="_blank" rel="noopener noreferrer">
            VoterView<span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      )}
      <p className="mt-2">
        <Link href="/vote">How to vote, step by step →</Link>
      </p>
    </section>
  );
}
