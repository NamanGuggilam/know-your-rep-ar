"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/** Refresh button, plus a quiet automatic refresh every two minutes while results are unofficial. */
export function ResultsRefresh({ auto }: { auto: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [on, setOn] = useState(auto);

  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => start(() => router.refresh()), 120_000);
    return () => clearInterval(t);
  }, [on, router]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="btn btn-primary" onClick={() => start(() => router.refresh())} disabled={pending}>
        {pending ? "Refreshing…" : "Refresh results"}
      </button>
      {auto && (
        <label className="inline-flex min-h-12 items-center gap-2 font-semibold">
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="size-5 accent-[var(--accent)]" />
          Update automatically every 2 minutes
        </label>
      )}
    </div>
  );
}
