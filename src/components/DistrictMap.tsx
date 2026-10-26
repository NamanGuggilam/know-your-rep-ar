"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { DistrictShape } from "@/lib/types";

const Inner = dynamic(() => import("./DistrictMapInner"), {
  ssr: false,
  loading: () => <div className="h-80 w-full rounded bg-surface-2" aria-hidden="true" />,
});

export function DistrictMap({ shapes }: { shapes: DistrictShape[] }) {
  const [active, setActive] = useState(0);
  if (!shapes.length) return null;
  const shape = shapes[Math.min(active, shapes.length - 1)];

  return (
    <section aria-labelledby="map-heading" className="card p-5 simple-hide">
      <h2 id="map-heading" className="text-xl font-extrabold">
        Your districts on a map
      </h2>
      <p className="mt-1 text-ink-muted">
        The shaded area is the district. Pick a district to see its outline.
      </p>
      <div role="group" aria-label="Choose a district to show" className="my-3 flex flex-wrap gap-2">
        {shapes.map((s, i) => (
          <button
            key={s.label}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={`btn ${i === active ? "btn-primary" : "btn-secondary"}`}
          >
            {i === active && <span aria-hidden="true">✓</span>}
            {s.label}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Map is showing {shape.label}.
      </p>
      <figure>
        <figcaption className="sr-only">
          Map of {shape.label}. The district names above give the same information.
        </figcaption>
        <Inner shape={shape} />
      </figure>
      <p className="mt-2 text-sm text-ink-muted">
        District lines from the{" "}
        <a href="https://tigerweb.geo.census.gov/" target="_blank" rel="noopener noreferrer">
          U.S. Census Bureau (TIGERweb)
        </a>
        . Map tiles from OpenStreetMap.
      </p>
    </section>
  );
}
