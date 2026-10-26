import type { Metadata } from "next";
import Link from "next/link";
import { RaceTabs } from "@/components/RaceTabs";
import { Term } from "@/components/Term";
import { ROLES, STATEWIDE } from "@/lib/roles";

export const metadata: Metadata = { title: "Who does what" };

export default function WhoDoesWhat() {
  return (
    <>
      <p className="eyebrow">Know the roles</p>
      <h1 className="mt-2 text-5xl leading-tight font-bold">Who does what</h1>
      <p className="mt-4 max-w-[60ch] text-xl text-ink-muted">
        Every office has its own powers. Here is what each one can do and what it is responsible for. Lawmakers in the{" "}
        <Term k="general-assembly">General Assembly</Term> make Arkansas laws. Members of{" "}
        <Term k="congress">Congress</Term> make national laws.
      </p>

      <h2 className="mt-10 text-3xl font-bold">Pick an office</h2>
      <p className="mt-1 mb-4 text-ink-muted">Tap an office to see its powers and what it is responsible for.</p>
      <RaceTabs
        label="Offices"
        hashPrefix=""
        tabs={[
          ...ROLES.map((r) => ({
            id: r.id,
            title: r.name,
            subtitle: r.level === "Arkansas" ? "Arkansas government" : "National government",
            faces: [],
          })),
          {
            id: "statewide",
            title: "Other statewide offices",
            subtitle: "Arkansas government · 6 more offices",
            faces: [],
          },
        ]}
        panels={{
          ...Object.fromEntries(
            ROLES.map((r) => [
              r.id,
              <section key={r.id} aria-labelledby={`${r.id}-h`} className="card mt-6 p-6 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="eyebrow">{r.level === "Arkansas" ? "Arkansas government" : "National government"}</p>
                  <p className="text-sm text-ink-muted">{r.where}</p>
                </div>
                <h2 id={`${r.id}-h`} className="mt-2 text-3xl font-bold">
                  {r.name}
                </h2>
                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <dt className="text-sm text-ink-muted">How many</dt>
                    <dd className="font-semibold">{r.howMany}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">
                      <Term k="term">Term</Term>
                    </dt>
                    <dd className="font-semibold">{r.term}</dd>
                  </div>
                </dl>
                <div className="mt-6 grid gap-8 md:grid-cols-[3fr_2fr]">
                  <div>
                    <h3 className="text-xl font-bold">Powers</h3>
                    <ul className="prose-civic mt-3">
                      {r.powers.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Responsible for</h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {r.responsibleFor.map((p) => (
                        <li key={p} className="rounded border-2 border-line-soft bg-surface-2 px-3 py-1.5">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>,
            ]),
          ),
          statewide: (
            <section aria-labelledby="statewide-h" className="card mt-6 p-6 sm:p-8">
              <p className="eyebrow">Arkansas government</p>
              <h2 id="statewide-h" className="mt-2 text-3xl font-bold">
                Other statewide offices
              </h2>
              <p className="mt-2 max-w-[60ch] text-ink-muted">
                Voters across Arkansas also elect these officials. Each one serves a 4-year term.
              </p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {STATEWIDE.map((s) => (
                  <div key={s.name} className="border-l-4 border-accent pl-4">
                    <dt className="font-display text-lg font-bold [overflow-wrap:anywhere]">{s.name}</dt>
                    <dd className="mt-1">{s.job}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-ink-muted">
                Local issues, like potholes on city streets, trash pickup, and local parks, belong to your city council
                or county government (the county judge and the quorum court).
              </p>
            </section>
          ),
        }}
      />

      <p className="mt-10 text-lg">
        <Link href="/">See who&apos;s on your ballot →</Link>
      </p>
    </>
  );
}
