import type { Metadata } from "next";
import Link from "next/link";
import { ExtLink, PageIntro } from "@/components/PageIntro";
import { DISCLAIMER } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "About" };

const SOURCES = [
  {
    name: "U.S. Census Bureau Geocoder",
    url: "https://geocoding.geo.census.gov/geocoder/",
    use: "Turns your address into your congressional, state senate, and state house districts.",
  },
  {
    name: "U.S. Census Bureau TIGERweb",
    url: "https://tigerweb.geo.census.gov/",
    use: "The district shapes on the map.",
  },
  {
    name: "congress-legislators (the @unitedstates project)",
    url: "https://github.com/unitedstates/congress-legislators",
    use: "Names, parties, phone numbers, offices, and contact forms for members of Congress. Photos come from the same project.",
  },
  {
    name: "Open States / Plural Policy",
    url: "https://open.pluralpolicy.com/data/legislator-csv/",
    use: "Names, parties, districts, emails, phone numbers, and photos for Arkansas state lawmakers.",
  },
  {
    name: "Arkansas State Legislature",
    url: "https://www.arkleg.state.ar.us/",
    use: "The official source for state lawmakers. We link to it on every state lawmaker's page.",
  },
  {
    name: "Arkansas Secretary of State",
    url: "https://www.sos.arkansas.gov/elections",
    use: "The official source for voter registration and election information. Our New Voter guide links to it.",
  },
  {
    name: "OpenStreetMap",
    url: "https://www.openstreetmap.org/copyright",
    use: "The background map tiles.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        title="About Know Your Rep AR"
        bodyId="about-body"
        intro="Know Your Rep AR helps every Arkansan find, understand, and contact the people who represent them."
      />
      <div id="about-body" className="prose-civic">
        <p className="rounded-xl border-l-4 border-accent bg-accent-soft p-4 font-semibold">{DISCLAIMER}</p>

        <h2>Why we made this</h2>
        <p>
          Many people don&apos;t know who their state representative is. Government information is often written in hard
          words and spread across many websites. That makes it harder for people to take part, especially new voters,
          people with disabilities, and anyone who finds official websites confusing.
        </p>
        <p>
          This app puts it all in one place, in plain English, and works for people who use screen readers, larger text,
          or other tools. <strong>Your voice matters. Your representatives work for you.</strong>
        </p>

        <h2>What it does</h2>
        <ul>
          <li>Finds your two U.S. Senators, your U.S. Representative, your State Senator, and your State Representative.</li>
          <li>Explains what each one does, in plain words.</li>
          <li>Lets you call, email, or write to them in one tap.</li>
          <li>Helps you write a short, polite message.</li>
          <li>
            Guides new voters to official Arkansas voter information. See the <Link href="/vote">New voter guide</Link>.
          </li>
        </ul>

        <h2 id="sources">Where our data comes from</h2>
        <p>We only use official or trusted public sources. Each card shows its source and when we last checked it.</p>
        <ul>
          {SOURCES.map((s) => (
            <li key={s.url}>
              <ExtLink href={s.url}>{s.name}</ExtLink>: {s.use}
            </li>
          ))}
        </ul>
        <p>
          We refresh this data about once a day. If something looks wrong, the official sources are always the final
          word.
        </p>

        <h2>Our rules</h2>
        <p>
          We are strictly nonpartisan. Read <Link href="/neutral">how we stay neutral</Link>, our{" "}
          <Link href="/privacy">privacy promise</Link>, and our <Link href="/accessibility">accessibility statement</Link>.
        </p>

        <h2 id="contact">Contact us</h2>
        <p>
          Know Your Rep AR was built by a student in Arkansas&apos;s 3rd Congressional District for the Congressional App
          Challenge. To report a mistake or suggest a fix, contact the student through their school or the Congressional
          App Challenge.
        </p>
      </div>
    </>
  );
}
