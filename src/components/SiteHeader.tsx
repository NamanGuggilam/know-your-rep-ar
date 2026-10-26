import Link from "next/link";
import { A11yMenu } from "./a11y/A11yMenu";
import { DiamondMark } from "./icons";

const NAV = [
  { href: "/", label: "Find my reps" },
  { href: "/who-does-what", label: "Who does what" },
  { href: "/vote", label: "New voters" },
  { href: "/about", label: "About" },
];

/** Original abstract Ozark ridgeline. Decorative only. */
function Ridgeline() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full"
      viewBox="0 0 1200 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0 60 C120 30 200 50 300 35 S480 10 600 30 S820 55 930 28 S1110 20 1200 40 V80 H0Z"
        fill="var(--ridge-1)"
      />
      <path
        d="M0 70 C150 50 260 66 380 52 S600 40 720 56 S960 70 1060 54 S1160 48 1200 58 V80 H0Z"
        fill="var(--ridge-2)"
      />
      <path d="M0 78 H1200 V80 H0Z" fill="var(--ridge-3)" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="relative overflow-hidden border-b border-line-soft bg-surface pb-14">
      <Ridgeline />
      <div className="relative mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <Link href="/" className="flex items-center gap-3 text-ink no-underline">
          <DiamondMark />
          <span className="text-xl leading-tight font-extrabold">
            Know Your Rep <span className="text-accent">AR</span>
          </span>
        </Link>
        <A11yMenu />
      </div>
      <nav aria-label="Main" className="relative mx-auto mt-3 max-w-5xl px-4">
        <ul className="flex flex-wrap gap-x-1 gap-y-1">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                className="inline-flex min-h-12 items-center rounded-lg px-3 font-semibold text-ink underline-offset-4 hover:bg-surface-2"
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
