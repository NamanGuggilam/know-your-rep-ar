"use client";

import { useRef } from "react";
import { AccessIcon, CloseIcon, GlobeIcon } from "../icons";
import { LANGUAGES } from "@/lib/i18n/languages";
import { useA11y, type A11ySettings } from "./settings";

interface Choice<K extends keyof A11ySettings> {
  value: A11ySettings[K];
  label: string;
  /** Language of the label itself, so screen readers pronounce "Español" correctly. */
  lang?: string;
}

function ChoiceGroup<K extends keyof A11ySettings>({
  name,
  legend,
  hint,
  choices,
}: {
  name: K;
  legend: string;
  hint?: string;
  choices: Choice<K>[];
}) {
  const { settings, update } = useA11y();
  return (
    <fieldset className="mb-5">
      <legend className="mb-1 text-lg font-bold">{legend}</legend>
      {hint && <p className="mb-2 text-ink-muted">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => {
          const id = `a11y-${name}-${String(c.value)}`;
          const checked = settings[name] === c.value;
          return (
            <label
              key={id}
              htmlFor={id}
              className={`flex min-h-12 cursor-pointer items-center gap-2 rounded border-2 px-3 py-2 font-semibold ${
                checked ? "border-accent bg-accent-soft" : "border-line-soft bg-surface"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                checked={checked}
                onChange={() => update({ [name]: c.value } as Partial<A11ySettings>)}
                className="size-5 accent-[var(--accent)]"
              />
              <span lang={c.lang} translate={c.lang ? "no" : undefined}>
                {c.label}
              </span>
              {checked && <span className="sr-only"> (selected)</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const DIALOG_ID = "a11y-dialog";

/** Opens the one shared settings dialog. Can appear in more than one place. */
export function A11yButton() {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      aria-haspopup="dialog"
      aria-controls={DIALOG_ID}
      onClick={() => (document.getElementById(DIALOG_ID) as HTMLDialogElement | null)?.showModal()}
    >
      <AccessIcon />
      Accessibility
    </button>
  );
}

/** A small "Language" link-style button that opens the same dialog. */
export function LanguageButton() {
  const { settings } = useA11y();
  const current = LANGUAGES.find((l) => l.code === settings.lang) ?? LANGUAGES[0];
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-controls={DIALOG_ID}
      onClick={() => (document.getElementById(DIALOG_ID) as HTMLDialogElement | null)?.showModal()}
      className="inline-flex min-h-11 items-center gap-1 font-semibold text-accent underline underline-offset-4"
    >
      <GlobeIcon size={18} />
      <span translate="no" lang="en">
        Language:
      </span>{" "}
      <span lang={current.code} translate="no">
        {current.native}
      </span>
    </button>
  );
}

/** The settings dialog. Render exactly once per page. */
export function A11yDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const { reset } = useA11y();

  return (
    <dialog
      id={DIALOG_ID}
      ref={ref}
      aria-labelledby="a11y-title"
      className="panel m-auto max-h-[90dvh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto bg-surface p-0 text-ink"
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-surface px-5 py-3">
        <h2 id="a11y-title" className="text-xl font-extrabold">
          Accessibility and language
        </h2>
        <button type="button" className="btn btn-secondary flex-none" onClick={() => ref.current?.close()}>
          <CloseIcon />
          Close
        </button>
      </div>
      <div className="px-5 pt-4 pb-6">
        <p className="mb-4 text-ink-muted">
          Change the language and how this app looks. Your choices are saved on this device only.
        </p>
        <ChoiceGroup
          name="lang"
          legend="Language / Idioma / Kajin / Ngôn ngữ / 语言"
          hint="Translations are made by computer. Candidates' exact words stay in the language they used."
          choices={LANGUAGES.map((l) => ({ value: l.code, label: l.native, lang: l.code }))}
        />
        <ChoiceGroup
          name="text"
          legend="Text size"
          choices={[
            { value: "1", label: "Normal" },
            { value: "2", label: "Large" },
            { value: "3", label: "Larger" },
            { value: "4", label: "Largest" },
          ]}
        />
        <ChoiceGroup
          name="theme"
          legend="Colors"
          choices={[
            { value: "light", label: "Light (default)" },
            { value: "dark", label: "Dark" },
            { value: "contrast", label: "High contrast" },
          ]}
        />
        <ChoiceGroup
          name="font"
          legend="Font"
          hint="Atkinson Hyperlegible was designed for people with low vision. OpenDyslexic is a font some people with dyslexia find easier to read."
          choices={[
            { value: "standard", label: "Standard (Public Sans)" },
            { value: "atkinson", label: "Atkinson Hyperlegible (for low vision)" },
            { value: "dyslexic", label: "OpenDyslexic" },
          ]}
        />
        <ChoiceGroup
          name="spacing"
          legend="Line spacing"
          choices={[
            { value: "normal", label: "Normal" },
            { value: "relaxed", label: "More space" },
            { value: "extra", label: "Most space" },
          ]}
        />
        <ChoiceGroup
          name="simple"
          legend="Simple mode"
          hint="Shows fewer things on each screen, with bigger buttons."
          choices={[
            { value: "off", label: "Off" },
            { value: "on", label: "On" },
          ]}
        />
        <ChoiceGroup
          name="motion"
          legend="Motion"
          choices={[
            { value: "system", label: "Match my device" },
            { value: "reduce", label: "Reduce motion" },
          ]}
        />
        <button type="button" className="btn btn-secondary" onClick={reset}>
          Reset to default settings
        </button>
      </div>
    </dialog>
  );
}
