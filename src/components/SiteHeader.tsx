"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { A11yButton, A11yDialog, LanguageButton } from "./a11y/A11yMenu";
import { useA11y } from "./a11y/settings";
import { CloseIcon, SiteMark } from "./icons";

// "Ask" stays off the menu until AI answers are switched on; /ask still works directly.
const NAV = [
  { href: "/", label: "My ballot" },
  { href: "/who-does-what", label: "Who does what" },
  { href: "/elections", label: "Elections" },
  { href: "/vote", label: "How to vote" },
  { href: "/results", label: "Results" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
];

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { settings } = useA11y();
  const path = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [path]);

  const isOn = (href: string) =>
    href === "/"
      ? path === "/" || path.startsWith("/ballot") || path.startsWith("/my-reps") || path.startsWith("/candidates")
      : path.startsWith(href);

  return (
    <header>
      {/* Where government sites say "official website", we say plainly that we are not one. */}
      <div className="border-b border-line-soft bg-surface-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 py-1 text-sm">
          <p className="py-1.5">
            An independent, nonpartisan student project. Not a government website.{" "}
            <Link href="/neutral" className="whitespace-nowrap">
              How we stay neutral
            </Link>
          </p>
          <LanguageButton />
        </div>
      </div>
      {settings.lang !== "en" && (
        <p className="border-b border-line-soft bg-accent-soft px-4 py-2 text-center text-sm">
          This page was translated by computer and may have mistakes. Native speakers: help us fix them.
        </p>
      )}

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-ink no-underline">
          <SiteMark />
          <span className="min-w-0">
            <span className="block font-display text-base leading-tight font-bold sm:text-2xl">Know Your Rep AR</span>
            <span className="block text-xs text-ink-muted sm:text-sm">Arkansas voter and representative guide</span>
          </span>
        </Link>
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

      <nav aria-label="Main" className="hidden bg-navy lg:block">
        <ul className="mx-auto flex max-w-6xl flex-wrap px-2">
          {NAV.map((n) => {
            const on = isOn(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex min-h-14 items-center border-b-4 px-4 font-semibold text-navy-ink no-underline hover:bg-white/10 ${
                    on ? "border-glow" : "border-transparent"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div id="mobile-menu" hidden={!open} className="border-t border-line-soft bg-surface-2 px-4 pt-3 pb-5 lg:hidden">
        <nav aria-label="Main">
          <ul className="grid gap-1">
            {NAV.map((n) => {
              const on = isOn(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={on ? "page" : undefined}
                    className={`flex min-h-12 items-center border-l-4 px-3 text-lg font-semibold no-underline ${
                      on ? "border-accent text-accent" : "border-transparent text-ink"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-3">
          <A11yButton />
        </div>
      </div>
      <div className="border-b border-line-soft lg:hidden" />
      <A11yDialog />
    </header>
  );
}
