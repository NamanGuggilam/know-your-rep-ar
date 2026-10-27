"use client";

import { useEffect } from "react";
import { keyOf, LANGUAGES, lookup } from "@/lib/i18n/languages";
import { useA11y } from "./settings";

const UNTRANSLATED_SELECTOR = "script, style, noscript, textarea, input, select, code, [translate='no'], [data-no-translate]";
const TRANSLATED_ATTRIBUTES = ["placeholder", "aria-label", "alt", "title"] as const;

const originalText = new WeakMap<Node, string>();
const writtenText = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();
const writtenAttributes = new WeakMap<Element, Record<string, string>>();
const cache = new Map<string, Record<string, string>>();

function translateAttributes(el: Element, dict: Record<string, string> | null) {
  for (const a of TRANSLATED_ATTRIBUTES) {
    const v = el.getAttribute(a);
    if (!v) continue;
    const saved = originalAttributes.get(el) ?? {};
    const wrote = writtenAttributes.get(el) ?? {};
    if (!(a in saved) || wrote[a] !== v) saved[a] = v;
    originalAttributes.set(el, saved);
    const next = (dict && lookup(dict, keyOf(saved[a]))) ?? saved[a];
    wrote[a] = next;
    writtenAttributes.set(el, wrote);
    if (v !== next) el.setAttribute(a, next);
  }
}

function translateRun(run: Text[], dict: Record<string, string> | null) {
  for (const n of run) {
    const current = n.nodeValue ?? "";
    if (!originalText.has(n) || writtenText.get(n) !== current) originalText.set(n, current);
  }
  const whole = run.map((n) => originalText.get(n)!).join("");
  if (!whole.trim()) return;
  const t = dict ? lookup(dict, keyOf(whole)) : undefined;
  run.forEach((n, i) => {
    const orig = originalText.get(n)!;
    const next = t === undefined ? orig : i === 0 ? whole.match(/^\s*/)![0] + t + whole.match(/\s*$/)![0] : "";
    writtenText.set(n, next);
    if (n.nodeValue !== next) n.nodeValue = next;
  });
}

function translateTree(root: Element, dict: Record<string, string> | null) {
  const walk = (el: Element) => {
    if (el.matches(UNTRANSLATED_SELECTOR)) return;
    translateAttributes(el, dict);
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
      run();
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...TRANSLATED_ATTRIBUTES] });
    })();
    return () => {
      stopped = true;
      observer.disconnect();
    };
  }, [lang]);

  return null;
}
