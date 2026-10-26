import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
import { Term } from "@/components/Term";

export const metadata: Metadata = { title: "How we stay neutral" };

const RULES = [
  {
    title: "Every official gets the same card.",
    body: "Same layout, same buttons, same words. It does not matter who they are or which party they belong to.",
  },
  {
    title: "No party colors.",
    body: "We never use red or blue to show a party. Party is shown only as plain words, like “Party: Republican.”",
  },
  {
    title: "No scores, grades, or ratings.",
    body: "We never say a vote was good or bad. We don't rank officials. We don't endorse anyone.",
  },
  {
    title: "Facts only, with sources.",
    body: "Every name, phone number, and district comes from an official or trusted public source. We show where it came from and when we last checked it.",
  },
  {
    title: "We never make things up.",
    body: "If we can't load the real information, we say so and send you to the official source. We never show fake officials or fake data.",
  },
  {
    title: "AI is labeled, and it never takes sides.",
    body: "When we use AI to explain a bill in plain English, we label it clearly and link to the full official text. The AI is told to describe only what a bill does, never whether it is good or bad.",
  },
  {
    title: "Your message is your own.",
    body: "The “Help me write a message” tool only uses the words you type. It never adds opinions or tells you what to think.",
  },
];

export default function NeutralPage() {
  return (
    <>
      <PageIntro
        title="How we stay neutral"
        bodyId="neutral-body"
        intro="This app is for every Arkansan, no matter what you believe. Here are the rules we follow to stay fair."
      />
      <div id="neutral-body" className="prose-civic">
        <p>
          Being <Term k="nonpartisan">nonpartisan</Term> means we don&apos;t take the side of any party or official. Our
          job is to help you find the facts and reach your representatives. What you think and what you say is up to you.
        </p>
        <ol className="!list-none !pl-0">
          {RULES.map((r, i) => (
            <li key={r.title} className="card mb-3 p-5">
              <h2 className="!mt-0 !text-xl">
                <span aria-hidden="true" className="mr-2 text-accent">
                  {i + 1}.
                </span>
                {r.title}
              </h2>
              <p className="!mb-0">{r.body}</p>
            </li>
          ))}
        </ol>
        <h2>See something that isn&apos;t fair?</h2>
        <p>
          Tell us. We will check it against our rules and fix it. See the <a href="/about#contact">About page</a> for how
          to reach us.
        </p>
      </div>
    </>
  );
}
