"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { AskResult } from "@/lib/ask";

/** "Ask about these candidates": the question helper, focused on one race. */
export function RaceAsk({ race, names }: { race: string; names: string[] }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const id = useId();
  const examples = [
    `What does the ${race} do?`,
    "What do they say about schools?",
    "How do their plans on taxes compare?",
  ];

  async function submit(text: string) {
    const question = text.trim();
    if (question.length < 3) return setError("Please type a question.");
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, race }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We could not reach the internet. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby={`${id}-h`} className="card mt-4 p-5">
      <h3 id={`${id}-h`} className="font-display text-xl font-bold">
        Ask about these candidates
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        Ask a question about {names.join(", ")}. The helper only uses this app&apos;s sources and never takes sides.
      </p>
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
      >
        <label htmlFor={`${id}-q`} className="sr-only">
          Your question about the {race} race
        </label>
        <input
          id={`${id}-q`}
          className="field min-w-0 flex-1"
          value={q}
          maxLength={300}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a question"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          Ask
        </button>
      </form>
      <ul className="mt-3 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <li key={ex}>
            <button
              type="button"
              className="btn btn-secondary min-h-11 py-1 text-sm"
              onClick={() => {
                setQ(ex);
                submit(ex);
              }}
            >
              {ex}
            </button>
          </li>
        ))}
      </ul>

      <div role="status" aria-live="polite" className="mt-3">
        {loading && <p className="font-semibold">Looking through our sources…</p>}
        {error && <p className="font-semibold">{error}</p>}
        {result && result.kind === "unavailable" && (
          <p>
            AI answers aren&apos;t switched on yet. The table above shows what each candidate says. You can also{" "}
            <Link href={`/search?q=${encodeURIComponent(q || race)}`}>search</Link>.
          </p>
        )}
        {result && result.kind !== "unavailable" && (
          <div className="rounded border-l-4 border-accent bg-accent-soft p-4">
            <p className="whitespace-pre-line">{result.answer}</p>
            {result.sources.length > 0 && (
              <p className="mt-2 text-sm">
                Sources:{" "}
                {result.sources.map((s, i) => (
                  <span key={s.href + s.title}>
                    {i > 0 && ", "}
                    <Link href={s.href}>{s.title}</Link>
                  </span>
                ))}
              </p>
            )}
            <p className="mt-2 text-xs text-ink-muted">AI-generated from this app&apos;s sources. Check the sources.</p>
          </div>
        )}
      </div>
    </section>
  );
}
