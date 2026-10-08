import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const DISCLAIMER =
  "VigilCare is a hackathon prototype. It does not provide medical diagnosis or treatment advice. In an emergency call 112 or 108.";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-sm leading-relaxed text-muted", className)}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{DISCLAIMER}</span>
    </p>
  );
}
