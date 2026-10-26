import Link from "next/link";

export default function NotFound() {
  return (
    <div className="prose-civic">
      <h1 className="text-4xl font-extrabold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-xl">The link may be old, or the official may no longer be in office.</p>
      <p>
        <Link href="/">Go back and look up your representatives</Link>
      </p>
    </div>
  );
}
