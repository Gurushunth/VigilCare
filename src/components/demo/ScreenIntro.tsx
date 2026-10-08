export function ScreenIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-ink">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
      <p className="mt-2 text-[16px] leading-relaxed text-muted sm:text-lg">{text}</p>
    </div>
  );
}
