import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { LookupForm } from "@/components/LookupForm";

/** Decorative "Infinity" emblem beside the hero. Original artwork, static, fully inside its column. */
function InfinityEmblem() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none hidden h-auto w-full max-w-[26rem] lg:block"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="void" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="196" fill="url(#void)" />
      <g fill="none">
        <circle cx="200" cy="200" r="186" stroke="var(--line-soft)" strokeWidth="1" />
        <circle cx="200" cy="200" r="150" stroke="var(--glow)" strokeWidth="1" strokeOpacity="0.45" strokeDasharray="2 10" strokeLinecap="round" />
        <circle cx="200" cy="200" r="112" stroke="var(--accent)" strokeWidth="2.5" />
        <circle cx="200" cy="200" r="76" stroke="var(--glow)" strokeWidth="1" strokeOpacity="0.6" />
      </g>
      {/* Four points on the middle ring, like a compass. */}
      <g fill="var(--accent)">
        <circle cx="200" cy="88" r="4" />
        <circle cx="312" cy="200" r="4" />
        <circle cx="200" cy="312" r="4" />
        <circle cx="88" cy="200" r="4" />
      </g>
      {/* The diamond (Arkansas is the Diamond State). */}
      <path d="M200 142 240 200 200 258 160 200Z" fill="var(--ink)" />
      <path d="M200 142 214 200 200 258 186 200Z" fill="var(--accent)" />
      <path d="M160 200H240" stroke="var(--bg)" strokeWidth="2" strokeOpacity="0.5" />
    </svg>
  );
}

const STEPS = [
  { href: "/who-does-what", n: "01", title: "Who does what", body: "The powers and jobs of every office on your ballot." },
  { href: "/vote", n: "02", title: "How to vote", body: "Register, check your registration, and find where to vote." },
  { href: "/neutral", n: "03", title: "How we stay fair", body: "The rules we follow for every candidate and every party." },
];

export default function Home() {
  return (
    <>
      <section
        aria-labelledby="hero-heading"
        className="mb-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]"
      >
        <div>
          <p className="eyebrow">Arkansas · Your ballot · Your voice</p>
          <h1 id="hero-heading" className="mt-3 text-5xl leading-[1.05] font-bold sm:text-6xl">
            Know who&apos;s on your ballot.
          </h1>
          <p className="mt-5 max-w-[52ch] text-xl text-ink-muted">
            Type your address. Compare every candidate on the same topics, in plain English, with sources. Then see who
            already represents you and contact them.
          </p>
          <div className="mt-8 max-w-2xl">
            <LookupForm />
          </div>
        </div>
        <div className="flex justify-center">
          <InfinityEmblem />
        </div>
      </section>

      <section aria-labelledby="more-heading" className="mt-16 simple-hide">
        <h2 id="more-heading" className="text-3xl font-bold">
          New to this? Start here.
        </h2>
        <ul className="mt-6 grid gap-5 md:grid-cols-3">
          {STEPS.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="card group flex h-full flex-col gap-2 p-5 text-ink no-underline transition-colors hover:border-accent"
              >
                <span className="font-display text-sm font-bold tracking-widest text-accent">{c.n}</span>
                <span className="flex items-center gap-2 font-display text-2xl font-bold">
                  {c.title}
                  <ArrowIcon className="transition-transform group-hover:translate-x-1" />
                </span>
                <span className="text-ink-muted">{c.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
