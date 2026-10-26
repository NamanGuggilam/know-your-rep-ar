"use client";

import { useEffect, useRef, useState } from "react";
import type { LookupResult } from "@/lib/types";
import { formatUpdated } from "@/lib/format";
import { DistrictMap } from "./DistrictMap";
import { AlertIcon, LocateIcon, SearchIcon } from "./icons";
import { RepCard } from "./RepCard";
import { Term } from "./Term";

// We keep the lineup for this browser tab only, so the Back button works.
// The typed address and exact location are never saved.
const SESSION_KEY = "kyr-lineup";
type Saved = Omit<LookupResult, "matchedAddress" | "point"> & { point?: LookupResult["point"] };

function saveSession(r: LookupResult) {
  try {
    const { seats, districts, sources } = r;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ seats, districts, sources, shapes: [] }));
  } catch {}
}

function loadSession(): Saved | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

type Status =
  | { kind: "idle" }
  | { kind: "loading"; message: string }
  | { kind: "error"; message: string };

export function Lookup() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [result, setResult] = useState<Saved | (LookupResult & { fresh: true }) | null>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(loadSession());
  }, []);

  useEffect(() => {
    if (result && "fresh" in result) resultsHeading.current?.focus();
  }, [result]);

  async function run(body: object, message: string) {
    setStatus({ kind: "loading", message });
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", message: data?.error?.message ?? "Something went wrong. Please try again." });
        return;
      }
      saveSession(data);
      setResult({ ...data, fresh: true });
      setStatus({ kind: "idle" });
    } catch {
      setStatus({
        kind: "error",
        message: "We could not reach the internet. Check your connection and try again.",
      });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (address.trim().length < 5) {
      setStatus({
        kind: "error",
        message: "Please type your street address, city, and ZIP code. For example: 123 Main St, Bentonville 72712",
      });
      inputRef.current?.focus();
      return;
    }
    run({ address }, "Looking up your representatives. This can take a few seconds.");
  }

  function useLocation() {
    if (!("geolocation" in navigator)) {
      setStatus({ kind: "error", message: "Your browser cannot share your location. Please type your address instead." });
      return;
    }
    setStatus({ kind: "loading", message: "Asking your device for your location…" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        run(
          { lat: Number(pos.coords.latitude.toFixed(5)), lon: Number(pos.coords.longitude.toFixed(5)) },
          "Looking up your representatives. This can take a few seconds.",
        ),
      () =>
        setStatus({
          kind: "error",
          message: "We could not get your location. That's OK. Please type your address instead.",
        }),
      { timeout: 15000, maximumAge: 600000 },
    );
  }

  function startOver() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    setResult(null);
    setAddress("");
    setStatus({ kind: "idle" });
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const loading = status.kind === "loading";
  const seats = result?.seats ?? [];
  const stateSeats = seats.filter((s) => s.office.startsWith("state"));
  const federalSeats = seats.filter((s) => s.office.startsWith("us"));

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="card p-5 sm:p-6" aria-describedby="privacy-note">
        <label htmlFor="address" className="block text-xl font-extrabold">
          Your home address
        </label>
        <p id="address-hint" className="mt-1 text-ink-muted">
          Street, city, and ZIP code. Example: 123 Main St, Bentonville 72712
        </p>
        <input
          ref={inputRef}
          id="address"
          name="address"
          type="text"
          autoComplete="street-address"
          inputMode="text"
          className="field mt-3"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-describedby={`address-hint${status.kind === "error" ? " address-error" : ""}`}
          aria-invalid={status.kind === "error" ? true : undefined}
        />
        {status.kind === "error" && (
          <p id="address-error" className="mt-3 flex items-start gap-2 rounded-lg border-2 border-line bg-surface-2 p-3 font-semibold" role="alert">
            <AlertIcon className="mt-0.5" />
            <span>{status.message}</span>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <SearchIcon />
            Find my representatives
          </button>
          <button type="button" className="btn btn-secondary" onClick={useLocation} disabled={loading}>
            <LocateIcon />
            Use my location
          </button>
        </div>
        <p id="privacy-note" className="mt-4 text-sm text-ink-muted">
          We use your address once to find your districts. We do not save it.{" "}
          <a href="/privacy">Read our privacy promise</a>.
        </p>
      </form>

      <div aria-live="polite" role="status" className="mt-4">
        {loading && (
          <p className="flex items-center gap-3 font-semibold">
            <span className="inline-block size-5 animate-spin rounded-full border-4 border-accent border-t-transparent" aria-hidden="true" />
            {status.message}
          </p>
        )}
      </div>

      {result && (
        <section aria-labelledby="results-heading" className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="results-heading" ref={resultsHeading} tabIndex={-1} className="text-3xl font-extrabold outline-none">
              Your representatives
            </h2>
            <button type="button" className="btn btn-secondary" onClick={startOver}>
              Look up a different address
            </button>
          </div>
          {"matchedAddress" in result && result.matchedAddress && (
            <p className="mt-2">
              We found this address: <strong>{result.matchedAddress}</strong>
            </p>
          )}
          <p className="mt-2">
            You live in <strong>Congressional District {result.districts.congressional}</strong>,{" "}
            <strong>State Senate District {result.districts.stateSenate}</strong>, and{" "}
            <strong>State House District {result.districts.stateHouse}</strong>. A{" "}
            <Term k="district">district</Term> is the area each official represents.
          </p>
          <p className="mt-3 rounded-xl border-l-4 border-accent bg-accent-soft p-4">
            <strong>Tip:</strong> Roads, schools, or driver&apos;s licenses? Start with your state lawmakers. Social Security,
            veterans benefits, or passports? Start with your members of Congress.
          </p>

          <h3 className="mt-8 text-2xl font-extrabold">In Little Rock: your Arkansas lawmakers</h3>
          <p className="mt-1 text-ink-muted simple-hide">
            They make Arkansas laws. They are part of the <Term k="general-assembly">General Assembly</Term>.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {stateSeats.map((s, i) => (
              <RepCard key={s.official?.id ?? `state-${i}`} seat={s} headingLevel={3} />
            ))}
          </div>

          <h3 className="mt-10 text-2xl font-extrabold">In Washington, D.C.: your members of Congress</h3>
          <p className="mt-1 text-ink-muted simple-hide">
            They make national laws. Together they are part of <Term k="congress">Congress</Term>.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {federalSeats.map((s, i) => (
              <RepCard key={s.official?.id ?? `fed-${i}`} seat={s} headingLevel={3} />
            ))}
          </div>

          {"point" in result && result.point && result.shapes.length > 0 && (
            <div className="mt-10">
              <DistrictMap shapes={result.shapes} point={result.point} />
            </div>
          )}

          <section aria-labelledby="sources-heading" className="mt-8 text-ink-muted simple-hide">
            <h3 id="sources-heading" className="font-bold text-ink">
              Where this information comes from
            </h3>
            <ul className="mt-2 list-disc pl-6">
              {result.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.name}
                  </a>{" "}
                  — last updated {formatUpdated(s.fetchedAt)}
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
        </section>
      )}
    </div>
  );
}
