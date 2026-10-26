import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        title="Our privacy promise"
        bodyId="privacy-body"
        intro="Short version: we don't keep your address, we don't track you, and we don't sell anything."
      />
      <div id="privacy-body" className="prose-civic">
        <h2>Your address</h2>
        <ul>
          <li>We use your address one time, to find your districts. Then we forget it.</li>
          <li>We never save your address in a database or in our logs.</li>
          <li>Your address is never put in the web address (URL), so it won&apos;t show up in your browser history.</li>
          <li>
            To find your districts, we send your address to the U.S. Census Bureau&apos;s free address service. To draw
            the map, we send the location of your address to the Census Bureau&apos;s map service.
          </li>
        </ul>

        <h2>&ldquo;Use my location&rdquo;</h2>
        <p>
          This only works if you say yes when your device asks. We use your location once, the same way as an address.
          We don&apos;t save it.
        </p>

        <h2>Messages you write</h2>
        <p>
          The &ldquo;Help me write a message&rdquo; tool works on your device. What you type is not sent to us. When you
          send a message, it goes straight from your email app or the official&apos;s website to their office.
        </p>

        <h2>What is saved on your device</h2>
        <ul>
          <li>Your accessibility settings (like text size), so they stay the same next time.</li>
          <li>
            Your list of representatives, for this browser tab only, so the Back button works. It does not include your
            address. It goes away when you close the tab, or when you press &ldquo;Look up a different address.&rdquo;
          </li>
        </ul>

        <h2>What we don&apos;t do</h2>
        <ul>
          <li>No accounts. No sign-in.</li>
          <li>No ads and no ad trackers.</li>
          <li>We don&apos;t sell or share any information about you.</li>
        </ul>

        <h2>Other websites</h2>
        <p>
          Our map uses image tiles from OpenStreetMap. Photos of officials load from public data projects and the Arkansas
          State Legislature website. Links to official websites take you to sites with their own privacy rules.
        </p>
      </div>
    </>
  );
}
