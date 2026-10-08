"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HeartPulse, Minus, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";
import { useScreenHidden } from "./useScreenHidden";

export const MIN_BPM = 100;
export const MAX_BPM = 120;
export const DEFAULT_BPM = 110;

export const clampBpm = (n: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(n)));

/**
 * CPR metronome generated with the Web Audio API (no audio files, works offline).
 * Beats are scheduled ahead on the audio clock so timing stays steady even if
 * the main thread is busy; the visual pulse follows the audio clock.
 */
export function CprMetronome() {
  const [running, setRunning] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [beat, setBeat] = useState(0);
  const reducedMotion = useReducedMotion();

  const ctxRef = useRef<AudioContext | null>(null);
  const nextBeatRef = useRef(0);
  const queueRef = useRef<number[]>([]);
  const bpmRef = useRef(bpm);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const click = useCallback((ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.5, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.07);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
    queueRef.current = [];
    void ctxRef.current?.suspend();
    setRunning(false);
  }, []);

  const start = useCallback(async () => {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = ctxRef.current ?? new AC();
    ctxRef.current = ctx;
    await ctx.resume();
    nextBeatRef.current = ctx.currentTime + 0.05;
    queueRef.current = [];

    const schedule = () => {
      const lookahead = 0.12;
      while (nextBeatRef.current < ctx.currentTime + lookahead) {
        click(ctx, nextBeatRef.current);
        queueRef.current.push(nextBeatRef.current);
        nextBeatRef.current += 60 / clampBpm(bpmRef.current);
      }
    };
    schedule();
    timerRef.current = window.setInterval(schedule, 25);

    const draw = () => {
      const now = ctx.currentTime;
      let fired = false;
      while (queueRef.current.length && queueRef.current[0] <= now) {
        queueRef.current.shift();
        fired = true;
      }
      if (fired) setBeat((b) => b + 1);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    setRunning(true);
  }, [click]);

  // Stop when the presenter switches screens, or on unmount (Reset demo).
  useScreenHidden("emergency", stop);

  useEffect(
    () => () => {
      stop();
      void ctxRef.current?.close();
      ctxRef.current = null;
    },
    [stop],
  );

  return (
    <Card id="first-aid" className="scroll-mt-40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <HeartPulse className="size-6 text-primary" aria-hidden /> CPR rhythm guide
        </CardTitle>
        <CardDescription>Works offline. The beat is generated on the device.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative grid size-44 place-items-center sm:size-52">
            <div
              key={reducedMotion ? "static" : beat}
              className={cn(
                "absolute inset-0 rounded-full border-4 border-primary/25 bg-primary-soft",
                running && !reducedMotion && "animate-pulse-beat",
              )}
            />
            <div className="relative text-center">
              <div className="font-display text-5xl font-extrabold tabular-nums text-ink">{bpm}</div>
              <div className="text-sm font-semibold text-muted">beats per minute</div>
              {running && reducedMotion && (
                <div className="mt-1 text-xs font-semibold tabular-nums text-primary-ink">Beat {beat}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Slower, 5 beats per minute"
              disabled={bpm <= MIN_BPM}
              onClick={() => setBpm((b) => clampBpm(b - 5))}
            >
              <Minus aria-hidden />
            </Button>
            <input
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(clampBpm(Number(e.target.value)))}
              aria-label="Beats per minute, 100 to 120"
              className="w-28 accent-[#0E7C86]"
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Faster, 5 beats per minute"
              disabled={bpm >= MAX_BPM}
              onClick={() => setBpm((b) => clampBpm(b + 5))}
            >
              <Plus aria-hidden />
            </Button>
          </div>
          <Button size="lg" variant={running ? "outline" : "default"} onClick={running ? stop : start} className="w-full min-w-56">
            {running ? <Pause aria-hidden /> : <Play aria-hidden />}
            {running ? "Stop CPR rhythm" : "Start CPR rhythm"}
          </Button>
        </div>

        <ol className="space-y-3 text-[16px] leading-relaxed text-ink">
          {[
            ["Call for help first.", "Call 112 or 108, or ask someone nearby to call, and put the phone on speaker."],
            ["Push hard and fast in the centre of the chest.", "Heel of one hand on the middle of the chest, other hand on top, arms straight."],
            ["About 5 to 6 cm deep for adults.", "Push with your body weight, in time with the beat."],
            ["Let the chest rise fully between pushes.", "Do not lean on the chest. Keep going until help arrives."],
          ].map(([title, text], i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
              <span>
                <strong className="font-semibold">{title}</strong> <span className="text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
