"use client";

import { useRef, useState } from "react";
import { Clock, HeartPulse, House, Mic, MicOff, OctagonAlert, Phone, Search, TriangleAlert } from "lucide-react";
import { scenarios, triage, type Differential, type TriageResult } from "@/lib/triage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CprMetronome } from "./CprMetronome";
import { EmergencyPassport } from "./EmergencyPassport";
import { ScreenIntro } from "./ScreenIntro";
import { useOnDeviceSpeech } from "./useOnDeviceSpeech";

export function EmergencyScreen() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const speech = useOnDeviceSpeech(setText);

  function check(input: string) {
    setResult(triage(input));
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="space-y-6">
      <ScreenIntro
        eyebrow="Phase 1 · Before the hospital"
        title="Emergency and dead-zone mode"
        text="Describe what is happening in your own words. VigilCare sorts it into one of three urgency levels using fixed safety rules on this device, then tells you what to do while you wait."
      />

      <Card className="border-2 border-primary/30">
        <CardContent className="space-y-4">
          <label htmlFor="describe" className="block font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Describe what is happening
          </label>
          <div className="relative">
            <Textarea
              id="describe"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="For example: my father's face is drooping and his speech is slurred"
              className="min-h-32 pr-16 text-lg sm:text-xl"
            />
            {speech.supported && (
              <Button
                type="button"
                size="icon"
                variant={speech.listening ? "danger" : "soft"}
                className="absolute right-3 top-3 size-12"
                onClick={speech.listening ? speech.stop : speech.start}
                aria-label={speech.listening ? "Stop listening" : "Speak instead (on-device voice)"}
              >
                {speech.listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
              </Button>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-muted">Or tap a sample scenario:</p>
            <div className="flex flex-wrap gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setText(s.text);
                    check(s.text);
                  }}
                  className="min-h-11 cursor-pointer rounded-full border border-line-strong bg-surface px-4 py-2 text-[15px] font-semibold text-ink transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary-ink"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <Button size="xl" className="w-full" onClick={() => check(text)}>
            <Search aria-hidden /> Check how urgent this is
          </Button>
          <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>Uses fixed keyword rules, not AI. When unsure, it picks the more urgent level.</p>
            {speech.status !== "available" && (
              <VoiceProbe status={speech.status} onProbe={speech.probe} />
            )}
          </div>
        </CardContent>
      </Card>

      <div ref={resultRef} className="scroll-mt-40" aria-live="polite">
        {result && <TriageOutcome result={result} />}
      </div>

      <CprMetronome />
      <EmergencyPassport />
    </div>
  );
}

function VoiceProbe({ status, onProbe }: { status: string; onProbe: () => void }) {
  if (status === "unavailable") {
    return <p role="status">On-device voice is not available in this browser. Type, or tap a scenario.</p>;
  }
  return (
    <button
      type="button"
      onClick={onProbe}
      disabled={status === "checking"}
      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 self-start rounded-lg px-2 font-semibold text-primary-ink underline-offset-4 hover:underline disabled:cursor-wait"
    >
      <Mic className="size-4" aria-hidden />
      {status === "checking" ? "Checking for on-device voice..." : "Try on-device voice (experimental)"}
    </button>
  );
}

const TIERS = {
  critical: {
    label: "Critical emergency",
    sub: "Act now",
    icon: OctagonAlert,
    box: "border-danger bg-danger text-white",
  },
  urgent: {
    label: "Urgent care",
    sub: "Get seen within 2 to 4 hours",
    icon: TriangleAlert,
    box: "border-warn-line bg-warn-soft text-warn",
  },
  routine: {
    label: "Routine / Home care",
    sub: "Rest, fluids and watch for changes",
    icon: House,
    box: "border-safe-line bg-safe-soft text-safe",
  },
} as const;

function TriageOutcome({ result }: { result: TriageResult }) {
  const tier = TIERS[result.tier];
  const [startedAt, setStartedAt] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-4 rounded-3xl border-2 p-5 sm:p-7", tier.box)}>
        <tier.icon className={cn("size-12 shrink-0 sm:size-16", result.tier === "urgent" && "text-warn-icon")} aria-hidden />
        <div>
          <p className="text-sm font-bold uppercase tracking-wider opacity-90">Result</p>
          <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{tier.label}</h2>
          <p className="text-lg font-semibold">{tier.sub}</p>
        </div>
      </div>

      {result.message && (
        <p className="rounded-2xl border border-warn-line bg-surface p-4 text-[16px] font-semibold text-ink">{result.message}</p>
      )}

      {result.tier === "critical" ? (
        <Card>
          <CardContent className="space-y-4">
            {result.reasons.length > 0 && (
              <p className="text-[16px] text-ink">
                <span className="font-semibold">We recognised:</span> {result.reasons.join(", ")} ({result.matched.join(", ")}).
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="tel:112"
                className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-danger px-6 text-2xl font-extrabold text-white shadow-soft hover:bg-[#931c13]"
              >
                <Phone className="size-7" aria-hidden /> Call 112
              </a>
              <a
                href="tel:108"
                className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-danger px-6 text-2xl font-extrabold text-white shadow-soft hover:bg-[#931c13]"
              >
                <Phone className="size-7" aria-hidden /> Call 108 (ambulance)
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                variant="outline"
                className="h-auto min-h-16 whitespace-normal py-3"
                onClick={() => setStartedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }))}
              >
                <Clock aria-hidden />
                {startedAt ? `Symptoms noted at ${startedAt}. Tell the doctor this time.` : "Note the time symptoms started"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-auto min-h-16 whitespace-normal py-3"
                onClick={() => document.getElementById("first-aid")?.scrollIntoView({ behavior: "smooth" })}
              >
                <HeartPulse aria-hidden /> Open the first-aid guide
              </Button>
            </div>
            <p className="text-sm text-muted">
              Aggregated dispatch to the nearest available ambulance is on our roadmap. Today the buttons call 112 or 108 directly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4">
            {result.reasons.length > 0 && (
              <p className="text-[16px] text-ink">
                <span className="font-semibold">We recognised:</span> {result.reasons.join(", ")} ({result.matched.join(", ")}).
              </p>
            )}
            {result.differentials.length > 0 && <DifferentialBars items={result.differentials} />}
            <p className="text-[16px] text-ink">
              {result.tier === "urgent"
                ? "See a doctor or visit a clinic within 2 to 4 hours. If breathing, speech, or consciousness changes, call 112 or 108 at once."
                : "This can usually be managed at home. Rest and drink water. See a doctor if it gets worse, lasts more than a day or two, or new symptoms appear."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DifferentialBars({ items }: { items: Differential[] }) {
  return (
    <figure>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-bold text-ink">Differential ranges</h3>
        <Badge variant="outline">Illustrative</Badge>
      </div>
      <ul className="space-y-3">
        {items.map((d) => (
          <li key={d.label}>
            <div className="flex justify-between gap-3 text-[15px]">
              <span className="font-semibold text-ink">{d.label}</span>
              <span className="tabular-nums text-muted">{d.percent}%</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-page" aria-hidden="true">
              <div className="h-full rounded-full bg-primary" style={{ width: `${d.percent}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <figcaption className="mt-3 text-sm font-semibold text-muted">Illustrative ranges, not a diagnosis.</figcaption>
    </figure>
  );
}
