"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadLineup } from "@/lib/session";

type ResultsTabKey = "ballot" | "reps";

function ballotHrefFor(districts: { congressional: string | number; stateSenate: string | number; stateHouse: string | number }) {
  return `/ballot?cd=${districts.congressional}&ss=${districts.stateSenate}&sh=${districts.stateHouse}`;
}

function ResultsTab({ isActive, href, label }: { isActive: boolean; href: string | null; label: string }) {
  const className = `inline-flex min-h-12 items-center border-b-4 px-3 font-display text-base font-bold no-underline sm:px-4 sm:text-lg ${
    isActive ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink"
  }`;
  if (isActive || !href) {
    return (
      <span className={className} aria-current={isActive ? "page" : undefined}>
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function ResultsTabs({ active }: { active: ResultsTabKey }) {
  const [ballotHref, setBallotHref] = useState<string | null>(null);

  useEffect(() => {
    const districts = loadLineup()?.districts;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (districts) setBallotHref(ballotHrefFor(districts));
  }, []);

  return (
    <nav aria-label="Your results" className="mb-8 border-b-2 border-line-soft">
      <ul className="flex flex-wrap">
        <li>
          <ResultsTab isActive={active === "ballot"} href={ballotHref} label="Your ballot" />
        </li>
        <li>
          <ResultsTab isActive={active === "reps"} href="/my-reps" label="Your representatives" />
        </li>
      </ul>
    </nav>
  );
}
