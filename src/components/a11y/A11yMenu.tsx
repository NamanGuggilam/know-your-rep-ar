"use client";

import { useRef } from "react";
import { AccessIcon, CloseIcon } from "../icons";
import { useA11y, type A11ySettings } from "./settings";

interface Choice<K extends keyof A11ySettings> {
  value: A11ySettings[K];
  label: string;
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
              className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 font-semibold ${
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
              {c.label}
              {checked && <span className="sr-only"> (selected)</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function A11yMenu() {
  const ref = useRef<HTMLDialogElement>(null);
  const { settings, update, reset } = useA11y();

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        <AccessIcon />
        Accessibility
      </button>
      <dialog
        ref={ref}
        aria-labelledby="a11y-title"
        className="m-auto max-h-[90dvh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-surface p-0 text-ink"
        onClick={(e) => {
          if (e.target === ref.current) ref.current.close();
        }}
      >
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-surface px-5 py-3">
          <h2 id="a11y-title" className="text-xl font-extrabold">
            Accessibility settings
          </h2>
          <button type="button" className="btn btn-secondary flex-none" onClick={() => ref.current?.close()}>
            <CloseIcon />
            Close
          </button>
        </div>
        <div className="px-5 pt-4 pb-6">
          <p className="mb-4 text-ink-muted">
            Change how this app looks and sounds. Your choices are saved on this device only.
          </p>
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
              { value: "system", label: "Match my device" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "contrast", label: "High contrast" },
            ]}
          />
          <ChoiceGroup
            name="font"
            legend="Font"
            hint="OpenDyslexic is a font some people with dyslexia find easier to read."
            choices={[
              { value: "standard", label: "Standard (Atkinson Hyperlegible)" },
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
          <fieldset className="mb-5">
            <legend className="mb-1 text-lg font-bold">Read Aloud speed</legend>
            <p className="mb-2 text-ink-muted">
              Look for the Listen buttons on each page. This sets how fast they read.
            </p>
            <label htmlFor="a11y-rate" className="flex flex-wrap items-center gap-3 font-semibold">
              <input
                id="a11y-rate"
                type="range"
                min={0.6}
                max={1.6}
                step={0.1}
                value={settings.speechRate}
                onChange={(e) => update({ speechRate: Number(e.target.value) })}
                className="h-12 w-56 accent-[var(--accent)]"
              />
              <span aria-live="polite">{settings.speechRate.toFixed(1)}× speed</span>
            </label>
          </fieldset>
          <button type="button" className="btn btn-secondary" onClick={reset}>
            Reset to default settings
          </button>
        </div>
      </dialog>
    </>
  );
}
