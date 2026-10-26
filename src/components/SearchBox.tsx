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

const EXAMPLES = ["agriculture", "who can veto a bill", "schools", "Cotton", "impeach", "District 13"];

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const hintId = useId();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const query = q.trim();
    clearTimeout(timer.current);
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHits(null);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        setHits((await res.json()).hits);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q, router]);

  return (
    <div>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="panel p-5">
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
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-describedby={hintId}
            autoComplete="off"
          />
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Examples:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="btn btn-secondary min-h-11 py-1 text-sm" onClick={() => setQ(ex)}>
              {ex}
            </button>
          ))}
        </p>
      </form>

      <div role="status" aria-live="polite" className="mt-6 font-semibold">
        {loading ? "Searching…" : hits ? `${hits.length} ${hits.length === 1 ? "result" : "results"} for “${q.trim()}”.` : ""}
      </div>

      {hits && hits.length === 0 && !loading && (
        <p className="mt-2">No matches. Try fewer words, or a different word for the same thing.</p>
      )}

      {hits &&
        GROUPS.map((g) => {
          const items = hits.filter((h) => h.kind === g.kind);
          if (!items.length) return null;
          return (
            <section key={g.kind} aria-labelledby={`g-${g.kind}`} className="mt-8">
              <h2 id={`g-${g.kind}`} className="text-2xl font-bold">
                {g.title} <span className="text-base font-normal text-ink-muted">({items.length})</span>
              </h2>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {items.map((h) => (
                  <li key={h.kind + h.id}>
                    <Link href={h.href} className="card flex h-full gap-4 p-4 text-ink no-underline hover:border-accent">
                      {h.kind !== "role" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={h.photo || "/candidates/placeholder.svg"}
                          alt=""
                          width={56}
                          height={68}
                          className="h-[68px] w-14 flex-none rounded bg-surface-2 object-cover"
                          loading="lazy"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block font-display text-lg font-bold text-accent underline underline-offset-4">
                          {h.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-muted">{h.subtitle}</span>
                        {h.party && (
                          <span className="mt-1 block">
                            <PartyBadge party={h.party} />
                          </span>
                        )}
                        {h.matches.map((m) => (
                          <span key={m.label + m.text} className="mt-1 block text-sm">
                            <strong>{m.label}:</strong> {m.text.length > 160 ? m.text.slice(0, 157) + "…" : m.text}
                          </span>
                        ))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
