"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { saveLineup } from "@/lib/session";
import { AlertIcon, LocateIcon, SearchIcon } from "./icons";

type Status = { kind: "idle" } | { kind: "loading"; message: string } | { kind: "error"; message: string };

/** Address form. On success, saves the lineup for this tab and opens the results page. */
export function LookupForm() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function run(body: object) {
    setStatus({ kind: "loading", message: "Looking up your representatives. This can take a few seconds." });
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", message: data?.error?.message ?? "Something went wrong. Please try again." });
        inputRef.current?.focus();
        return;
      }
      saveLineup(data);
      const d = data.districts;
      router.push(`/ballot?cd=${d.congressional}&ss=${d.stateSenate}&sh=${d.stateHouse}`);
    } catch {
      setStatus({ kind: "error", message: "We could not reach the internet. Check your connection and try again." });
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
    run({ address });
  }

  function useLocation() {
    if (!("geolocation" in navigator)) {
      setStatus({ kind: "error", message: "Your browser cannot share your location. Please type your address instead." });
      return;
    }
    setStatus({ kind: "loading", message: "Asking your device for your location…" });
    navigator.geolocation.getCurrentPosition(
      (pos) => run({ lat: Number(pos.coords.latitude.toFixed(5)), lon: Number(pos.coords.longitude.toFixed(5)) }),
      () =>
        setStatus({
          kind: "error",
          message: "We could not get your location. That's OK. Please type your address instead.",
        }),
      { timeout: 15000, maximumAge: 600000 },
    );
  }

  const loading = status.kind === "loading";

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="panel p-5 sm:p-6">
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
          className="field mt-3"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-describedby={`address-hint${status.kind === "error" ? " address-error" : ""}`}
          aria-invalid={status.kind === "error" ? true : undefined}
        />
        {status.kind === "error" && (
          <p
            id="address-error"
            className="mt-3 flex items-start gap-2 rounded border-2 border-line bg-surface-2 p-3 font-semibold"
            role="alert"
          >
            <AlertIcon className="mt-0.5" />
            <span>{status.message}</span>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <SearchIcon />
            Show my ballot
          </button>
          <button type="button" className="btn btn-secondary" onClick={useLocation} disabled={loading}>
            <LocateIcon />
            Use my location
          </button>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          We use your address once to find your districts. We do not save it.{" "}
          <Link href="/privacy">Read our privacy promise</Link>.
        </p>
      </form>

      <div aria-live="polite" role="status" className="mt-4">
        {loading && (
          <p className="flex items-center gap-3 font-semibold">
            <span
              className="inline-block size-5 animate-spin rounded-full border-4 border-accent border-t-transparent"
              aria-hidden="true"
            />
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
