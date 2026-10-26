import type { Metadata } from "next";
import Link from "next/link";
import { Term } from "@/components/Term";

export const metadata: Metadata = { title: "Elections and key dates" };

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const CALENDAR = "https://www.sos.arkansas.gov/uploads/elections/2026_Election_Calendar_Rev._7-2026_.pdf";
const REGISTRATION = "https://www.sos.arkansas.gov/elections/voter-information/voter-registration-information";
const HANDBOOK = "https://sbec.arkansas.gov/wp-content/uploads/2025-Running-for-Public-Office-8-13-25-FINAL-small.pdf";
const VOTERVIEW = "https://www.voterview.ar-nova.org/voterview";

// Every date below is from the Arkansas Secretary of State's 2026 Election Calendar (Rev. July 2026).
const KEY_DATES = [
  {
    when: "Monday, October 5, 2026",
    what: "Last day to register to vote in this election",
    detail:
      "The deadline is 30 days before the election. It fell on a Sunday (October 4), so it moved to the next business day.",
  },
  {
    when: "October 19 to November 2, 2026",
    what: "Early voting",
    detail: "Monday to Friday, 8 a.m. to 6 p.m. Saturday, 10 a.m. to 4 p.m. Early voting ends at 5 p.m. on Monday, November 2.",
  },
  {
    when: "Tuesday, October 27, 2026",
    what: "Absentee ballot applications sent by mail, fax, or email must be received",
    detail: "Your county clerk must receive the application by this day.",
  },
  {
    when: "Friday, October 30, 2026",
    what: "Last day to apply for or hand-deliver an absentee ballot in person",
    detail: "By the close of regular business hours at your county clerk's office.",
  },
  {
    when: "Tuesday, November 3, 2026",
    what: "Election Day",
    detail:
      "Polls are open 7:30 a.m. to 7:30 p.m. Absentee ballots sent by mail must reach the county clerk by 7:30 p.m. (Military and overseas ballots have 10 more days.)",
  },
  {
    when: "Tuesday, December 1, 2026",
    what: "General runoff election (only where needed)",
    detail: "For some county and city races, or a tie for certain state or township offices.",
  },
];

const TYPES = [
  {
    name: "Preferential primary",
    when: "March",
    what: "Each political party picks its candidates for the November ballot. You choose one party's ballot, or a nonpartisan ballot.",
  },
  {
    name: "General primary (primary runoff)",
    when: "Late March or April",
    what: "If no one in a party primary wins more than half the votes, the top two meet again here.",
  },
  {
    name: "Nonpartisan election",
    when: "March, with a runoff in November if needed",
    what: "Judges and some other offices. Candidates run without a party label.",
  },
  {
    name: "School election",
    when: "Usually with the March election",
    what: "School board members and school tax questions.",
  },
  {
    name: "General election",
    when: "November",
    what: "Voters choose who will hold each office, and vote yes or no on statewide ballot issues.",
  },
  {
    name: "General runoff",
    when: "December, only if needed",
    what: "Some county and city races where no one won more than half the votes.",
  },
  {
    name: "Special election",
    when: "Any time it is called",
    what: "To fill an office that became empty, or to vote on a local question.",
  },
];

const ELECTIONS_2026 = [
  { date: "March 3", name: "Preferential primary, nonpartisan general election, and annual school election" },
  { date: "March 31", name: "General primary (party runoff)" },
  { date: "November 3", name: "General election, nonpartisan runoff, and annual school runoff" },
  { date: "December 1", name: "General runoff (county and city), only where needed" },
];

export default function ElectionsPage() {
  return (
    <>
      <p className="eyebrow">Elections in Arkansas</p>
      <h1 className="mt-2 text-4xl leading-tight font-bold sm:text-5xl">Elections and key dates</h1>
      <p className="mt-4 max-w-[62ch] text-xl text-ink-muted">
        What each election is, when it happens, and the dates you need to know to vote in the next one.
      </p>

      <section aria-labelledby="dates-h" className="mt-10">
        <h2 id="dates-h" className="border-b border-line-soft pb-2 text-2xl font-bold">
          Key dates for the November 3, 2026 general election
        </h2>
        <ol className="mt-4 grid gap-3">
          {KEY_DATES.map((d) => (
            <li key={d.what} className="card grid gap-1 border-l-4 border-l-accent p-4 md:grid-cols-[16rem_1fr] md:gap-6">
              <p className="font-bold">{d.when}</p>
              <div>
                <p className="font-semibold">{d.what}</p>
                <p className="mt-1 text-ink-muted">{d.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink-muted">
          Source:{" "}
          <a href={CALENDAR} {...ext}>
            Arkansas Secretary of State, 2026 Election Calendar (PDF)<span className="sr-only"> (opens in a new tab)</span>
          </a>
          . Dates can change. Check with your county clerk if you are unsure.
        </p>
      </section>

      <section aria-labelledby="register-h" className="mt-12">
        <h2 id="register-h" className="border-b border-line-soft pb-2 text-2xl font-bold">
          How, where, and when to register
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <h3 className="text-lg font-bold">When</h3>
            <p className="mt-2">
              At least <strong>30 days before</strong> an election. A mailed form counts on the day it is postmarked.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="text-lg font-bold">How</h3>
            <p className="mt-2">
              Fill out a paper voter registration form. You must be a U.S. citizen, live in Arkansas, and be 18 or turn
              18 by the election.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="text-lg font-bold">Where</h3>
            <p className="mt-2">
              Your <Term k="county-clerk">county clerk</Term>, a revenue (DMV) office, a public library, a disability
              agency, or a military recruiting office. You can also print the form or ask for one by mail.
            </p>
          </div>
        </div>
        <p className="mt-4 flex flex-wrap gap-3">
          <a href={VOTERVIEW} className="btn btn-primary" {...ext}>
            Check if you are registered<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link href="/vote" className="btn btn-secondary">
            Step-by-step voting guide
          </Link>
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Source:{" "}
          <a href={REGISTRATION} {...ext}>
            Arkansas Secretary of State, Voter Registration Information<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </section>

      <section aria-labelledby="types-h" className="mt-12">
        <h2 id="types-h" className="border-b border-line-soft pb-2 text-2xl font-bold">
          Types of elections
        </h2>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          {TYPES.map((t) => (
            <div key={t.name} className="card p-5">
              <dt>
                <span className="block text-lg font-bold">{t.name}</span>
                <span className="block text-sm text-ink-muted">{t.when}</span>
              </dt>
              <dd className="mt-2">{t.what}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink-muted">
          Source:{" "}
          <a href={HANDBOOK} {...ext}>
            Arkansas State Board of Election Commissioners, Running for Public Office (PDF)
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </section>

      <section aria-labelledby="y2026-h" className="mt-12">
        <h2 id="y2026-h" className="border-b border-line-soft pb-2 text-2xl font-bold">
          Arkansas elections in 2026
        </h2>
        <table className="mt-4 w-full table-fixed border-collapse text-left [overflow-wrap:anywhere]">
          <caption className="sr-only">Statewide election dates in 2026</caption>
          <thead>
            <tr className="border-b-2 border-line-soft">
              <th scope="col" className="py-2 pr-4">
                Date
              </th>
              <th scope="col" className="py-2">
                Election
              </th>
            </tr>
          </thead>
          <tbody>
            {ELECTIONS_2026.map((e) => (
              <tr key={e.date} className="border-b border-line-soft">
                <th scope="row" className="py-3 pr-4 font-semibold">
                  {e.date}
                </th>
                <td className="py-3">{e.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-ink-muted">
          Special elections are held on other dates when needed. Your county clerk can tell you about any in your area.
        </p>
        <p className="mt-4">
          <Link href="/results" className="font-semibold">
            See live results on election night →
          </Link>
        </p>
      </section>
    </>
  );
}
