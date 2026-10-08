"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, CircleDot, Eye, FastForward, ListChecks, Play, RefreshCw, Square, Stethoscope, Volume2, Waves } from "lucide-react";
import consultations from "@/data/consultations.json";
import { findTerms, highlightTerms, sortIntoBuckets, type Bucket, type GlossaryEntry } from "@/lib/consult";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ScreenIntro } from "./ScreenIntro";
import { useScreenHidden } from "./useScreenHidden";

type Consultation = (typeof consultations)[number];
type Phase = "idle" | "playing" | "done";

const CHARS_PER_SECOND = 24;

const BUCKETS: { key: Bucket; title: string; icon: typeof CircleDot }[] = [
  { key: "changed", title: "What changed today?", icon: CircleDot },
  { key: "next", title: "What is the next step?", icon: ListChecks },
  { key: "watch", title: "What warning signs should family watch?", icon: Eye },
];

function pickLocalVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  // Only voices that run on the device; network voices fail in airplane mode.
  return voices.find((v) => v.localService && v.lang.startsWith("en-IN")) ?? voices.find((v) => v.localService && v.lang.startsWith("en")) ?? null;
}

export function ConsultScreen() {
  const [mode, setMode] = useState<"sample" | "paste">("sample");
  return (
    <div className="space-y-6">
      <ScreenIntro
        eyebrow="Phase 2 · In the hospital"
        title="Bedside consultation translator"
        text="Doctors' rounds are quick and full of jargon. VigilCare turns a round into three plain-English answers the family can act on, and explains each medical term."
      />
      <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-soft" role="group" aria-label="Translator mode">
        <button
          type="button"
          aria-pressed={mode === "sample"}
          onClick={() => setMode("sample")}
          className={cn(
            "min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors",
            mode === "sample" ? "bg-ink text-white" : "text-muted hover:text-ink",
          )}
        >
          Sample rounds
        </button>
        <button
          type="button"
          aria-pressed={mode === "paste"}
          onClick={() => setMode("paste")}
          className={cn(
            "min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors",
            mode === "paste" ? "bg-ink text-white" : "text-muted hover:text-ink",
          )}
        >
          Paste your own notes
        </button>
      </div>
      {mode === "sample" ? <SampleRound /> : <PasteMode />}
      <p className="text-sm text-muted">Demo uses scripted consultations. The full product transcribes on-device.</p>
    </div>
  );
}

function SampleRound() {
  const [selected, setSelected] = useState<Consultation>(consultations[0]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealed, setRevealed] = useState(0);
  const [voiced, setVoiced] = useState(false);
  const timerRef = useRef<number | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const finish = useCallback((c: Consultation) => {
    clearTimer();
    window.speechSynthesis?.cancel();
    setRevealed(c.transcript.length);
    setPhase("done");
    requestAnimationFrame(() => cardsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }, []);

  const stopAll = useCallback(() => {
    clearTimer();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => stopAll, [stopAll]);
  // Switching screens mid-round jumps straight to the summary and silences the voice.
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useScreenHidden("bedside", () => {
    if (phaseRef.current === "playing") finish(selected);
  });

  // Voices load asynchronously in some browsers.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () => setVoiced(!!pickLocalVoice());
    update();
    window.speechSynthesis.addEventListener?.("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", update);
  }, []);

  function play() {
    stopAll();
    const c = selected;
    setRevealed(0);
    setPhase("playing");

    // Steady text reveal; speech (if any) runs alongside and boundary events pull the text forward.
    timerRef.current = window.setInterval(() => {
      setRevealed((n) => {
        const next = n + 2;
        if (next >= c.transcript.length) {
          // Let a voice finish its sentence before showing the cards; otherwise finish now.
          if (!window.speechSynthesis?.speaking) window.setTimeout(() => finish(c), 0);
          return c.transcript.length;
        }
        return next;
      });
    }, 2000 / CHARS_PER_SECOND);

    const voice = pickLocalVoice();
    if (voice) {
      try {
        const u = new SpeechSynthesisUtterance(c.transcript);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = 1.05;
        u.onboundary = (e) => setRevealed((n) => Math.max(n, e.charIndex + (e.charLength ?? 0)));
        u.onend = () => finish(c);
        u.onerror = () => undefined;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch {
        /* fall back to text + waveform only */
      }
    }
  }

  const shown = selected.transcript.slice(0, revealed);
  const terms = findTerms(phase === "done" ? selected.transcript : shown);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {consultations.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={selected.id === c.id}
            onClick={() => {
              stopAll();
              setSelected(c);
              setPhase("idle");
              setRevealed(0);
            }}
            className={cn(
              "cursor-pointer rounded-2xl border-2 bg-surface p-4 text-left shadow-soft transition-colors hover:border-primary",
              selected.id === c.id ? "border-primary" : "border-line",
            )}
          >
            <span className="block font-display font-bold text-ink">{c.title}</span>
            <span className="mt-1 block text-sm text-muted">
              {c.patient} · {c.doctor}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-5 text-primary" aria-hidden /> Doctor&rsquo;s round
            </CardTitle>
            <CardDescription>Scripted sample consultation. Names are fictional.</CardDescription>
          </div>
          <div className="flex gap-2">
            {phase === "playing" ? (
              <>
                <Button variant="outline" onClick={() => finish(selected)}>
                  <FastForward aria-hidden /> Skip to summary
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    stopAll();
                    setPhase("idle");
                    setRevealed(0);
                  }}
                >
                  <Square aria-hidden /> Stop
                </Button>
              </>
            ) : (
              <Button size="lg" onClick={play}>
                {phase === "done" ? <RefreshCw aria-hidden /> : <Play aria-hidden />}
                {phase === "done" ? "Play again" : "Play sample round"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-page px-4 py-3">
            {voiced ? <Volume2 className="size-5 text-primary" aria-hidden /> : <Waves className="size-5 text-primary" aria-hidden />}
            <Waveform playing={phase === "playing"} />
            <span className="ml-auto hidden text-xs text-muted sm:inline">{voiced ? "On-device voice" : "Silent playback"}</span>
          </div>
          <p className="min-h-28 font-mono text-[15px] leading-relaxed text-ink sm:text-base" aria-live="off">
            {phase === "idle" ? (
              <span className="font-sans text-muted">Press &ldquo;Play sample round&rdquo; to hear the doctor&rsquo;s round.</span>
            ) : (
              <HighlightedText text={phase === "done" ? selected.transcript : shown} />
            )}
            {phase === "playing" && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />}
          </p>
          {terms.length > 0 && <TermsList terms={terms} />}
        </CardContent>
      </Card>

      <div ref={cardsRef} className="scroll-mt-40">
        {phase === "done" && <SummaryCards summary={selected.summary} label="Hand-checked summary for this scripted round" />}
      </div>
    </div>
  );
}

function PasteMode() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ text: string; buckets: Record<Bucket, string[]> } | null>(null);
  const example = consultations[0].transcript;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Paste a doctor&rsquo;s note or round</CardTitle>
            <Badge variant="outline">Basic offline mode</Badge>
          </div>
          <CardDescription>
            Uses a built-in glossary and simple keyword cues to sort sentences. It can misplace a sentence; always check with the care team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="paste-notes">Notes</Label>
            <Textarea id="paste-notes" value={text} onChange={(e) => setText(e.target.value)} placeholder={example} className="min-h-36" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" disabled={!text.trim()} onClick={() => setResult({ text, buckets: sortIntoBuckets(text) })}>
              <BookOpen aria-hidden /> Translate this note
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText(example);
                setResult({ text: example, buckets: sortIntoBuckets(example) });
              }}
            >
              Try the example
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardContent className="space-y-4">
              <p className="text-[16px] leading-relaxed text-ink">
                <HighlightedText text={result.text} />
              </p>
              <TermsList terms={findTerms(result.text)} />
            </CardContent>
          </Card>
          <SummaryCards summary={result.buckets} label="Sorted automatically in basic offline mode" />
        </>
      )}
    </div>
  );
}

function HighlightedText({ text }: { text: string }) {
  return (
    <>
      {highlightTerms(text).map((seg, i) =>
        seg.entry ? <Term key={i} text={seg.text} entry={seg.entry} /> : <span key={i}>{seg.text}</span>,
      )}
    </>
  );
}

function Term({ text, entry }: { text: string; entry: GlossaryEntry }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-help rounded bg-primary-soft px-0.5 font-semibold text-primary-ink underline decoration-primary/60 decoration-dotted underline-offset-4"
        >
          {text}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="font-semibold">{entry.term}:</span> {entry.plain}
      </TooltipContent>
    </Tooltip>
  );
}

function TermsList({ terms }: { terms: GlossaryEntry[] }) {
  return (
    <details className="rounded-xl border border-line bg-page p-3" open>
      <summary className="cursor-pointer text-sm font-semibold text-ink">
        Terms explained ({terms.length})
      </summary>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {terms.map((t) => (
          <div key={t.term}>
            <dt className="inline font-semibold text-primary-ink">{t.term}: </dt>
            <dd className="inline text-ink">{t.plain}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function SummaryCards({ summary, label }: { summary: Record<Bucket, string[]>; label: string }) {
  return (
    <section aria-label="Plain-English summary" className="space-y-3">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        {BUCKETS.map((b) => (
          <Card key={b.key} className="border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex items-start gap-2 text-lg">
                <b.icon className="mt-1 size-5 shrink-0 text-primary" aria-hidden /> {b.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary[b.key].length ? (
                <ul className="space-y-2.5 text-[16px] leading-relaxed text-ink">
                  {summary[b.key].map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[15px] text-muted">Nothing found for this question. Ask the care team.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex h-8 items-center gap-1" aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-full bg-primary/70", playing ? "wave-bar h-8" : "h-1.5")}
          style={playing ? { animationDelay: `${(i * 73) % 900}ms` } : undefined}
        />
      ))}
    </div>
  );
}
