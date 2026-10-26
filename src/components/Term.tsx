"use client";

import { useId, useState } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

/** A civic word with a tap-to-open plain definition right next to it. */
export function Term({ k, children }: { k: GlossaryKey; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="cursor-help font-semibold text-inherit underline decoration-dotted decoration-2 underline-offset-4"
      >
        {children}
        <span className="sr-only"> (tap for meaning)</span>
      </button>
      <span
        id={id}
        hidden={!open}
        className="my-2 block rounded-lg border-l-4 border-accent bg-accent-soft px-3 py-2 text-base"
      >
        <strong>Meaning: </strong>
        {GLOSSARY[k]}
      </span>
    </>
  );
}
