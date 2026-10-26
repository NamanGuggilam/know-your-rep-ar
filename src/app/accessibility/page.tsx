import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = { title: "Accessibility statement" };

export default function AccessibilityPage() {
  return (
    <>
      <PageIntro
        title="Accessibility statement"
        intro="Know Your Rep AR is built so that everyone can use it, including people with disabilities."
      />
      <div id="a11y-body" className="prose-civic">
        <p>
          Our goal is to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA, and go further where we can.
        </p>

        <h2>Tools you can turn on</h2>
        <p>Press the &ldquo;Accessibility&rdquo; button at the top of any page to:</p>
        <ul>
          <li>Make text bigger (4 sizes)</li>
          <li>Switch to light, dark, or high contrast colors</li>
          <li>Use the OpenDyslexic font</li>
          <li>Add more space between lines</li>
          <li>Turn on Simple mode, with fewer things on screen and bigger buttons</li>
          <li>Reduce motion</li>
        </ul>
        <p>Your settings are saved on your device.</p>

        <h2>Built in everywhere</h2>
        <ul>
          <li>The main font is Atkinson Hyperlegible, made for people with low vision. Body text is at least 18 pixels.</li>
          <li>Everything works with a keyboard. You can always see where you are.</li>
          <li>A &ldquo;Skip to main content&rdquo; link is the first thing on every page.</li>
          <li>Pages use real headings, labels, and landmarks, so screen readers like VoiceOver and NVDA can read them.</li>
          <li>Loading and results are announced to screen readers.</li>
          <li>Buttons are large and easy to tap, and always have words, not just icons.</li>
          <li>We never use color alone to show meaning.</li>
          <li>Hard words have a tap-to-see meaning.</li>
          <li>We write at about a 6th to 8th grade reading level.</li>
          <li>There are no time limits.</li>
        </ul>

        <h2>How we test</h2>
        <ul>
          <li>Automated checks with axe-core on every main page, at phone and desktop sizes.</li>
          <li>Keyboard-only testing of the main tasks.</li>
          <li>Hand testing with the VoiceOver screen reader.</li>
          <li>Checks at 200% zoom and at phone width.</li>
        </ul>

        <h2>Known limits</h2>
        <ul>
          <li>The district map is a picture. The same facts are written out in words above it.</li>
          <li>Official websites we link to are run by others and may be less accessible.</li>
        </ul>

        <h2>Tell us about a problem</h2>
        <p>
          If something is hard to use, we want to know. See the <a href="/about#contact">About page</a> for how to reach
          us.
        </p>
      </div>
    </>
  );
}
