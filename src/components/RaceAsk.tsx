"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { AskResult } from "@/lib/ask";

const MIN_QUESTION_LENGTH = 3;
const MAX_QUESTION_LENGTH = 300;
const MESSAGE_EMPTY_QUESTION = "Please type a question.";
const MESSAGE_GENERIC_FAILURE = "Something went wrong. Please try again.";
const MESSAGE_OFFLINE = "We could not reach the internet. Check your connection and try again.";

function exampleQuestionsFor(race: string) {
  return [`What does the ${race} do?`, "What do they say about schools?", "How do their plans on taxes compare?"];
}

export function RaceAsk({ race, names }: { race: string; names: string[] }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const baseId = useId();
  const examples = exampleQuestionsFor(race);

  async function submit(rawQuestion: string) {
    const trimmedQuestion = rawQuestion.trim();
    if (trimmedQuestion.length < MIN_QUESTION_LENGTH) {
      setError(MESSAGE_EMPTY_QUESTION);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion, race }),
      });
      const data = await response.json();
      if (response.ok) setResult(data);
      else setError(data.error ?? MESSAGE_GENERIC_FAILURE);
    } catch {
      setError(MESSAGE_OFFLINE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby={`${baseId}-h`} className="card mt-4 p-5">
      <h3 id={`${baseId}-h`} className="font-display text-xl font-bold">
        Ask about these candidates
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        Ask a question about {names.join(", ")}. The helper only uses this app&apos;s sources and never takes sides.
      </p>
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(question);
        }}
      >
        <label htmlFor={`${baseId}-q`} className="sr-only">
          Your question about the {race} race
        </label>
        <input
          id={`${baseId}-q`}
          className="field min-w-0 flex-1"
          value={question}
          maxLength={MAX_QUESTION_LENGTH}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Type a question"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          Ask
        </button>
      </form>
      <ul className="mt-3 flex flex-wrap gap-2">
        {examples.map((example) => (
          <li key={example}>
            <button
              type="button"
              className="btn btn-secondary min-h-11 py-1 text-sm"
              onClick={() => {
                setQuestion(example);
                submit(example);
              }}
            >
              {example}
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
            <Link href={`/search?q=${encodeURIComponent(question || race)}`}>search</Link>.
          </p>
        )}
        {result && result.kind !== "unavailable" && (
          <div className="rounded border-l-4 border-accent bg-accent-soft p-4">
            <p className="whitespace-pre-line">{result.answer}</p>
            {result.sources.length > 0 && (
              <p className="mt-2 text-sm">
                Sources:{" "}
                {result.sources.map((source, index) => (
                  <span key={source.href + source.title}>
                    {index > 0 && ", "}
                    <Link href={source.href}>{source.title}</Link>
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
