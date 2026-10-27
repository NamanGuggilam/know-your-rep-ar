"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { saveLineup } from "@/lib/session";
import { AlertIcon, LocateIcon, SearchIcon } from "./icons";

type Status = { kind: "idle" } | { kind: "loading"; message: string } | { kind: "error"; message: string };

const MIN_ADDRESS_LENGTH = 5;
const COORDINATE_DECIMALS = 5;
const GEOLOCATION_TIMEOUT_MS = 15_000;
const GEOLOCATION_MAX_AGE_MS = 600_000;

const MESSAGE_LOOKING_UP = "Looking up your representatives. This can take a few seconds.";
const MESSAGE_GENERIC_FAILURE = "Something went wrong. Please try again.";
const MESSAGE_OFFLINE = "We could not reach the internet. Check your connection and try again.";
const MESSAGE_ADDRESS_TOO_SHORT =
  "Please type your street address, city, and ZIP code. For example: 123 Main St, Bentonville 72712";
const MESSAGE_NO_GEOLOCATION = "Your browser cannot share your location. Please type your address instead.";
const MESSAGE_ASKING_LOCATION = "Asking your device for your location…";
const MESSAGE_LOCATION_DENIED = "We could not get your location. That's OK. Please type your address instead.";

type LookupRequest = { address: string } | { lat: number; lon: number };

function roundCoordinate(value: number) {
  return Number(value.toFixed(COORDINATE_DECIMALS));
}

export function LookupForm() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function lookUp(request: LookupRequest) {
    setStatus({ kind: "loading", message: MESSAGE_LOOKING_UP });
    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus({ kind: "error", message: data?.error?.message ?? MESSAGE_GENERIC_FAILURE });
        inputRef.current?.focus();
        return;
      }
      saveLineup(data);
      const { congressional, stateSenate, stateHouse } = data.districts;
      router.push(`/ballot?cd=${congressional}&ss=${stateSenate}&sh=${stateHouse}`);
    } catch {
      setStatus({ kind: "error", message: MESSAGE_OFFLINE });
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (address.trim().length < MIN_ADDRESS_LENGTH) {
      setStatus({ kind: "error", message: MESSAGE_ADDRESS_TOO_SHORT });
      inputRef.current?.focus();
      return;
    }
    lookUp({ address });
  }

  function useLocation() {
    if (!("geolocation" in navigator)) {
      setStatus({ kind: "error", message: MESSAGE_NO_GEOLOCATION });
      return;
    }
    setStatus({ kind: "loading", message: MESSAGE_ASKING_LOCATION });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => lookUp({ lat: roundCoordinate(coords.latitude), lon: roundCoordinate(coords.longitude) }),
      () => setStatus({ kind: "error", message: MESSAGE_LOCATION_DENIED }),
      { timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: GEOLOCATION_MAX_AGE_MS },
    );
  }

  const loading = status.kind === "loading";
  const hasError = status.kind === "error";

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
          onChange={(event) => setAddress(event.target.value)}
          aria-describedby={`address-hint${hasError ? " address-error" : ""}`}
          aria-invalid={hasError ? true : undefined}
        />
        {hasError && (
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
