"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Keyboard, MessagesSquare, ReceiptText, RotateCcw, Siren } from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";
import { Logo } from "@/components/Logo";
import { OnlineChip } from "@/components/OnlineChip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { clearDemoStorage } from "@/lib/storage";
import { EmergencyScreen } from "./EmergencyScreen";
import { ConsultScreen } from "./ConsultScreen";
import { BillScreen } from "./BillScreen";

const SCREENS = [
  { value: "emergency", key: "1", label: "Emergency", long: "Emergency & dead zone", icon: Siren },
  { value: "bedside", key: "2", label: "Bedside", long: "Bedside translator", icon: MessagesSquare },
  { value: "bill", key: "3", label: "Bill audit", long: "Invoice & drug auditor", icon: ReceiptText },
] as const;

type ScreenValue = (typeof SCREENS)[number]["value"];

/** Fired on every tab change so screens can stop audio or playback when hidden. */
const SCREEN_EVENT = "patientshield:screen"; // also used in useScreenHidden.ts

function announceScreen(value: ScreenValue) {
  window.dispatchEvent(new CustomEvent<ScreenValue>(SCREEN_EVENT, { detail: value }));
}

export function DemoShell() {
  const [tab, setTabState] = useState<ScreenValue>("emergency");
  const setTab = useCallback((value: ScreenValue) => {
    setTabState(value);
    announceScreen(value);
  }, []);
  // Bumping this remounts every screen: state, timers and audio are reset.
  const [resetKey, setResetKey] = useState(0);
  const [resetNotice, setResetNotice] = useState(false);

  const reset = useCallback(() => {
    clearDemoStorage();
    window.speechSynthesis?.cancel();
    setResetKey((k) => k + 1);
    setResetNotice(true);
    window.setTimeout(() => setResetNotice(false), 2000);
  }, []);

  // Presenter keys: 1, 2, 3 jump between screens (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      const screen = SCREENS.find((s) => s.key === e.key);
      if (screen) {
        setTab(screen.value);
        window.scrollTo({ top: 0 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTab]);

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <a href="/" className="flex shrink-0 items-center gap-1 rounded-lg" aria-label="Back to PatientShield overview">
            <ArrowLeft className="size-4 text-muted" aria-hidden />
            <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          </a>
          <span className="ml-1 hidden rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-ink md:inline">
            Live demo
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-muted lg:inline-flex">
              <Keyboard className="size-4" aria-hidden /> Press 1, 2, 3
            </span>
            <OnlineChip />
            <Button variant="outline" size="sm" onClick={reset} className="h-10" aria-live="polite">
              <RotateCcw aria-hidden /> {resetNotice ? "Cleared" : "Reset demo"}
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ScreenValue)}>
          <TabsList className="sticky top-[4.5rem] z-30 grid-cols-3" aria-label="Demo screens">
            {SCREENS.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>
                <s.icon aria-hidden />
                <span className="sm:hidden">{s.label}</span>
                <span className="hidden sm:inline">{s.long}</span>
                <kbd className="ml-1 hidden rounded border border-current/30 px-1.5 text-[11px] font-medium opacity-70 lg:inline">{s.key}</kbd>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="emergency" forceMount hidden={tab !== "emergency"}>
            <EmergencyScreen key={`e${resetKey}`} />
          </TabsContent>
          <TabsContent value="bedside" forceMount hidden={tab !== "bedside"}>
            <ConsultScreen key={`c${resetKey}`} />
          </TabsContent>
          <TabsContent value="bill" forceMount hidden={tab !== "bill"}>
            <BillScreen key={`b${resetKey}`} />
          </TabsContent>
        </Tabs>

        <div className="mt-12 rounded-2xl border border-line bg-surface p-4">
          <Disclaimer />
        </div>
      </main>
    </TooltipProvider>
  );
}
