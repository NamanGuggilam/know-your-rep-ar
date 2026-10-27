"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const AUTO_REFRESH_INTERVAL_MS = 120_000;

export function ResultsRefresh({ auto }: { auto: boolean }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [autoRefreshOn, setAutoRefreshOn] = useState(auto);

  useEffect(() => {
    if (!autoRefreshOn) return;
    const timer = setInterval(() => startRefresh(() => router.refresh()), AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [autoRefreshOn, router]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="btn btn-primary" onClick={() => startRefresh(() => router.refresh())} disabled={isRefreshing}>
        {isRefreshing ? "Refreshing…" : "Refresh results"}
      </button>
      {auto && (
        <label className="inline-flex min-h-12 items-center gap-2 font-semibold">
          <input type="checkbox" checked={autoRefreshOn} onChange={(event) => setAutoRefreshOn(event.target.checked)} className="size-5 accent-[var(--accent)]" />
          Update automatically every 2 minutes
        </label>
      )}
    </div>
  );
}
