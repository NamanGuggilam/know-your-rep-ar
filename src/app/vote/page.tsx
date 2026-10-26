import type { Metadata } from "next";
import { ExtLink, PageIntro } from "@/components/PageIntro";
import { Term } from "@/components/Term";

export const metadata: Metadata = { title: "Your voice matters: new voter guide" };

// Every fact here comes from the Arkansas Secretary of State's voter pages, linked below.
// We do not list deadlines or dates: those change, so we send people to the official source.
const SOS = {
  info: "https://www.sos.arkansas.gov/elections/voter-information",
  registration: "https://www.sos.arkansas.gov/elections/voter-information/voter-registration-information",
  faqs: "https://www.sos.arkansas.gov/elections/voter-information/voter-registration-faqs",
  votingInAr: "https://www.sos.arkansas.gov/elections/voter-information/voter-registration-information/voting-in-arkansas",
  absentee: "https://www.sos.arkansas.gov/elections/voter-information/absentee-voting",
  formEn: "https://www.sos.arkansas.gov/uploads/elections/Voter_Reg_App._8-2023_.pdf",
  formEs: "https://www.sos.arkansas.gov/uploads/elections/voter_reg_ap_ar_spanish.pdf",
  requestByMail:
    "https://www.sos.arkansas.gov/elections/voter-information/voter-registration-information/request-for-a-voter-registration-application",
  clerks: "https://www.sos.arkansas.gov/uploads/elections/ARCountyClerks.pdf",
  voterView: "https://www.voterview.ar-nova.org/voterview",
  elections: "https://www.sos.arkansas.gov/elections",
};

const MYTHS = [
  {
    myth: "“You have to be an expert to contact your representative.”",
    fact: "No. You just need to say what matters to you. Your own story is more powerful than fancy words.",
  },
  {
    myth: "“They don't want to hear from regular people.”",
    fact: "Their job is to represent the people in their district. Their offices have staff whose job is to read messages and answer calls.",
  },
  {
    myth: "“One message doesn't make a difference.”",
    fact: "Many offices keep track of how many people contact them about each issue. Your message adds to that count.",
  },
  {
    myth: "“I can't contact them because I'm not old enough to vote.”",
    fact: "You can contact your representatives at any age. They represent everyone in their district, not just voters.",
  },
  {
    myth: "“I have to agree with their party to contact them.”",
    fact: "They represent everyone in their district, no matter which party you like, or if you like no party at all.",
  },
];

export default function VotePage() {
  return (
    <>
      <PageIntro
        title="Your voice matters"
        intro="Voting for the first time? Welcome! Here is how to get ready to vote in Arkansas, step by step."
      />
      <div id="vote-body" className="prose-civic">
        <p className="rounded-xl border-l-4 border-accent bg-accent-soft p-4">
          <strong>Dates and deadlines:</strong> These change for every election, so we don&apos;t list them here. Always
          check the{" "}
          <ExtLink href={SOS.elections}>Arkansas Secretary of State&apos;s election page</ExtLink> for the latest dates.
        </p>

        <h2>Step 1: Check if you can register</h2>
        <p>To register to vote in Arkansas, you must:</p>
        <ul>
          <li>Be a U.S. citizen.</li>
          <li>Live in Arkansas.</li>
          <li>Be 18, or turn 18 on or before the next election.</li>
          <li>Not be serving a sentence for a felony that has not been discharged or pardoned.</li>
          <li>Not be found by a court to be unable to vote because of mental incompetence.</li>
        </ul>
        <p>
          Source: <ExtLink href={SOS.registration}>Arkansas Secretary of State, Voter Registration Information</ExtLink>
        </p>

        <h2>Step 2: Fill out the form</h2>
        <p>
          In Arkansas, you <Term k="register">register</Term> by filling out a paper form. You can get one:
        </p>
        <ul>
          <li>
            Print it: <ExtLink href={SOS.formEn}>Voter registration form in English (PDF)</ExtLink> or{" "}
            <ExtLink href={SOS.formEs}>in Spanish (PDF)</ExtLink>
          </li>
          <li>
            <ExtLink href={SOS.requestByMail}>Ask for a form by mail</ExtLink>
          </li>
          <li>
            From your <Term k="county-clerk">county clerk</Term>, a revenue or DMV office, a public library, a disability
            agency, or a military recruiting office
          </li>
        </ul>
        <p>
          Send or bring the finished form to your county clerk.{" "}
          <ExtLink href={SOS.clerks}>Find your county clerk (PDF list)</ExtLink>.
        </p>

        <h2>Step 3: Make sure you are registered</h2>
        <p>
          Sending the form is not the last step. Your county clerk will mail you a voter registration card. This can take
          a few weeks. <strong>Don&apos;t assume you are registered until you get your card.</strong>
        </p>
        <p>
          You can check your registration any time on{" "}
          <ExtLink href={SOS.voterView}>VoterView, the state&apos;s official voter lookup</ExtLink>. If you move to a
          new county, you need to update your registration.
        </p>

        <h2>Step 4: Find where to vote</h2>
        <p>
          Your <Term k="precinct">precinct</Term> depends on where you live. Look up your{" "}
          <Term k="polling-place">polling place</Term> on <ExtLink href={SOS.voterView}>VoterView</ExtLink>.
        </p>
        <p>You have a few ways to vote:</p>
        <ul>
          <li>
            <strong>On Election Day</strong> at your polling place. Polls are open 7:30 a.m. to 7:30 p.m.
          </li>
          <li>
            <strong><Term k="early-voting">Early voting</Term></strong> on set days before Election Day. In most counties
            it happens at the county clerk&apos;s office.
          </li>
          <li>
            <strong><Term k="absentee">Absentee</Term> (by mail)</strong> if you will be away on Election Day, or
            can&apos;t get to the polls because of illness or disability.{" "}
            <ExtLink href={SOS.absentee}>Absentee voting rules</ExtLink>
          </li>
        </ul>

        <h2>Step 5: Know what to bring</h2>
        <p>
          When you vote, the poll worker will ask for your name, address, and date of birth. They will also ask you to
          show an approved form of ID, like a photo ID. Read the details on the official{" "}
          <ExtLink href={SOS.votingInAr}>Voting in Arkansas</ExtLink> page.
        </p>
        <p>
          Forgot your ID? You can still vote with a <Term k="provisional-ballot">provisional ballot</Term>. Then show your
          ID to your county clerk by the Monday after the election so your vote is counted.
        </p>
        <p>
          <strong>Know your rights:</strong> If your name is not on the list, or there is a question about your ID, you
          have the right to vote with a provisional ballot. You also have the right to
          find out in writing if it was counted.
        </p>

        <h2 id="myths">Myth-busters</h2>
        <ul className="!list-none !pl-0">
          {MYTHS.map((m) => (
            <li key={m.myth} className="card mb-3 p-4">
              <p className="!mb-1">
                <strong>Myth:</strong> {m.myth}
              </p>
              <p className="!mb-0">
                <strong>Fact:</strong> {m.fact}
              </p>
            </li>
          ))}
        </ul>

        <h2>Questions?</h2>
        <p>
          Call the Arkansas Secretary of State Elections Division at <a href="tel:+18004821127">1-800-482-1127</a>, or
          visit their <ExtLink href={SOS.info}>Voter Information page</ExtLink>.
        </p>
      </div>
    </>
  );
}
