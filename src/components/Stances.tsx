import { formatUpdated } from "@/lib/format";
import { OFFICES } from "@/lib/offices";
import type { StanceFile } from "@/lib/stances";
import type { OfficeKind } from "@/lib/types";
import { ExtLink } from "./PageIntro";

/**
 * "Where they stand": role, committees, their own words, and the bills they sponsored.
 * Every official gets exactly the same sections in the same order.
 */
export function Stances({ data, office, name }: { data: StanceFile | null; office: OfficeKind; name: string }) {
  const info = OFFICES[office];
  const usedAi = data && data.model !== "none";
  const statementCount = data?.topics.reduce((n, t) => n + t.statements.length, 0) ?? 0;
  const billCount = data?.topics.reduce((n, t) => n + t.bills.length, 0) ?? 0;

  return (
    <section aria-labelledby="stand" className="mt-12">
      <h2 id="stand" tabIndex={-1} className="text-3xl font-extrabold outline-none">
        Where they stand
      </h2>
      <p className="mt-2 max-w-[65ch]">
        This shows what {name} does in office, the bills they sponsored, and what they say on their own website. We
        show the facts and their own words. We never say if something is good or bad.
      </p>
      {usedAi && (
        <p className="mt-3 max-w-[65ch] rounded border-2 border-line bg-surface-2 p-4">
          <strong>About this section:</strong> An AI sorted this information into topics and wrote the short plain-English
          lines. It was told to stay neutral and use only the sources below. Quotes are their exact words, and our code
          checked each one against the original page. Always check the original source before you share something.
        </p>
      )}

      <h3 className="mt-8 text-2xl font-extrabold">Their role</h3>
      <ul className="prose-civic mt-2">
        {info.long.map((p) => (
          <li key={p}>{p}</li>
        ))}
        <li>
          <strong>Term:</strong> {info.term}
        </li>
      </ul>
      {data && data.facts.length > 0 && (
        <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
          {data.facts.map((f) => (
            <div key={f.label} className="contents">
              <dt className="font-bold">{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {data && data.committees.length > 0 && (
        <>
          <h3 className="mt-8 text-2xl font-extrabold">Committees they serve on</h3>
          <p className="mt-1 max-w-[65ch] text-ink-muted">
            A committee is a small group of lawmakers that studies bills on one subject before the full vote.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.committees.map((c) => (
              <li key={c.name} className="card px-4 py-3">
                <span lang="en" translate="no">
                  {c.name}
                </span>
                {c.role && <strong> — {c.role}</strong>}
              </li>
            ))}
          </ul>
        </>
      )}

      {!data ? (
        <p className="mt-8 rounded border-2 border-line bg-surface-2 p-4">
          We have not gathered this official&apos;s record yet. See their official page for their bills and positions.
        </p>
      ) : (
        <>
          <h3 className="mt-8 text-2xl font-extrabold">In their own words</h3>
          <p className="mt-1 max-w-[65ch]">{data.ownWords.note}</p>
          {statementCount === 0 && data.ownWords.pages.length > 0 && (
            <ul className="mt-3 list-disc pl-6">
              {data.ownWords.pages.map((p) => (
                <li key={p.url}>
                  <ExtLink href={p.url}>{p.title}</ExtLink>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-8 text-2xl font-extrabold">
            {statementCount > 0 ? "Their positions and bills, by topic" : "Bills they sponsored"}
          </h3>
          <p className="mt-1 max-w-[65ch]">
            {data.billsNote} {billCount === 0 && "We did not find any."}
          </p>
          <p className="mt-1 max-w-[65ch] text-ink-muted">
            A <strong>bill</strong> is an idea for a new law. A <strong>resolution</strong> is a statement by lawmakers,
            like honoring a person, that does not become a law. Sponsoring a bill does not mean it passed.
          </p>

          <div className="mt-4 grid gap-3">
            {data.topics.map((t) => (
              <details key={t.topic} className="card group p-0" open={data.topics.length === 1}>
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-5 py-3 text-lg font-bold">
                  <span>{usedAi ? t.topic : "All bills they sponsored"}</span>
                  <span className="text-base font-normal text-ink-muted">
                    {[
                      t.statements.length && `${t.statements.length} statement${t.statements.length > 1 ? "s" : ""}`,
                      t.bills.length && `${t.bills.length} bill${t.bills.length > 1 ? "s" : ""}`,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </summary>
                <div className="border-t border-line-soft px-5 py-4">
                  {t.statements.length > 0 && (
                    <>
                      <h4 className="font-bold">What they say</h4>
                      <ul className="mt-2 grid gap-3">
                        {t.statements.map((s) => (
                          <li key={s.quote}>
                            <p>{s.summary}</p>
                            <blockquote lang="en" translate="no" className="mt-1 border-l-4 border-line pl-3 text-ink-muted">
                              &ldquo;{s.quote}&rdquo;
                            </blockquote>
                            <p className="mt-1 text-sm">
                              <ExtLink href={s.url}>Source: their official website</ExtLink>
                            </p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {t.bills.length > 0 && (
                    <>
                      {t.statements.length > 0 && <h4 className="mt-4 font-bold">Bills they sponsored</h4>}
                      <ul className="mt-2 grid gap-4">
                        {t.bills.map((b) => (
                          <li key={b.session + b.id}>
                            <p className="font-bold">
                              <ExtLink href={b.url}>{b.id}</ExtLink>
                              <span className="font-normal text-ink-muted"> · {b.session}</span>
                            </p>
                            {b.plain && <p className="mt-1">{b.plain}</p>}
                            <p className="mt-1 text-sm text-ink-muted">
                              <span className="font-semibold">Official title:</span>{" "}
                              <span lang="en" translate="no">
                                {b.title}
                              </span>
                            </p>
                            {b.status && (
                              <p className="mt-1 text-sm">
                                <span className="font-semibold">Latest step:</span>{" "}
                                <span lang="en" translate="no">
                                  {b.status}
                                </span>
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-6 text-sm text-ink-muted">
            <p>
              Sources:{" "}
              {data.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ", "}
                  <ExtLink href={s.url}>{s.name}</ExtLink>
                </span>
              ))}
              . Gathered {formatUpdated(data.generatedAt)}
              {usedAi ? `. Sorted by AI (${data.model}).` : "."}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
