"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { AskResult } from "@/lib/ask";
import { AlertIcon, InfoIcon } from "./icons";

const EXAMPLES = [
  "What does the Lieutenant Governor do?",
  "Who is running for Secretary of State?",
  "What do the governor candidates say about schools?",
  "Who can override a veto in Arkansas?",
  "Which lawmakers serve on agriculture committees?",
  "Where do I find my polling place?",
];

export function AskBox() {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hintId = useId();
  const answerRef = useRef<HTMLHeadingElement>(null);

  async function submit(q: string) {
    const text = q.trim();
    if (text.length < 3) {
      setError("Please type a question.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setAsked(text);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong. Please try again.");
      else {
        setResult(data);
        requestAnimationFrame(() => answerRef.current?.focus());
      }
    } catch {
      setError("We could not reach the internet. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="card p-5"
      >
        <label htmlFor="ask-q" className="block font-display text-xl font-bold">
          Your question
        </label>
        <p id={hintId} className="mt-1 text-ink-muted">
          Ask about candidates, people in office, what an office does, or how to vote.
        </p>
        <textarea
          id="ask-q"
          rows={3}
          maxLength={300}
          className="field mt-3"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-describedby={hintId}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(question);
            }
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Ask
          </button>
          <span className="text-sm text-ink-muted">Questions are not saved.</span>
        </div>
        <p className="mt-4 text-sm text-ink-muted">Try one:</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                className="btn btn-secondary min-h-11 py-1 text-sm"
                onClick={() => {
                  setQuestion(ex);
                  submit(ex);
                }}
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      </form>

      <div role="status" aria-live="polite" className="mt-6">
        {loading && <p className="font-semibold">Looking through our sources…</p>}
        {error && (
          <p className="flex items-start gap-2 rounded border-2 border-line bg-surface-2 p-3 font-semibold">
            <AlertIcon className="mt-0.5" />
            {error}
          </p>
        )}
      </div>

      {result && (
        <section aria-labelledby="answer-h" className="card mt-2 p-6">
          <p className="eyebrow">You asked</p>
          <p className="mt-1 text-lg font-semibold">{asked}</p>
          <h2 id="answer-h" ref={answerRef} tabIndex={-1} className="mt-5 text-2xl font-bold outline-none">
            {result.kind === "unavailable" ? "Pages that may help" : "Answer"}
          </h2>
          {result.kind === "unavailable" ? (
            <p className="mt-2">
              AI answers are turned off right now. These pages from our search match your question.
            </p>
          ) : (
            <p className="mt-2 text-lg whitespace-pre-line">{result.answer}</p>
          )}
          {result.kind === "declined-opinion" && (
            <p className="mt-3">
              <Link href="/" className="btn btn-primary">
                Compare the candidates side by side
              </Link>
            </p>
          )}
          {result.sources.length > 0 && (
            <>
              <h3 className="mt-5 font-bold">{result.kind === "unavailable" ? "Matching pages" : "Sources used"}</h3>
              <ul className="mt-2 list-[square] pl-6">
                {result.sources.map((s) => (
                  <li key={s.href + s.title}>
                    <Link href={s.href}>{s.title}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {result.kind !== "unavailable" && (
            <p className="mt-5 flex items-start gap-2 text-sm text-ink-muted">
              <InfoIcon size={18} className="mt-0.5 flex-none" />
              AI-generated answer, using only this app&apos;s sources. It never takes sides. It can make mistakes, so
              check the sources above.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
