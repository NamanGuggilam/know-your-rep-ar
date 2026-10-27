"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchHit } from "@/lib/search";
import { PartyBadge } from "./PartyBadge";
import { SearchIcon } from "./icons";

const GROUPS: { kind: SearchHit["kind"]; title: string }[] = [
  { kind: "candidate", title: "Candidates on the 2026 ballot" },
  { kind: "role", title: "Offices and their powers" },
  { kind: "official", title: "People in office now" },
];

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 250;
const SNIPPET_MAX_LENGTH = 160;
const PLACEHOLDER_PHOTO = "/candidates/placeholder.svg";

const EXAMPLES = ["agriculture", "who can veto a bill", "schools", "Cotton", "impeach", "District 13"];

function truncateSnippet(text: string) {
  return text.length > SNIPPET_MAX_LENGTH ? text.slice(0, SNIPPET_MAX_LENGTH - 3) + "…" : text;
}

function describeResults(loading: boolean, hits: SearchHit[] | null, query: string) {
  if (loading) return "Searching…";
  if (!hits) return "";
  return `${hits.length} ${hits.length === 1 ? "result" : "results"} for “${query}”.`;
}

function SearchHitCard({ hit }: { hit: SearchHit }) {
  return (
    <Link href={hit.href} className="card flex h-full gap-4 p-4 text-ink no-underline hover:border-accent">
      {hit.kind !== "role" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hit.photo || PLACEHOLDER_PHOTO}
          alt=""
          width={56}
          height={68}
          className="h-[68px] w-14 flex-none rounded bg-surface-2 object-cover"
          loading="lazy"
        />
      )}
      <span className="min-w-0">
        <span className="block font-display text-lg font-bold text-accent underline underline-offset-4">
          {hit.title}
        </span>
        <span className="mt-0.5 block text-sm text-ink-muted">{hit.subtitle}</span>
        {hit.party && (
          <span className="mt-1 block">
            <PartyBadge party={hit.party} />
          </span>
        )}
        {hit.matches.map((match) => (
          <span key={match.label + match.text} className="mt-1 block text-sm">
            <strong>{match.label}:</strong> {truncateSnippet(match.text)}
          </span>
        ))}
      </span>
    </Link>
  );
}

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [queryText, setQueryText] = useState(params.get("q") ?? "");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const hintId = useId();
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trimmedQuery = queryText.trim();

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHits(null);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      router.replace(`/search?q=${encodeURIComponent(trimmedQuery)}`, { scroll: false });
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        setHits((await response.json()).hits);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceTimer.current);
  }, [trimmedQuery, router]);

  return (
    <div>
      <form role="search" onSubmit={(event) => event.preventDefault()} className="card p-5">
        <label htmlFor="q" className="block font-display text-xl font-bold">
          Search people, offices, and topics
        </label>
        <p id={hintId} className="mt-1 text-ink-muted">
          Try a name, an office, a power, or a topic.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <SearchIcon className="flex-none text-ink-muted" />
          <input
            id="q"
            type="search"
            className="field"
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            aria-describedby={hintId}
            autoComplete="off"
          />
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Examples:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="btn btn-secondary min-h-11 py-1 text-sm"
              onClick={() => setQueryText(example)}
            >
              {example}
            </button>
          ))}
        </p>
      </form>

      <div role="status" aria-live="polite" className="mt-6 font-semibold">
        {describeResults(loading, hits, trimmedQuery)}
      </div>

      {hits && hits.length === 0 && !loading && (
        <p className="mt-2">No matches. Try fewer words, or a different word for the same thing.</p>
      )}

      {hits &&
        GROUPS.map((group) => {
          const groupHits = hits.filter((hit) => hit.kind === group.kind);
          if (!groupHits.length) return null;
          return (
            <section key={group.kind} aria-labelledby={`g-${group.kind}`} className="mt-8">
              <h2 id={`g-${group.kind}`} className="text-2xl font-bold">
                {group.title} <span className="text-base font-normal text-ink-muted">({groupHits.length})</span>
              </h2>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {groupHits.map((hit) => (
                  <li key={hit.kind + hit.id}>
                    <SearchHitCard hit={hit} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
