import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { Lookup } from "@/components/Lookup";

export default function Home() {
  return (
    <>
      <section aria-labelledby="hero-heading" className="mb-8">
        <div>
          <h1 id="hero-heading" className="text-4xl leading-tight font-extrabold sm:text-5xl">
            Who represents you?
          </h1>
          <p className="mt-4 max-w-[60ch] text-xl">
            Type your address. See everyone who speaks for you in Little Rock and in Washington, D.C. Then contact them
            in one tap.
          </p>
          <p className="mt-3 max-w-[60ch] text-xl font-bold text-accent">
            Your voice matters. Your representatives work for you.
          </p>
        </div>
      </section>

      <Lookup />

      <section aria-labelledby="more-heading" className="mt-14 simple-hide">
        <h2 id="more-heading" className="text-2xl font-extrabold">
          New to this? Start here.
        </h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/who-does-what",
              title: "Who does what",
              body: "What each official does, and who to contact about what.",
            },
            {
              href: "/vote",
              title: "New voter guide",
              body: "How to register, check your registration, and vote in Arkansas.",
            },
            {
              href: "/neutral",
              title: "How we stay neutral",
              body: "Our rules for being fair to every official and every party.",
            },
          ].map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="card group flex h-full flex-col gap-2 p-5 text-ink no-underline hover:border-accent">
                <span className="flex items-center gap-2 text-xl font-extrabold text-accent underline underline-offset-4">
                  {c.title}
                  <ArrowIcon />
                </span>
                <span>{c.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
