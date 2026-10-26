"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PauseIcon, SpeakerIcon, StopIcon } from "../icons";
import { useA11y } from "./settings";

const START_EVENT = "kyr-speech-start";

/**
 * Reads text aloud with the browser's built-in voice (Web Speech API).
 * Pass `text`, or `targetId` to read the visible text of an element.
 */
export function ListenButton({
  text,
  targetId,
  label = "Listen",
}: {
  text?: string;
  targetId?: string;
  label?: string;
}) {
  const id = useId();
  const { settings } = useA11y();
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    // Only one Listen button plays at a time.
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== id) setState("idle");
    };
    window.addEventListener(START_EVENT, onOther);
    return () => window.removeEventListener(START_EVENT, onOther);
  }, [id]);

  useEffect(() => () => {
    if (utterRef.current && typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  if (!supported) return null;

  const getText = () => {
    if (text) return text;
    const el = targetId ? document.getElementById(targetId) : null;
    if (!el) return "";
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[data-no-read], button, script, style").forEach((n) => n.remove());
    return clone.innerText || clone.textContent || "";
  };

  const play = () => {
    const synth = window.speechSynthesis;
    if (state === "paused") {
      synth.resume();
      setState("playing");
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(getText().replace(/\s+/g, " ").trim());
    u.rate = settings.speechRate;
    u.lang = document.documentElement.lang || "en-US";
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    utterRef.current = u;
    window.dispatchEvent(new CustomEvent(START_EVENT, { detail: id }));
    synth.speak(u);
    setState("playing");
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setState("paused");
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setState("idle");
  };

  return (
    <span className="inline-flex flex-wrap gap-2" data-no-read>
      {state === "playing" ? (
        <button type="button" className="btn btn-secondary" onClick={pause}>
          <PauseIcon />
          Pause
        </button>
      ) : (
        <button type="button" className="btn btn-secondary" onClick={play}>
          <SpeakerIcon />
          {state === "paused" ? "Keep listening" : label}
        </button>
      )}
      {state !== "idle" && (
        <button type="button" className="btn btn-secondary" onClick={stop}>
          <StopIcon />
          Stop
        </button>
      )}
    </span>
  );
}
