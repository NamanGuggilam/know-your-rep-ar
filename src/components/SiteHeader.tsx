import Link from "next/link";
import { A11yMenu } from "./a11y/A11yMenu";
import { InfinityMark } from "./icons";

const NAV = [
  { href: "/", label: "My ballot" },
  { href: "/who-does-what", label: "Who does what" },
  { href: "/vote", label: "How to vote" },
  { href: "/search", label: "Search" },
  { href: "/ask", label: "Ask" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="border-b-2 border-line-soft bg-bg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 text-ink no-underline">
          <InfinityMark />
          <span className="font-display text-xl leading-tight font-bold tracking-tight">
            Know Your Rep <span className="text-accent">AR</span>
          </span>
        </Link>
        <nav aria-label="Main" className="order-3 w-full md:order-2 md:w-auto">
          <ul className="flex flex-wrap gap-x-1 gap-y-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="inline-flex min-h-12 items-center rounded px-3 font-semibold text-ink no-underline hover:bg-surface-2 hover:text-accent"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="order-2 md:order-3">
          <A11yMenu />
        </div>
      </div>
    </header>
  );
}
