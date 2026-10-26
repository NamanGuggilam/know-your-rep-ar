"use client";

import { useEffect } from "react";
import { keyOf, LANGUAGES, lookup } from "@/lib/i18n/languages";
import { useA11y } from "./settings";

// Text in these elements is never translated (candidates' exact words, official titles, code).
const SKIP = "script, style, noscript, textarea, input, select, code, [translate='no'], [data-no-translate]";
const ATTRS = ["placeholder", "aria-label", "alt", "title"] as const;

// The English we started from, and what we last wrote. If the page changes the text itself,
// it no longer matches what we wrote, so the new text becomes the original.
const originals = new WeakMap<Node, string>();
const written = new WeakMap<Node, string>();
const originalAttrs = new WeakMap<Element, Record<string, string>>();
const writtenAttrs = new WeakMap<Element, Record<string, string>>();
const cache = new Map<string, Record<string, string>>();

function translateAttrs(el: Element, dict: Record<string, string> | null) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (!v) continue;
    const saved = originalAttrs.get(el) ?? {};
    const wrote = writtenAttrs.get(el) ?? {};
    if (!(a in saved) || wrote[a] !== v) saved[a] = v;
    originalAttrs.set(el, saved);
    const next = (dict && lookup(dict, keyOf(saved[a]))) ?? saved[a];
    wrote[a] = next;
    writtenAttrs.set(el, wrote);
    if (v !== next) el.setAttribute(a, next);
  }
}

/**
 * React splits "8 of 10 topics" into several text nodes. Neighbouring text nodes are
 * translated together as one sentence: the translation goes in the first, the rest are emptied.
 */
function translateRun(run: Text[], dict: Record<string, string> | null) {
  for (const n of run) {
    const current = n.nodeValue ?? "";
    if (!originals.has(n) || written.get(n) !== current) originals.set(n, current);
  }
  const whole = run.map((n) => originals.get(n)!).join("");
  if (!whole.trim()) return;
  const t = dict ? lookup(dict, keyOf(whole)) : undefined;
  run.forEach((n, i) => {
    const orig = originals.get(n)!;
    // Keep the original leading/trailing spaces so words don't run together with neighbours.
    const next = t === undefined ? orig : i === 0 ? whole.match(/^\s*/)![0] + t + whole.match(/\s*$/)![0] : "";
    written.set(n, next);
    if (n.nodeValue !== next) n.nodeValue = next;
  });
}

function translateTree(root: Element, dict: Record<string, string> | null) {
  const walk = (el: Element) => {
    if (el.matches(SKIP)) return;
    translateAttrs(el, dict);
    let run: Text[] = [];
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) run.push(child as Text);
      else {
        if (run.length) translateRun(run, dict);
        run = [];
        if (child.nodeType === Node.ELEMENT_NODE) walk(child as Element);
      }
    }
    if (run.length) translateRun(run, dict);
  };
  walk(root);
}

/**
 * Translates the page in place from a reviewed dictionary (public/i18n/<lang>.json).
 * English text with no dictionary entry stays English. Works on pages that change after loading too.
 */
export function Translator() {
  const { settings } = useA11y();
  const lang = settings.lang;

  useEffect(() => {
    let dict: Record<string, string> | null = null;
    let stopped = false;
    let pending = false;
    const run = () => {
      pending = false;
      if (!stopped) translateTree(document.body, dict);
    };
    const observer = new MutationObserver(() => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(run);
      }
    });

    document.documentElement.lang = LANGUAGES.some((l) => l.code === lang) ? lang : "en";
    (async () => {
      if (lang !== "en") {
        dict = cache.get(lang) ?? null;
        if (!dict) {
          try {
            dict = await (await fetch(`/i18n/${lang}.json`)).json();
            cache.set(lang, dict!);
          } catch {
            dict = null;
          }
        }
      }
      if (stopped) return;
      run(); // also restores English when switching back
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    })();
    return () => {
      stopped = true;
      observer.disconnect();
    };
  }, [lang]);

  return null;
}
