"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { A11yButton, A11yDialog } from "./a11y/A11yMenu";
import { CloseIcon, InfinityMark } from "./icons";

// "Ask" stays off the menu until AI answers are switched on; /ask still works directly.
const NAV = [
  { href: "/", label: "My ballot" },
  { href: "/who-does-what", label: "Who does what" },
  { href: "/vote", label: "How to vote" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
];

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [path]);

  const links = (cls: string) =>
    NAV.map((n) => {
      const on = n.href === "/" ? path === "/" || path.startsWith("/ballot") || path.startsWith("/my-reps") : path.startsWith(n.href);
      return (
        <li key={n.href}>
          <Link href={n.href} aria-current={on ? "page" : undefined} className={`${cls} ${on ? "text-accent" : "text-ink"}`}>
            {n.label}
          </Link>
        </li>
      );
    });

  return (
    <header className="border-b-2 border-line-soft bg-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-ink no-underline sm:gap-3">
          <InfinityMark size={36} />
          <span className="font-display text-lg leading-tight font-bold tracking-tight sm:text-xl">
            Know Your Rep <span className="text-accent">AR</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex gap-1">
            {links("inline-flex min-h-12 items-center rounded px-3 font-semibold no-underline hover:bg-surface-2")}
          </ul>
        </nav>
        <div className="hidden lg:block">
          <A11yButton />
        </div>

        <button
          type="button"
          className="btn btn-secondary lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
          Menu
        </button>
      </div>

      <div id="mobile-menu" hidden={!open} className="border-t-2 border-line-soft px-4 pt-3 pb-5 lg:hidden">
        <nav aria-label="Main">
          <ul className="grid gap-1">
            {links("flex min-h-12 items-center rounded px-3 text-lg font-semibold no-underline hover:bg-surface-2")}
          </ul>
        </nav>
        <div className="mt-3">
          <A11yButton />
        </div>
      </div>
      <A11yDialog />
    </header>
  );
}
