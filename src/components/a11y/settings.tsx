"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface A11ySettings {
  theme: "system" | "light" | "dark" | "contrast";
  text: "1" | "2" | "3" | "4";
  font: "standard" | "dyslexic";
  spacing: "normal" | "relaxed" | "extra";
  simple: "off" | "on";
  motion: "system" | "reduce";
  speechRate: number;
}

export const DEFAULTS: A11ySettings = {
  theme: "system",
  text: "1",
  font: "standard",
  spacing: "normal",
  simple: "off",
  motion: "system",
  speechRate: 1,
};

export const STORAGE_KEY = "kyr-a11y";

/**
 * Runs in <head> before the page paints, so saved settings apply with no flash.
 * Keep it tiny and dependency-free.
 */
export const BOOT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}"),d=document.documentElement;
if(s.theme&&s.theme!=="system")d.dataset.theme=s.theme;
if(s.text&&s.text!=="1")d.dataset.text=s.text;
if(s.font==="dyslexic")d.dataset.font="dyslexic";
if(s.spacing&&s.spacing!=="normal")d.dataset.spacing=s.spacing;
if(s.simple==="on")d.dataset.simple="on";
if(s.motion==="reduce")d.dataset.motion="reduce";}catch(e){}`;

function apply(s: A11ySettings) {
  const d = document.documentElement.dataset;
  const set = (k: string, v: string | undefined) => {
    if (v === undefined) delete d[k];
    else d[k] = v;
  };
  set("theme", s.theme === "system" ? undefined : s.theme);
  set("text", s.text === "1" ? undefined : s.text);
  set("font", s.font === "dyslexic" ? "dyslexic" : undefined);
  set("spacing", s.spacing === "normal" ? undefined : s.spacing);
  set("simple", s.simple === "on" ? "on" : undefined);
  set("motion", s.motion === "reduce" ? "reduce" : undefined);
}

function load(): A11ySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
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
    // Read saved settings after hydration so server and client HTML match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(load());
  }, []);

  const save = useCallback((next: A11ySettings) => {
    setSettings(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private browsing or storage blocked: settings still work for this visit.
    }
  }, []);

  const update = useCallback(
    (patch: Partial<A11ySettings>) => save({ ...settings, ...patch }),
    [save, settings],
  );
  const reset = useCallback(() => save(DEFAULTS), [save]);

  return <Ctx.Provider value={{ settings, update, reset }}>{children}</Ctx.Provider>;
}

export const useA11y = () => useContext(Ctx);
