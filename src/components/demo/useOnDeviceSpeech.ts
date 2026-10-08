"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Voice input is a progressive enhancement. Standard browser speech
 * recognition sends audio to a cloud service and fails in airplane mode, so we
 * only offer the mic when the experimental on-device mode reports that it is
 * available (SpeechRecognition.available({ processLocally: true })).
 * Otherwise the caller shows a text box only, never a broken mic.
 *
 * The availability probe is opt-in (the user presses a button) rather than
 * run on page load: in some Chromium builds the experimental call crashes the
 * tab, and a crash on page load would take the whole demo down on stage.
 */

type RecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  processLocally?: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type RecognitionCtor = {
  new (): Recognition;
  available?: (opts: { langs: string[]; processLocally: boolean }) => Promise<string>;
};

function getCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export type SpeechStatus = "unknown" | "checking" | "available" | "unavailable";

export function useOnDeviceSpeech(onText: (text: string) => void) {
  const [status, setStatus] = useState<SpeechStatus>("unknown");
  const supported = status === "available";
  const setSupported = useCallback((ok: boolean) => setStatus(ok ? "available" : "unavailable"), []);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => () => recRef.current?.abort(), []);

  const probe = useCallback(async () => {
    const Ctor = getCtor();
    if (!Ctor?.available) {
      setStatus("unavailable");
      return;
    }
    setStatus("checking");
    try {
      const result = await Promise.race([
        Ctor.available({ langs: ["en-IN"], processLocally: true }),
        new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), 3000)),
      ]);
      setStatus(result === "available" ? "available" : "unavailable");
    } catch {
      setStatus("unavailable");
    }
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    try {
      const rec = new Ctor();
      rec.lang = "en-IN";
      rec.interimResults = true;
      rec.continuous = false;
      rec.processLocally = true;
      rec.onresult = (e) => {
        const text = Array.from(e.results)
          .map((r) => r[0]?.transcript ?? "")
          .join(" ");
        onTextRef.current(text);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => {
        setListening(false);
        // A failure here means on-device recognition is not usable after all: hide the mic.
        setSupported(false);
      };
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      setSupported(false);
    }
  }, [setSupported]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { status, supported, listening, start, stop, probe };
}
