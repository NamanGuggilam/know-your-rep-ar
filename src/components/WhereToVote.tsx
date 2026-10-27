"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { VotingInfo } from "@/lib/civic";
import { loadLineup } from "@/lib/session";
import { PinIcon } from "./icons";

const VOTERVIEW = "https://www.voterview.ar-nova.org/voterview";
const MAX_POLLING_PLACES_SHOWN = 2;

function mapLink(address: string) {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
}

function VoterViewLink() {
  return (
    <a href={VOTERVIEW} target="_blank" rel="noopener noreferrer">
      VoterView<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

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
            {voting.pollingPlaces.slice(0, MAX_POLLING_PLACES_SHOWN).map((place) => (
              <li key={place.address}>
                {place.name && <span className="block font-semibold">{place.name}</span>}
                <a href={mapLink(place.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                  <PinIcon size={18} />
                  {place.address}
                  <span className="sr-only"> (opens a map in a new tab)</span>
                </a>
                {place.hours && <span className="block text-ink-muted">{place.hours}</span>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2">
          Polls are open 7:30 a.m. to 7:30 p.m. on Election Day. Find your polling place on{" "}
          <VoterViewLink />
          , the official Arkansas voter lookup.
        </p>
      )}
      {voting && voting.earlyVoteSites.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-bold text-accent underline">
            Early voting sites ({voting.earlyVoteSites.length})
          </summary>
          <ul className="mt-2 grid gap-2">
            {voting.earlyVoteSites.map((site) => (
              <li key={site.address}>
                {site.name && <span className="block font-semibold">{site.name}</span>}
                <span className="block">{site.address}</span>
                {site.hours && <span className="block text-ink-muted">{site.hours}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
      {voting && (
        <p className="mt-3 text-sm text-ink-muted">
          Source: {voting.source.name}. Double-check on{" "}
          <VoterViewLink />
          .
        </p>
      )}
      <p className="mt-2">
        <Link href="/vote">How to vote, step by step →</Link>
      </p>
    </section>
  );
}
