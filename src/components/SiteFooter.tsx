import Link from "next/link";

export const DISCLAIMER =
  "Know Your Rep AR is an independent student project. It is not affiliated with or endorsed by any government office.";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t-2 border-line-soft bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="mb-4 max-w-[68ch] font-semibold">{DISCLAIMER}</p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/neutral" className="inline-flex min-h-11 items-center">
                How we stay neutral
              </Link>
            </li>
            <li>
              <Link href="/about#sources" className="inline-flex min-h-11 items-center">
                Where our data comes from
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="inline-flex min-h-11 items-center">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/accessibility" className="inline-flex min-h-11 items-center">
                Accessibility statement
              </Link>
            </li>
            <li>
              <Link href="/about" className="inline-flex min-h-11 items-center">
                About
              </Link>
            </li>
          </ul>
        </nav>
        <p className="mt-4 text-ink-muted">Made in Arkansas for the Congressional App Challenge.</p>
      </div>
    </footer>
  );
}
