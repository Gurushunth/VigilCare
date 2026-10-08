"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ArrowRight, CircleAlert, CloudOff, HardDrive, OctagonAlert, Pill, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

const HeroParticles = dynamic(() => import("./HeroParticles"), { ssr: false });

export function Hero() {
  const [deadZone, setDeadZone] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-line bg-gradient-to-b from-surface to-page">
      <div className={cn("absolute inset-0 -z-10 transition-opacity duration-700", deadZone && "opacity-70")}>
        <HeroParticles deadZone={deadZone} reducedMotion={reducedMotion} />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-24">
        <div className="max-w-2xl">
          <Badge variant="outline" className="mb-6 bg-surface/80 py-1 text-[13px]">
            Offline-first · Built for patients and caregivers
          </Badge>
          <h1 id="hero-title" className="text-4xl font-extrabold leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
            A quiet second opinion on every hospital decision.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            PatientShield helps families in an emergency or a hospital stay: it guides you before help arrives, translates the
            doctor&rsquo;s round into plain words, and checks printed bills for duplicate drugs and overcharges. It works with no
            signal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/demo" className={buttonVariants({ size: "lg" })}>
              Try the live demo <ArrowRight aria-hidden />
            </a>
            <a href="#how-it-works" className={buttonVariants({ size: "lg", variant: "outline" })}>
              See how it works
            </a>
          </div>

          <div className="mt-10 flex max-w-md items-center gap-4 rounded-2xl border border-line bg-surface/90 p-4 shadow-soft backdrop-blur">
            <Switch id="dead-zone" checked={deadZone} onCheckedChange={setDeadZone} aria-describedby="dead-zone-help" />
            <div>
              <label htmlFor="dead-zone" className="cursor-pointer font-semibold text-ink">
                Simulate hospital dead zone
              </label>
              <p id="dead-zone-help" className="text-sm text-muted">
                {deadZone ? "Signal lost. The audit below keeps working on the device." : "ICUs and basements often have no signal."}
              </p>
            </div>
          </div>
        </div>

        <PreviewCard deadZone={deadZone} />
      </div>
    </section>
  );
}

function PreviewCard({ deadZone }: { deadZone: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
      <div className="rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Pill className="size-4 text-primary" aria-hidden /> Bill audit
          </div>
          {deadZone ? (
            <Badge variant="ink">
              <CloudOff aria-hidden /> Offline, still working
            </Badge>
          ) : (
            <Badge variant="live">
              <HardDrive aria-hidden /> Runs on this device
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">Sample bill · Sunrise Demo Hospital (fictional)</p>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-page p-3">
          <CircleAlert className="size-5 shrink-0 text-ink" aria-hidden />
          <p className="font-display font-bold text-ink">
            2 issues found, <span className="tabular-nums">₹400</span> potential overcharge
          </p>
        </div>

        <div className="mt-3 space-y-3">
          <div className="rounded-2xl border border-danger-line bg-danger-soft p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-danger">
              <OctagonAlert className="size-4" aria-hidden /> Alert · Duplicate medicine
            </div>
            <p className="mt-1.5 text-[15px] leading-snug text-ink">
              Dolo 650 and Calpol 500 are both <strong>paracetamol</strong>. Together: <span className="tabular-nums">4.6 g</span>/day
              vs the <span className="tabular-nums">4 g</span> adult limit.
            </p>
          </div>
          <div className="rounded-2xl border border-warn-line bg-warn-soft p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-warn">
              <TriangleAlert className="size-4 text-warn-icon" aria-hidden /> Check · Price above reference
            </div>
            <p className="mt-1.5 text-[15px] leading-snug text-ink">
              Surgical gloves billed <span className="tabular-nums">₹600</span> vs <span className="tabular-nums">₹200</span> reference
              (placeholder figure).
            </p>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-primary-soft px-3 py-2.5 text-sm text-primary-ink">
          <span className="font-semibold">Ask politely:</span> &ldquo;Could you help me understand why both Dolo 650 and Calpol 500 are on
          the bill?&rdquo;
        </p>
      </div>
    </div>
  );
}
