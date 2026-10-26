"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadLineup } from "@/lib/session";

/** "Your ballot" / "Your representatives": two views of the same address lookup. */
export function ResultsTabs({ active }: { active: "ballot" | "reps" }) {
  const [ballotHref, setBallotHref] = useState<string | null>(null);

  useEffect(() => {
    const d = loadLineup()?.districts;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (d) setBallotHref(`/ballot?cd=${d.congressional}&ss=${d.stateSenate}&sh=${d.stateHouse}`);
  }, []);

  const tab = (key: "ballot" | "reps", href: string | null, label: string) => {
    const on = active === key;
    const cls = `inline-flex min-h-12 items-center border-b-4 px-3 font-display text-base font-bold no-underline sm:px-4 sm:text-lg ${
      on ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink"
    }`;
    return on || !href ? (
      <span className={cls} aria-current={on ? "page" : undefined}>
        {label}
      </span>
    ) : (
      <Link href={href} className={cls}>
        {label}
      </Link>
    );
  };

  return (
    <nav aria-label="Your results" className="mb-8 border-b-2 border-line-soft">
      <ul className="flex flex-wrap">
        <li>{tab("ballot", ballotHref, "Your ballot")}</li>
        <li>{tab("reps", "/my-reps", "Your representatives")}</li>
      </ul>
    </nav>
  );
}
