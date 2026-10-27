"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { A11yButton, A11yDialog, LanguageButton } from "./a11y/A11yMenu";
import { useA11y } from "./a11y/settings";
import { CloseIcon, SiteMark } from "./icons";

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

const HOME_SECTION_PATHS = ["/ballot", "/my-reps", "/candidates"];

function isCurrentSection(pathname: string, href: string) {
  if (href !== "/") return pathname.startsWith(href);
  return pathname === "/" || HOME_SECTION_PATHS.some((sectionPath) => pathname.startsWith(sectionPath));
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings } = useA11y();
  const pathname = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header>
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
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((wasOpen) => !wasOpen)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
          Menu
        </button>
      </div>

      <nav aria-label="Main" className="hidden bg-navy lg:block">
        <ul className="mx-auto flex max-w-6xl flex-wrap px-2">
          {NAV.map((item) => {
            const isCurrent = isCurrentSection(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`inline-flex min-h-14 items-center border-b-4 px-4 font-semibold text-navy-ink no-underline hover:bg-white/10 ${
                    isCurrent ? "border-glow" : "border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div id="mobile-menu" hidden={!menuOpen} className="border-t border-line-soft bg-surface-2 px-4 pt-3 pb-5 lg:hidden">
        <nav aria-label="Main">
          <ul className="grid gap-1">
            {NAV.map((item) => {
              const isCurrent = isCurrentSection(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex min-h-12 items-center border-l-4 px-3 text-lg font-semibold no-underline ${
                      isCurrent ? "border-accent text-accent" : "border-transparent text-ink"
                    }`}
                  >
                    {item.label}
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
