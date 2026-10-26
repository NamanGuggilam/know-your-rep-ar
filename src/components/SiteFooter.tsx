import Link from "next/link";

export const DISCLAIMER =
  "Know Your Rep AR is an independent student project. It is not affiliated with or endorsed by any government office.";

const LINKS = [
  { href: "/neutral", label: "How we stay neutral" },
  { href: "/about#sources", label: "Where our data comes from" },
  { href: "/privacy", label: "Privacy" },
  { href: "/accessibility", label: "Accessibility statement" },
  { href: "/about", label: "About" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20">
      <nav aria-label="Footer" className="bg-navy">
        <ul className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-1 px-4 py-4">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="inline-flex min-h-11 items-center font-semibold text-navy-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-line-soft bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <p className="max-w-[70ch] font-semibold">{DISCLAIMER}</p>
          <p className="mt-2 text-ink-muted">
            Made in Arkansas for the Congressional App Challenge. Official election information comes from the{" "}
            <a href="https://www.sos.arkansas.gov/elections" target="_blank" rel="noopener noreferrer">
              Arkansas Secretary of State<span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
