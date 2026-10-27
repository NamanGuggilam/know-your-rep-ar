import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { LookupForm } from "@/components/LookupForm";
import { ELECTION } from "@/lib/ballot";

const VOTERVIEW = "https://www.voterview.ar-nova.org/voterview";

function ElectionBox() {
  const day = new Date(`${ELECTION.date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <aside aria-labelledby="election-h" className="card overflow-hidden">
      <h2 id="election-h" className="bg-navy px-5 py-3 font-display text-lg font-bold text-navy-ink">
        {ELECTION.name}
      </h2>
      <dl className="divide-y divide-line-soft px-5">
        <div className="py-3">
          <dt className="text-sm font-semibold text-ink-muted">Election Day</dt>
          <dd className="text-lg font-bold">{day}</dd>
        </div>
        <div className="py-3">
          <dt className="text-sm font-semibold text-ink-muted">Polls open</dt>
          <dd className="font-semibold">7:30 a.m. to 7:30 p.m.</dd>
        </div>
        <div className="py-3">
          <dt className="text-sm font-semibold text-ink-muted">Early voting</dt>
          <dd className="font-semibold">Ends 5 p.m. the Monday before Election Day</dd>
        </div>
      </dl>
      <ul className="grid gap-2 border-t border-line-soft bg-surface-2 px-5 py-4">
        <li>
          <a href={VOTERVIEW} target="_blank" rel="noopener noreferrer" className="font-semibold">
            Check your registration and find your polling place
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
        <li>
          <Link href="/vote" className="font-semibold">
            How to vote, step by step
          </Link>
        </li>
      </ul>
      <p className="px-5 pb-4 text-xs text-ink-muted bg-surface-2">Source: Arkansas Secretary of State</p>
    </aside>
  );
}

const STEPS = [
  { href: "/who-does-what", title: "Who does what", body: "The powers and jobs of every office on your ballot." },
  { href: "/vote", title: "How to vote", body: "Register, check your registration, and find where to vote." },
  { href: "/neutral", title: "How we stay fair", body: "The rules we follow for every candidate and every party." },
];

export default function Home() {
  return (
    <>
      <section
        aria-labelledby="hero-heading"
        className="mb-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
      >
        <div>
          <h1 id="hero-heading" className="text-4xl leading-tight font-bold sm:text-5xl">
            Know who&apos;s on your ballot
          </h1>
          <p className="mt-4 max-w-[56ch] text-xl text-ink-muted">
            Enter your address to compare the candidates in each race on the same topics, in their own words, and to
            find and contact the people who represent you now.
          </p>
          <div className="mt-8 max-w-2xl">
            <LookupForm />
          </div>
        </div>
        <ElectionBox />
      </section>

      <section aria-labelledby="more-heading" className="mt-14 border-t border-line-soft pt-10 simple-hide">
        <h2 id="more-heading" className="text-2xl font-bold">
          New to voting? Start here
        </h2>
        <ul className="mt-5 grid gap-5 md:grid-cols-3">
          {STEPS.map((c) => (
            <li key={c.href} className="card border-t-4 border-t-accent p-5">
              <Link href={c.href} className="inline-flex items-center gap-1 text-xl font-bold">
                {c.title}
                <ArrowIcon size={18} />
              </Link>
              <p className="mt-2 text-ink-muted">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
