import { cn } from "@/lib/utils";

export function ShieldMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <path
        d="M16 2.5 4.5 6.8v8.4c0 7 4.8 12.4 11.5 14.3 6.7-1.9 11.5-7.3 11.5-14.3V6.8L16 2.5Z"
        fill="#0E7C86"
      />
      <path d="M16 5.6 7.4 8.8v6.4c0 5.3 3.5 9.5 8.6 11.2V5.6Z" fill="#ffffff" fillOpacity="0.16" />
      <path d="M14.2 10.5h3.6v3.7h3.7v3.6h-3.7v3.7h-3.6v-3.7h-3.7v-3.6h3.7z" fill="#ffffff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ShieldMark />
      <span className="font-display text-lg font-extrabold tracking-tight text-ink">PatientShield</span>
    </span>
  );
}
