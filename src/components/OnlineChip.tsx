"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useOnline } from "@/lib/useOnline";
import { cn } from "@/lib/utils";

/** Live connectivity chip. Neutral colours: offline is not an error here. */
export function OnlineChip({ className }: { className?: string }) {
  const online = useOnline();
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold",
        online ? "border-line-strong bg-surface text-muted" : "border-ink bg-ink text-white",
        className,
      )}
    >
      {online ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
      {online ? "Online" : "Offline: still working"}
    </span>
  );
}
