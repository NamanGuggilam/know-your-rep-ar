"use client";

import Link from "next/link";
import { useState } from "react";
import { OFFICES } from "@/lib/offices";
import type { Seat } from "@/lib/types";
import { AlertIcon, ExternalIcon, GlobeIcon, MailIcon, PencilIcon, PersonIcon, PhoneIcon, PinIcon } from "./icons";
import { formatUpdated, telHref } from "@/lib/format";

export function RepPhoto({ src, name, size = 112 }: { src?: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className="flex flex-none items-center justify-center rounded-xl bg-surface-2 text-ink-muted"
        style={{ width: size, height: size * 1.2 }}
        role="img"
        aria-label={`No photo available for ${name}`}
      >
        <PersonIcon size={size / 2.5} />
      </div>
    );
  }
  return (
    // Photos come from public datasets on other domains, so a plain img keeps it simple.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Photo of ${name}`}
      width={size}
      height={size * 1.2}
      loading="lazy"
      onError={() => setFailed(true)}
      className="flex-none rounded-xl bg-surface-2 object-cover"
      style={{ width: size, height: size * 1.2 }}
    />
  );
}

export function RepCard({ seat, headingLevel = 3 }: { seat: Seat; headingLevel?: 2 | 3 }) {
  const info = OFFICES[seat.office];
  const o = seat.official;
  const H = `h${headingLevel}` as "h2" | "h3";

  if (!o) {
    return (
      <article className="card p-5">
        <p className="font-semibold text-ink-muted">
          {info.name}
          {seat.district ? ` · ${seat.district}` : ""}
        </p>
        <H className="mt-1 flex items-center gap-2 text-xl font-extrabold">
          <AlertIcon /> No current member found
        </H>
        <p className="mt-2">{seat.missingNote}</p>
        {seat.missingLink && (
          <p className="mt-2">
            <a href={seat.missingLink.url} target="_blank" rel="noopener noreferrer">
              {seat.missingLink.label}
              <ExternalIcon className="ml-1 inline" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        )}
      </article>
    );
  }

  const cardId = `card-${o.id}`;
  const firstAddress = o.addresses.find((a) => a.lines.length);
  const mapQuery = firstAddress ? encodeURIComponent(firstAddress.lines.join(", ")) : "";

  return (
    <article className="card flex flex-col p-5" aria-labelledby={`${cardId}-name`}>
      <div id={cardId}>
        <div className="flex gap-4">
          <RepPhoto src={o.photoUrl} name={o.name} size={96} />
          <div className="min-w-0">
            <p className="font-semibold text-ink-muted">{o.title}</p>
            <H id={`${cardId}-name`} className="text-2xl leading-tight font-extrabold">
              {o.name}
            </H>
            {o.district && <p className="mt-1">{o.district}</p>}
            <p className="mt-1">Party: {o.party}</p>
          </div>
        </div>
        <p className="mt-4">
          <strong>What this person does: </strong>
          {info.short}{" "}
          <Link href={`/who-does-what#${seat.office}`} className="simple-hide">
            Learn more<span className="sr-only"> about what a {info.name} does</span>
          </Link>
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {o.phone && (
          <a className="btn btn-primary" href={telHref(o.phone)}>
            <PhoneIcon />
            Call {o.phone}
          </a>
        )}
        {o.email ? (
          <a className="btn btn-primary" href={`mailto:${o.email}`}>
            <MailIcon />
            Email
          </a>
        ) : o.contactFormUrl ? (
          <a className="btn btn-primary" href={o.contactFormUrl} target="_blank" rel="noopener noreferrer">
            <MailIcon />
            Contact form<span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : o.website ? (
          <a className="btn btn-primary" href={o.website} target="_blank" rel="noopener noreferrer">
            <GlobeIcon />
            Website (to send a message)<span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
        {firstAddress && (
          <a
            className="btn btn-secondary simple-hide"
            href={`https://www.openstreetmap.org/search?query=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <PinIcon />
            Office on a map<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        <Link className="btn btn-secondary" href={`/rep/${o.id}#write`}>
          <PencilIcon />
          Help me write a message
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-line-soft pt-3">
        <Link href={`/rep/${o.id}`} className="font-semibold">
          All contact info<span className="sr-only"> for {o.name}</span>
        </Link>
      </div>
      <p className="mt-3 text-sm text-ink-muted simple-hide">
        Source:{" "}
        <a href={o.source.url} target="_blank" rel="noopener noreferrer">
          {o.source.name.split(" (")[0]}
        </a>
        . Last updated {formatUpdated(o.source.fetchedAt)}.
      </p>
    </article>
  );
}
