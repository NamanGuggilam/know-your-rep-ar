import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalIcon, GlobeIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { MessageHelper } from "@/components/MessageHelper";
import { RepPhoto } from "@/components/RepCard";
import { formatUpdated, telHref } from "@/lib/format";
import { OFFICES } from "@/lib/offices";
import { getAllOfficials, getOfficialById } from "@/lib/officials";

export async function generateStaticParams() {
  const all = await getAllOfficials();
  return all.map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: PageProps<"/rep/[id]">): Promise<Metadata> {
  const o = await getOfficialById((await params).id);
  return { title: o ? `${o.name}, ${o.title}` : "Official not found" };
}

export default async function RepPage({ params }: PageProps<"/rep/[id]">) {
  const o = await getOfficialById((await params).id);
  if (!o) notFound();
  const info = OFFICES[o.office];

  return (
    <article>
      <p className="mb-4">
        <Link href="/">← Back to your representatives</Link>
      </p>
      <div className="flex flex-wrap gap-5">
        <RepPhoto src={o.photoUrl} name={o.name} size={140} />
        <div>
          <p className="font-semibold text-ink-muted">{o.title}</p>
          <h1 className="text-4xl leading-tight font-extrabold">{o.name}</h1>
          {o.district && <p className="mt-1 text-lg">{o.district}</p>}
          <p className="mt-1 text-lg">Party: {o.party}</p>
          <p className="mt-3 max-w-[60ch]">
            <strong>What this person does: </strong>
            {info.short}
          </p>
        </div>
      </div>

      <section aria-labelledby="contact-heading" className="mt-10">
        <h2 id="contact-heading" className="text-2xl font-extrabold">
          How to contact {o.name}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {o.phone && (
            <a className="btn btn-primary" href={telHref(o.phone)}>
              <PhoneIcon />
              Call {o.phone}
            </a>
          )}
          {o.email && (
            <a className="btn btn-primary" href={`mailto:${o.email}`}>
              <MailIcon />
              Email {o.email}
            </a>
          )}
          {o.contactFormUrl && (
            <a className="btn btn-primary" href={o.contactFormUrl} target="_blank" rel="noopener noreferrer">
              <MailIcon />
              Online contact form<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          {o.website && (
            <a className="btn btn-secondary" href={o.website} target="_blank" rel="noopener noreferrer">
              <GlobeIcon />
              Official website<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>

        {o.addresses.length > 0 && (
          <>
            <h3 id="offices" className="mt-8 text-xl font-extrabold">
              Offices
            </h3>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              {o.addresses.map((a) => (
                <li key={a.label + a.lines.join()} className="card p-4">
                  <p className="font-bold">{a.label}</p>
                  {a.lines.length > 0 && (
                    <address className="not-italic">
                      {a.lines.map((l) => (
                        <span key={l} className="block">
                          {l}
                        </span>
                      ))}
                    </address>
                  )}
                  {a.phone && (
                    <p className="mt-1">
                      Phone: <a href={telHref(a.phone)}>{a.phone}</a>
                    </p>
                  )}
                  {a.hours && <p className="mt-1">Hours: {a.hours}</p>}
                  {a.lines.length > 0 && (
                    <a
                      className="mt-2 inline-flex min-h-11 items-center gap-1"
                      href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(a.lines.join(", "))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <PinIcon size={18} />
                      See on a map<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {o.officialPageUrl && o.officialPageUrl !== o.website && (
          <p className="mt-6">
            Most up-to-date contact details:{" "}
            <a href={o.officialPageUrl} target="_blank" rel="noopener noreferrer">
              {o.name}&apos;s official page on the Arkansas State Legislature website
              <ExternalIcon className="ml-1 inline" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        )}
      </section>

      <section aria-labelledby="write" className="mt-12">
        <h2 id="write" tabIndex={-1} className="text-2xl font-extrabold">
          Help me write a message to {info.honorific} {o.name}
        </h2>
        <p className="mt-2 max-w-[60ch]">
          Answer three short questions. We will turn your answers into a polite message you can change, copy, and send.
        </p>
        <div className="mt-4">
          <MessageHelper
            official={{
              name: o.name,
              office: o.office,
              email: o.email,
              contactFormUrl: o.contactFormUrl,
              website: o.website,
            }}
          />
        </div>
      </section>

      <p className="mt-12 text-sm text-ink-muted">
        Source:{" "}
        <a href={o.source.url} target="_blank" rel="noopener noreferrer">
          {o.source.name}
        </a>
        . Last updated {formatUpdated(o.source.fetchedAt)}.
      </p>
    </article>
  );
}
