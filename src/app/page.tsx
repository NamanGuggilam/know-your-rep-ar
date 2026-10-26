import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { LookupForm } from "@/components/LookupForm";

/** Decorative "Infinity" rings behind the hero. Original artwork. */
function InfinityRings() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -top-24 -right-32 hidden h-[34rem] w-[34rem] opacity-70 lg:block"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="void" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="200" fill="url(#void)" />
      <g className="infinity-spin" fill="none">
        <circle cx="200" cy="200" r="170" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="1 9" />
        <circle cx="200" cy="200" r="130" stroke="var(--glow)" strokeWidth="1" strokeDasharray="40 14" opacity="0.7" />
        <circle cx="200" cy="200" r="92" stroke="var(--accent)" strokeWidth="2" />
        <circle cx="200" cy="200" r="58" stroke="var(--glow)" strokeWidth="1" opacity="0.8" />
      </g>
      <path d="M200 160 228 200 200 240 172 200Z" fill="var(--ink)" />
      <path d="M200 160 210 200 200 240 190 200Z" fill="var(--accent)" />
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
      <section aria-labelledby="hero-heading" className="relative mb-10">
        <InfinityRings />
        <div className="relative max-w-2xl">
          <p className="eyebrow">Arkansas · Your ballot · Your voice</p>
          <h1 id="hero-heading" className="mt-3 text-5xl leading-[1.05] font-bold sm:text-6xl">
            Know who&apos;s on your ballot.
          </h1>
          <p className="mt-5 max-w-[52ch] text-xl text-ink-muted">
            Type your address. Compare every candidate on the same topics, in plain English, with sources. Then see who
            already represents you and contact them.
          </p>
        </div>
        <div className="relative mt-8 max-w-2xl">
          <LookupForm />
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
