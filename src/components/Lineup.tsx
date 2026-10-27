"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatUpdated } from "@/lib/format";
import { clearLineup, loadLineup, type SavedLineup } from "@/lib/session";
import { DistrictMap } from "./DistrictMap";
import { RepCard } from "./RepCard";
import { ResultsTabs } from "./ResultsTabs";
import { Term } from "./Term";

function useFocusWhenReady<T extends HTMLElement>(isReady: boolean) {
  const elementRef = useRef<T>(null);
  useEffect(() => {
    if (isReady) elementRef.current?.focus();
  }, [isReady]);
  return elementRef;
}

const STATE_OFFICE_PREFIX = "state";
const FEDERAL_OFFICE_PREFIX = "us";

type Seat = SavedLineup["seats"][number];

function SeatGroup({
  title,
  titleClassName,
  keyPrefix,
  seats,
  children,
}: {
  title: string;
  titleClassName: string;
  keyPrefix: string;
  seats: Seat[];
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 className={titleClassName}>{title}</h2>
      <p className="mt-1 text-ink-muted simple-hide">{children}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {seats.map((seat, index) => (
          <RepCard key={seat.official?.id ?? `${keyPrefix}-${index}`} seat={seat} headingLevel={3} />
        ))}
      </div>
    </>
  );
}

export function Lineup() {
  const router = useRouter();
  const [lineup, setLineup] = useState<SavedLineup | null | undefined>(undefined);
  const headingRef = useFocusWhenReady<HTMLHeadingElement>(Boolean(lineup));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLineup(loadLineup());
  }, []);

  if (lineup === undefined) {
    return (
      <p role="status" className="font-semibold">
        Loading your representatives…
      </p>
    );
  }

  if (lineup === null) {
    return (
      <div className="prose-civic">
        <h1 className="text-4xl font-extrabold">Your representatives</h1>
        <p className="mt-3 text-xl">We don&apos;t have an address for this visit yet.</p>
        <p>
          <Link href="/">Type your address to see who represents you.</Link>
        </p>
      </div>
    );
  }

  const stateSeats = lineup.seats.filter((seat) => seat.office.startsWith(STATE_OFFICE_PREFIX));
  const federalSeats = lineup.seats.filter((seat) => seat.office.startsWith(FEDERAL_OFFICE_PREFIX));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-4xl font-extrabold outline-none">
          Your representatives
        </h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            clearLineup();
            router.push("/");
          }}
        >
          Look up a different address
        </button>
      </div>
      <p className="mt-3 mb-8 text-lg text-ink-muted">
        The people who speak for you now. Tap <strong className="text-ink">See where they stand</strong> for their
        record.
      </p>
      <ResultsTabs active="reps" />

      <SeatGroup
        title="In Little Rock: your Arkansas lawmakers"
        titleClassName="text-2xl font-extrabold"
        keyPrefix="state"
        seats={stateSeats}
      >
        They make Arkansas laws. They are part of the <Term k="general-assembly">General Assembly</Term>.
      </SeatGroup>

      <SeatGroup
        title="In Washington, D.C.: your members of Congress"
        titleClassName="mt-10 text-2xl font-extrabold"
        keyPrefix="fed"
        seats={federalSeats}
      >
        They make national laws. Together they are part of <Term k="congress">Congress</Term>.
      </SeatGroup>

      {lineup.shapes.length > 0 && (
        <div className="mt-10">
          <DistrictMap shapes={lineup.shapes} />
        </div>
      )}

      <section aria-labelledby="sources-heading" className="mt-8 text-ink-muted simple-hide">
        <h2 id="sources-heading" className="font-bold text-ink">
          Where this information comes from
        </h2>
        <ul className="mt-2 list-disc pl-6">
          {lineup.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.name}
              </a>{" "}
              — last updated {formatUpdated(source.fetchedAt)}
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Something wrong? The official sources are always the final word. Check the{" "}
          <a href="https://www.arkleg.state.ar.us/Legislators/List" target="_blank" rel="noopener noreferrer">
            Arkansas State Legislature
          </a>
          ,{" "}
          <a href="https://www.house.gov/representatives" target="_blank" rel="noopener noreferrer">
            House.gov
          </a>{" "}
          and{" "}
          <a href="https://www.senate.gov/senators/senators-contact.htm" target="_blank" rel="noopener noreferrer">
            Senate.gov
          </a>
          .
        </p>
      </section>
    </div>
  );
}
