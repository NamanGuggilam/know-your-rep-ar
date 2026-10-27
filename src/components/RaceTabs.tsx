"use client";

import { useEffect, useRef, useState } from "react";

export interface RaceTab {
  id: string;
  title: string;
  subtitle: string;
  faces: { src: string; ring: "r" | "d" | "o" }[];
}

const ARROW_KEY_OFFSETS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

type Face = RaceTab["faces"][number];

function useTabFromHash(tabs: RaceTab[], hashPrefix: string) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);

  useEffect(() => {
    const selectTabFromHash = () => {
      const idInHash = window.location.hash.slice(1).replace(hashPrefix, "");
      if (tabs.some((tab) => tab.id === idInHash)) setActiveId(idInHash);
    };
    selectTabFromHash();
    window.addEventListener("hashchange", selectTabFromHash);
    return () => window.removeEventListener("hashchange", selectTabFromHash);
  }, [tabs, hashPrefix]);

  return [activeId, setActiveId] as const;
}

function FaceStack({ faces }: { faces: Face[] }) {
  return (
    <span className="flex flex-none -space-x-3" aria-hidden="true">
      {faces.map((face, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={face.src}
          alt=""
          width={40}
          height={40}
          className={`size-10 rounded-full border-2 bg-surface-2 object-cover party-ring-${face.ring}`}
        />
      ))}
    </span>
  );
}

function TabButton({
  tab,
  isActive,
  onClick,
  onKeyDown,
}: {
  tab: RaceTab;
  isActive: boolean;
  onClick: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}) {
  return (
    <button
      id={`tab-${tab.id}`}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`card flex min-h-20 items-center justify-between gap-3 p-4 text-left ${
        isActive ? "border-accent bg-accent-soft outline-2 outline-accent" : "hover:border-accent"
      }`}
    >
      <span className="min-w-0">
        <span className="block font-display text-lg font-bold">{tab.title}</span>
        <span className="block text-sm text-ink-muted">{tab.subtitle}</span>
      </span>
      {tab.faces.length > 0 && <FaceStack faces={tab.faces} />}
    </button>
  );
}

export function RaceTabs({
  tabs,
  panels,
  label = "Races on your ballot",
  hashPrefix = "race-",
}: {
  tabs: RaceTab[];
  panels: Record<string, React.ReactNode>;
  label?: string;
  hashPrefix?: string;
}) {
  const [activeId, setActiveId] = useTabFromHash(tabs, hashPrefix);
  const panelRef = useRef<HTMLDivElement>(null);

  function selectTab(id: string, scrollToPanel: boolean) {
    setActiveId(id);
    history.replaceState(null, "", `#${hashPrefix}${id}`);
    if (scrollToPanel) requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: "start" }));
  }

  function moveFocusWithArrowKeys(event: React.KeyboardEvent, index: number) {
    const offset = ARROW_KEY_OFFSETS[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const target = tabs[(index + offset + tabs.length) % tabs.length];
    selectTab(target.id, false);
    document.getElementById(`tab-${target.id}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tabs.map((tab, index) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeId}
            onClick={() => selectTab(tab.id, true)}
            onKeyDown={(event) => moveFocusWithArrowKeys(event, index)}
          />
        ))}
      </div>

      <div ref={panelRef} className="scroll-mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={tab.id !== activeId}
          >
            {panels[tab.id]}
          </div>
        ))}
      </div>
    </div>
  );
}
