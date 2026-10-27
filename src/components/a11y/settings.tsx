"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { LangCode } from "@/lib/i18n/languages";

export interface A11ySettings {
  theme: "light" | "dark" | "contrast";
  text: "1" | "2" | "3" | "4";
  font: "standard" | "atkinson" | "dyslexic";
  spacing: "normal" | "relaxed" | "extra";
  simple: "off" | "on";
  motion: "system" | "reduce";
  lang: LangCode;
}

export const DEFAULTS: A11ySettings = {
  theme: "light",
  text: "1",
  font: "standard",
  spacing: "normal",
  simple: "off",
  motion: "system",
  lang: "en",
};

export const STORAGE_KEY = "kyr-a11y-v2";

export const BOOT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}"),d=document.documentElement;
if(s.theme==="dark"||s.theme==="contrast")d.dataset.theme=s.theme;
if(s.text&&s.text!=="1")d.dataset.text=s.text;
if(s.font==="dyslexic"||s.font==="atkinson")d.dataset.font=s.font;
if(s.spacing&&s.spacing!=="normal")d.dataset.spacing=s.spacing;
if(s.simple==="on")d.dataset.simple="on";
if(s.motion==="reduce")d.dataset.motion="reduce";}catch(e){}`;

function apply(s: A11ySettings) {
  const dataset = document.documentElement.dataset;
  const set = (key: string, value: string | undefined) => {
    if (value === undefined) delete dataset[key];
    else dataset[key] = value;
  };
  set("theme", s.theme === "light" ? undefined : s.theme);
  set("text", s.text === "1" ? undefined : s.text);
  set("font", s.font === "standard" ? undefined : s.font);
  set("spacing", s.spacing === "normal" ? undefined : s.spacing);
  set("simple", s.simple === "on" ? "on" : undefined);
  set("motion", s.motion === "reduce" ? "reduce" : undefined);
}

const VALID_THEMES = ["light", "dark", "contrast"];

function persistSettings(settings: A11ySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}

function load(): A11ySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = { ...DEFAULTS, ...JSON.parse(raw) };
    if (!VALID_THEMES.includes(saved.theme)) saved.theme = "light";
    return saved;
  } catch {
    return DEFAULTS;
  }
}

const Ctx = createContext<{
  settings: A11ySettings;
  update: (patch: Partial<A11ySettings>) => void;
  reset: () => void;
}>({ settings: DEFAULTS, update: () => {}, reset: () => {} });

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(DEFAULTS);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(load());
  }, []);

  const save = useCallback((next: A11ySettings) => {
    setSettings(next);
    apply(next);
    persistSettings(next);
  }, []);

  const update = useCallback(
    (patch: Partial<A11ySettings>) => save({ ...settings, ...patch }),
    [save, settings],
  );
  const reset = useCallback(() => save(DEFAULTS), [save]);

  return <Ctx.Provider value={{ settings, update, reset }}>{children}</Ctx.Provider>;
}

export const useA11y = () => useContext(Ctx);
