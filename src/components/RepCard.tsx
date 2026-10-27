"use client";

import Link from "next/link";
import { useState } from "react";
import { OFFICES } from "@/lib/offices";
import { partyKey } from "@/lib/party";
import { PartyBadge } from "./PartyBadge";
import type { Seat } from "@/lib/types";
import { AlertIcon, ExternalIcon, GlobeIcon, InfoIcon, MailIcon, PencilIcon, PersonIcon, PhoneIcon, PinIcon } from "./icons";
import { formatUpdated, telHref } from "@/lib/format";

const PHOTO_HEIGHT_RATIO = 1.2;
const PLACEHOLDER_ICON_RATIO = 1 / 2.5;

export function RepPhoto({ src, name, size = 112 }: { src?: string; name: string; size?: number }) {
  const [failedToLoad, setFailedToLoad] = useState(false);
  const height = size * PHOTO_HEIGHT_RATIO;
  if (!src || failedToLoad) {
    return (
      <div
        className="flex flex-none items-center justify-center rounded bg-surface-2 text-ink-muted"
        style={{ width: size, height }}
        role="img"
        aria-label={`No photo available for ${name}`}
      >
        <PersonIcon size={size * PLACEHOLDER_ICON_RATIO} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Photo of ${name}`}
      width={size}
      height={height}
      loading="lazy"
      onError={() => setFailedToLoad(true)}
      className="flex-none rounded bg-surface-2 object-cover"
      style={{ width: size, height }}
    />
  );
}

type Official = NonNullable<Seat["official"]>;

function MissingSeatCard({ seat, officeName, Heading }: { seat: Seat; officeName: string; Heading: "h2" | "h3" }) {
  return (
    <article className="card p-5">
      <p className="font-semibold text-ink-muted">
        {officeName}
        {seat.district ? ` · ${seat.district}` : ""}
      </p>
      <Heading className="mt-1 flex items-center gap-2 text-xl font-extrabold">
        <AlertIcon /> No current member found
      </Heading>
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

/** The best single way to reach this official: email, else contact form, else website. */
function PrimaryContactButton({ official }: { official: Official }) {
  if (official.email) {
    return (
      <a className="btn btn-secondary" href={`mailto:${official.email}`}>
        <MailIcon />
        Email
      </a>
    );
  }
  if (official.contactFormUrl) {
    return (
      <a className="btn btn-secondary" href={official.contactFormUrl} target="_blank" rel="noopener noreferrer">
        <MailIcon />
        Contact form<span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  if (official.website) {
    return (
      <a className="btn btn-secondary" href={official.website} target="_blank" rel="noopener noreferrer">
        <GlobeIcon />
        Website<span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return null;
}

export function RepCard({ seat, headingLevel = 3 }: { seat: Seat; headingLevel?: 2 | 3 }) {
  const office = OFFICES[seat.office];
  const official = seat.official;
  const Heading = `h${headingLevel}` as "h2" | "h3";

  if (!official) return <MissingSeatCard seat={seat} officeName={office.name} Heading={Heading} />;

  const cardId = `card-${official.id}`;
  const firstAddress = official.addresses.find((address) => address.lines.length);
  const mapQuery = firstAddress ? encodeURIComponent(firstAddress.lines.join(", ")) : "";
  const sourceDisplayName = official.source.name.split(" (")[0];

  return (
    <article
      className={`card flex flex-col p-5 party-bar-${partyKey(official.party)}`}
      aria-labelledby={`${cardId}-name`}
    >
      <div id={cardId}>
        <div className="flex gap-4">
          <RepPhoto src={official.photoUrl} name={official.name} size={96} />
          <div className="min-w-0">
            <p className="font-semibold text-ink-muted">{official.title}</p>
            <Heading id={`${cardId}-name`} className="text-2xl leading-tight font-extrabold">
              {official.name}
            </Heading>
            {official.district && <p className="mt-1">{official.district}</p>}
            <p className="mt-2">
              <PartyBadge party={official.party} />
            </p>
          </div>
        </div>
        <p className="mt-4">
          <strong>What this person does: </strong>
          {office.short}{" "}
          <Link href={`/who-does-what#${seat.office}`} className="simple-hide">
            Learn more<span className="sr-only"> about what a {office.name} does</span>
          </Link>
        </p>
      </div>

      <Link className="btn btn-primary mt-5 w-full" href={`/rep/${official.id}#stand`}>
        <InfoIcon />
        See where they stand
      </Link>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {official.phone && (
          <a className="btn btn-secondary" href={telHref(official.phone)}>
            <PhoneIcon />
            Call {official.phone}
          </a>
        )}
        <PrimaryContactButton official={official} />
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
        <Link className="btn btn-secondary" href={`/rep/${official.id}#write`}>
          <PencilIcon />
          Write a message
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-line-soft pt-3">
        <Link href={`/rep/${official.id}`} className="font-semibold">
          All contact info<span className="sr-only"> for {official.name}</span>
        </Link>
      </div>
      <p className="mt-3 text-sm text-ink-muted simple-hide">
        Source:{" "}
        <a href={official.source.url} target="_blank" rel="noopener noreferrer">
          {sourceDisplayName}
        </a>
        . Last updated {formatUpdated(official.source.fetchedAt)}.
      </p>
    </article>
  );
}
