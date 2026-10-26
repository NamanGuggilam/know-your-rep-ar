import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "You're offline" };

export default function OfflinePage() {
  return (
    <div className="prose-civic">
      <h1 className="text-4xl font-extrabold">You&apos;re offline</h1>
      <p className="mt-3 text-xl">
        We need the internet to look up your representatives. These pages still work without it:
      </p>
      <ul>
        <li>
          <Link href="/who-does-what">Who does what</Link>
        </li>
        <li>
          <Link href="/vote">New voter guide</Link>
        </li>
        <li>
          <Link href="/neutral">How we stay neutral</Link>
        </li>
      </ul>
    </div>
  );
}
