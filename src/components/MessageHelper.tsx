"use client";

import { useState } from "react";
import { buildMessage, buildSubject, type MessageInput } from "@/lib/message";
import type { Official } from "@/lib/types";
import { CheckIcon, CopyIcon, ExternalIcon, MailIcon } from "./icons";

const ISSUE_IDEAS = [
  "schools",
  "roads and traffic",
  "health care",
  "jobs and wages",
  "housing",
  "farming",
  "public safety",
  "veterans",
  "the environment",
  "a bill being voted on",
];

const DRAFT_FIELD_ID = "msg-draft";
const DRAFT_HEADING_ID = "msg-draft-heading";

type Props = Pick<Official, "name" | "office" | "email" | "contactFormUrl" | "website">;

function selectDraftText() {
  const draftField = document.getElementById(DRAFT_FIELD_ID) as HTMLTextAreaElement | null;
  draftField?.select();
}

export function MessageHelper({ official }: { official: Props }) {
  const [form, setForm] = useState<MessageInput>({ issue: "", why: "", ask: "", name: "", town: "" });
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [missing, setMissing] = useState(false);

  const fieldChangeHandler =
    (field: keyof MessageInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  function generateDraft(event: React.FormEvent) {
    event.preventDefault();
    if (!form.issue.trim()) {
      setMissing(true);
      document.getElementById("msg-issue")?.focus();
      return;
    }
    setMissing(false);
    setDraft(buildMessage(official, form));
    setCopied(false);
    requestAnimationFrame(() => document.getElementById(DRAFT_HEADING_ID)?.focus());
  }

  async function copyWithFallback() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      selectDraftText();
    }
  }

  const mailtoLink =
    draft && official.email
      ? `mailto:${official.email}?subject=${encodeURIComponent(buildSubject(form))}&body=${encodeURIComponent(draft)}`
      : null;
  const hasEmail = Boolean(official.email);
  const contactFormUrl = official.contactFormUrl ?? (hasEmail ? undefined : official.website);

  return (
    <div>
      <p className="rounded border-l-4 border-accent bg-accent-soft p-4">
        <strong>Tip:</strong> Short, personal messages work best. You don&apos;t need fancy words. Just say what matters to
        you and what you want them to do.
      </p>

      <form onSubmit={generateDraft} noValidate className="mt-5 grid gap-5">
        <div>
          <label htmlFor="msg-issue" className="block text-lg font-bold">
            1. What issue do you want to write about? <span className="font-normal">(required)</span>
          </label>
          <p id="msg-issue-hint" className="text-ink-muted">
            A few words is fine. Ideas: {ISSUE_IDEAS.join(", ")}.
          </p>
          <input
            id="msg-issue"
            className="field mt-2"
            value={form.issue}
            onChange={fieldChangeHandler("issue")}
            list="issue-ideas"
            aria-describedby={`msg-issue-hint${missing ? " msg-issue-error" : ""}`}
            aria-invalid={missing || undefined}
            aria-required="true"
          />
          <datalist id="issue-ideas">
            {ISSUE_IDEAS.map((idea) => (
              <option key={idea} value={idea} />
            ))}
          </datalist>
          {missing && (
            <p id="msg-issue-error" role="alert" className="mt-2 font-semibold">
              Please tell us the issue first. Even one word is enough.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="msg-why" className="block text-lg font-bold">
            2. Why does it matter to you?
          </label>
          <p id="msg-why-hint" className="text-ink-muted">
            Share your own story. Example: &ldquo;My kids ride the bus on this road every day.&rdquo;
          </p>
          <textarea id="msg-why" rows={4} className="field mt-2" value={form.why} onChange={fieldChangeHandler("why")} aria-describedby="msg-why-hint" />
        </div>
        <div>
          <label htmlFor="msg-ask" className="block text-lg font-bold">
            3. What do you want them to do?
          </label>
          <p id="msg-ask-hint" className="text-ink-muted">
            Example: &ldquo;Please vote yes on this bill,&rdquo; or &ldquo;Please look into this problem.&rdquo;
          </p>
          <textarea id="msg-ask" rows={3} className="field mt-2" value={form.ask} onChange={fieldChangeHandler("ask")} aria-describedby="msg-ask-hint" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="msg-name" className="block text-lg font-bold">
              Your name <span className="font-normal">(optional)</span>
            </label>
            <input id="msg-name" className="field mt-2" autoComplete="name" value={form.name} onChange={fieldChangeHandler("name")} />
          </div>
          <div>
            <label htmlFor="msg-town" className="block text-lg font-bold">
              Your city or town <span className="font-normal">(optional)</span>
            </label>
            <input id="msg-town" className="field mt-2" autoComplete="address-level2" value={form.town} onChange={fieldChangeHandler("town")} aria-describedby="msg-town-hint" />
            <p id="msg-town-hint" className="mt-1 text-ink-muted">
              This tells their office you live in their district.
            </p>
          </div>
        </div>
        <p className="text-ink-muted">Nothing you type here is sent to us or saved. It stays on your device.</p>
        <div>
          <button type="submit" className="btn btn-primary">
            {draft ? "Update my message" : "Write my message"}
          </button>
        </div>
      </form>

      {draft !== null && (
        <section aria-labelledby={DRAFT_HEADING_ID} className="mt-8">
          <h3 id={DRAFT_HEADING_ID} tabIndex={-1} className="text-xl font-extrabold outline-none">
            Your message is ready
          </h3>
          <p className="mt-1 text-ink-muted">You can change anything in the box below before you send it.</p>
          <label htmlFor={DRAFT_FIELD_ID} className="sr-only">
            Your message
          </label>
          <textarea
            id={DRAFT_FIELD_ID}
            rows={14}
            className="field mt-3 font-[inherit]"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setCopied(false);
            }}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={copyWithFallback}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied!" : "Copy message"}
            </button>
            {mailtoLink && (
              <a className="btn btn-primary" href={mailtoLink}>
                <MailIcon />
                Send by email
              </a>
            )}
            {contactFormUrl && (
              <a className="btn btn-secondary" href={contactFormUrl} target="_blank" rel="noopener noreferrer" onClick={copyWithFallback}>
                <ExternalIcon size={20} />
                Copy and open their contact form<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
          <p className="mt-2" aria-live="polite">
            {copied ? "Your message was copied. You can paste it into an email or contact form." : ""}
          </p>
          {contactFormUrl && (
            <p className="mt-2 text-ink-muted">
              Their contact form opens on their official website. Paste your message there. Some forms ask for your address
              to check that you live in their area.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
