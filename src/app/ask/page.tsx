import type { Metadata } from "next";
import Link from "next/link";
import { AskBox } from "@/components/AskBox";

export const metadata: Metadata = { title: "Ask a question" };

export default function AskPage() {
  return (
    <>
      <p className="eyebrow">Ask</p>
      <h1 className="mt-2 text-5xl leading-tight font-bold">Ask a question</h1>
      <p className="mt-4 max-w-[60ch] text-xl text-ink-muted">
        Ask in your own words. Our AI helper answers only from this app&apos;s sources and links to them. It will never
        tell you who to vote for. <Link href="/neutral">How we stay fair</Link>
      </p>
      <div className="mt-8">
        <AskBox />
      </div>
    </>
  );
}
