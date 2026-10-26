import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchBox } from "@/components/SearchBox";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <>
      <p className="eyebrow">Search</p>
      <h1 className="mt-2 text-5xl leading-tight font-bold">Find anyone or anything</h1>
      <p className="mt-4 max-w-[60ch] text-xl text-ink-muted">
        Search every candidate, every Arkansas lawmaker and member of Congress, the committees they serve on, the bills
        they sponsored, and the powers of each office.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <SearchBox />
        </Suspense>
      </div>
    </>
  );
}
