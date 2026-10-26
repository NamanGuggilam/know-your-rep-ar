"use client";

import { useEffect, useRef, useState } from "react";

export interface RaceTab {
  id: string;
  title: string;
  subtitle: string;
  /** Candidate photos and party colors, for the little faces on the tile */
  faces: { src: string; ring: "r" | "d" | "o" }[];
}

/**
 * Race tiles that work as tabs: pick a race and only that race shows below.
 * The chosen race is kept in the address (#race-...), so the Back button and shared links work.
 */
export function RaceTabs({ tabs, panels }: { tabs: RaceTab[]; panels: Record<string, React.ReactNode> }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace(/^#race-/, "");
      if (tabs.some((t) => t.id === id)) setActive(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  function choose(id: string, focusPanel: boolean) {
    setActive(id);
    history.replaceState(null, "", `#race-${id}`);
    if (focusPanel) requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: "start" }));
  }

  // Arrow keys move between tabs, like other tab controls.
  function onKey(e: React.KeyboardEvent, i: number) {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const t = tabs[(next + tabs.length) % tabs.length];
    choose(t.id, false);
    document.getElementById(`tab-${t.id}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Races on your ballot" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tabs.map((t, i) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => choose(t.id, true)}
              onKeyDown={(e) => onKey(e, i)}
              className={`card flex min-h-20 items-center justify-between gap-3 p-4 text-left ${
                on ? "border-accent bg-accent-soft outline-2 outline-accent" : "hover:border-accent"
              }`}
            >
              <span className="min-w-0">
                <span className="block font-display text-lg font-bold">{t.title}</span>
                <span className="block text-sm text-ink-muted">{t.subtitle}</span>
              </span>
              {t.faces.length > 0 && (
                <span className="flex flex-none -space-x-3" aria-hidden="true">
                  {t.faces.map((f, j) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={j}
                      src={f.src}
                      alt=""
                      width={40}
                      height={40}
                      className={`size-10 rounded-full border-2 bg-surface-2 object-cover party-ring-${f.ring}`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div ref={panelRef} className="scroll-mt-4">
        {tabs.map((t) => (
          <div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={t.id !== active}>
            {panels[t.id]}
          </div>
        ))}
      </div>
    </div>
  );
}
