"use client";

import { useId, useState } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

export function Term({ k, children }: { k: GlossaryKey; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const definitionId = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={definitionId}
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        className="cursor-help font-semibold text-inherit underline decoration-dotted decoration-2 underline-offset-4"
      >
        {children}
        <span className="sr-only"> (tap for meaning)</span>
      </button>
      <span
        id={definitionId}
        hidden={!isOpen}
        className="my-2 block rounded border-l-4 border-accent bg-accent-soft px-3 py-2 text-base"
      >
        <strong>Meaning: </strong>
        {GLOSSARY[k]}
      </span>
    </>
  );
}
