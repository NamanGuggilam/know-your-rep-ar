import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/PageIntro";
import { Term } from "@/components/Term";
import { OFFICES } from "@/lib/offices";
import type { OfficeKind } from "@/lib/types";

export const metadata: Metadata = { title: "Who does what" };

const ORDER: OfficeKind[] = ["state-house", "state-senate", "us-house", "us-senate"];

const WHO_TO_CALL = [
  { topic: "Roads and highways", who: "Your state lawmakers (for state highways). Your city or county (for local streets)." },
  { topic: "Public schools", who: "Your state lawmakers. Your local school board also makes many decisions." },
  { topic: "Driver's license or state taxes", who: "Your state lawmakers." },
  { topic: "Social Security, Medicare, or the VA", who: "Your U.S. Representative or U.S. Senators. Their offices can help you with a federal agency." },
  { topic: "Passports or immigration", who: "Your U.S. Representative or U.S. Senators." },
  { topic: "A national law", who: "Your U.S. Representative and U.S. Senators." },
  { topic: "An Arkansas law", who: "Your State Representative and State Senator." },
  { topic: "Trash pickup, potholes, or local parks", who: "Your city council or county government. They are not listed in this app." },
];

export default function WhoDoesWhat() {
  return (
    <>
      <PageIntro
        title="Who does what"
                intro="You have at least five people who represent you. Here is what each one does, and who to contact about what."
      />
      <div id="wdw-body" className="prose-civic">
        <section aria-labelledby="who-to-call">
          <h2 id="who-to-call">Who should I contact?</h2>
          <p>
            Not sure who to call? Find your topic below. If you pick the wrong office, that&apos;s OK. Staff will often
            tell you who can help.
          </p>
          <dl className="grid gap-3">
            {WHO_TO_CALL.map((r) => (
              <div key={r.topic} className="card p-4">
                <dt className="font-bold">{r.topic}</dt>
                <dd>
                  <span className="sr-only">Start with: </span>
                  {r.who}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <h2>Two levels of government</h2>
        <p>
          <strong>State</strong> lawmakers meet in Little Rock. They make Arkansas laws. Together they are called the{" "}
          <Term k="general-assembly">General Assembly</Term>.
        </p>
        <p>
          <strong>Federal</strong> lawmakers meet in Washington, D.C. They make laws for the whole country. Together they
          are called <Term k="congress">Congress</Term>.
        </p>

        {ORDER.map((k) => {
          const o = OFFICES[k];
          return (
            <section key={k} id={k} aria-labelledby={`${k}-h`} className="card mt-6 scroll-mt-4 p-5">
              <h2 id={`${k}-h`} className="!mt-0">
                {o.name}
              </h2>
              {o.long.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <ul>
                <li>
                  <strong>How long they serve (their <Term k="term">term</Term>):</strong> {o.term}
                </li>
                <li>
                  <strong>How many:</strong> {o.howMany}
                </li>
              </ul>
              <h3>Contact them about:</h3>
              <ul>
                {o.contactFor.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          );
        })}

        <h2>Ready to find yours?</h2>
        <p>
          <Link href="/">Type your address to see who represents you.</Link>
        </p>
      </div>
    </>
  );
}
