import {
  Ambulance,
  ArrowRight,
  BookOpenText,
  Check,
  CircleCheck,
  CloudOff,
  Database,
  FileScan,
  HandHeart,
  HeartPulse,
  Layers,
  type LucideIcon,
  Map as MapIcon,
  MessagesSquare,
  Mic,
  PenLine,
  Pill,
  ReceiptText,
  Scale,
  Server,
  ShieldCheck,
  Siren,
  Smartphone,
  Stethoscope,
  Syringe,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SectionHeading({ id, eyebrow, title, text }: { id: string; eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-ink">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-muted">{text}</p>}
    </div>
  );
}

function Section({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-20 py-20 sm:py-24", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

const PROBLEMS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Syringe,
    title: "Overtreatment",
    text: "Repeated tests, two drugs that do the same job, longer ICU stays and procedures that may not be needed.",
  },
  {
    icon: Stethoscope,
    title: "Information gap",
    text: "Rounds are quick and full of medical terms. Families cannot judge what was said or what to ask.",
  },
  {
    icon: Siren,
    title: "Emergency panic",
    text: "While waiting for an ambulance, people have no clear guide on how serious it is or what to do.",
  },
  {
    icon: WifiOff,
    title: "Hospital dead zones",
    text: "ICUs, scan rooms and basements block mobile signal, so apps that need the cloud stop working.",
  },
  {
    icon: PenLine,
    title: "Handwriting misreads",
    text: "Automated reading of handwritten notes makes dangerous mistakes. We read printed bills instead.",
  },
];

export function ProblemSection() {
  return (
    <Section id="problem">
      <SectionHeading
        id="problem-title"
        eyebrow="The problem"
        title="Families face hospital decisions alone, often with no signal."
        text="These are systemic problems, not the fault of any one hospital or doctor. They hit hardest when someone is scared and short on time."
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PROBLEMS.map((p, i) => (
          <li key={p.title} className="rounded-card border border-line bg-surface p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary-ink">
                <p.icon className="size-5" aria-hidden />
              </span>
              <span className="font-display text-sm font-bold tabular-nums text-muted">0{i + 1}</span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-ink">{p.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------------ */

type Feature = { icon: LucideIcon; name: string; live: boolean; note?: string };

const PHASES: { step: string; title: string; when: string; icon: LucideIcon; features: Feature[] }[] = [
  {
    step: "Phase 1",
    title: "Before the hospital",
    when: "At home, on the road, waiting for help",
    icon: Siren,
    features: [
      { icon: Mic, name: "Symptom risk gauge: Routine, Urgent, Critical", live: true, note: "Typed or sample scenarios; voice where on-device" },
      { icon: Layers, name: "Differential ranges instead of one diagnosis", live: true },
      { icon: HeartPulse, name: "Offline CPR metronome and first-aid steps", live: true },
      { icon: Smartphone, name: "Emergency health passport with QR", live: true, note: "Lock-screen preview" },
      { icon: Ambulance, name: "Aggregated emergency dispatch", live: false },
    ],
  },
  {
    step: "Phase 2",
    title: "In the hospital",
    when: "At the bedside and during rounds",
    icon: MessagesSquare,
    features: [
      { icon: MessagesSquare, name: "Doctor-round summariser: changed, next step, warning signs", live: true, note: "Scripted rounds in the demo" },
      { icon: BookOpenText, name: "Medical term explainer", live: true },
      { icon: Stethoscope, name: "Silent treatment analyser", live: false },
      { icon: Scale, name: "Offline patient rights directory", live: false },
    ],
  },
  {
    step: "Phase 3",
    title: "After the hospital",
    when: "At the pharmacy counter and billing desk",
    icon: ReceiptText,
    features: [
      { icon: FileScan, name: "Printed bill and pharmacy invoice OCR", live: true },
      { icon: Pill, name: "Same-ingredient and same-class drug detector", live: true },
      { icon: ReceiptText, name: "Price and line-item auditor", live: true, note: "Placeholder reference prices" },
    ],
  },
];

export function HowItWorksSection() {
  return (
    <Section id="how-it-works" className="border-y border-line bg-surface">
      <SectionHeading
        id="how-it-works-title"
        eyebrow="How it works"
        title="One shield across the whole hospital journey."
        text="Each phase works on the device, so it keeps going in a dead zone. We are honest about scope: features marked Roadmap are not in today’s demo."
      />
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Badge variant="live" className="py-1 text-[13px]">
          <CircleCheck aria-hidden /> Live in demo
        </Badge>
        <Badge variant="roadmap" className="py-1 text-[13px]">
          <MapIcon aria-hidden /> Roadmap
        </Badge>
      </div>

      <ol className="relative mt-10 grid gap-6 lg:grid-cols-3">
        {/* journey line: vertical on mobile, horizontal on desktop */}
        <span aria-hidden className="absolute bottom-6 left-[1.6rem] top-6 w-0.5 bg-line-strong lg:hidden" />
        <span aria-hidden className="absolute left-12 right-12 top-[1.6rem] hidden h-0.5 bg-line-strong lg:block" />
        {PHASES.map((phase) => (
          <li key={phase.step} className="relative pl-16 lg:pl-0">
            <span className="absolute left-0 top-0 grid size-[3.25rem] place-items-center rounded-2xl bg-primary text-white shadow-soft lg:relative">
              <phase.icon className="size-6" aria-hidden />
            </span>
            <div className="rounded-card border border-line bg-page p-5 lg:mt-5">
              <p className="text-sm font-semibold text-primary-ink">{phase.step}</p>
              <h3 className="text-xl font-bold text-ink">{phase.title}</h3>
              <p className="text-sm text-muted">{phase.when}</p>
              <ul className="mt-4 space-y-2.5">
                {phase.features.map((f) => (
                  <li key={f.name} className="flex items-start gap-3 rounded-xl bg-surface p-3">
                    <f.icon className={cn("mt-0.5 size-5 shrink-0", f.live ? "text-primary" : "text-muted")} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[15px] font-semibold leading-snug", f.live ? "text-ink" : "text-muted")}>{f.name}</p>
                      {f.note && <p className="mt-0.5 text-xs text-muted">{f.note}</p>}
                    </div>
                    <Badge variant={f.live ? "live" : "roadmap"} className="mt-0.5 shrink-0">
                      {f.live ? "Live in demo" : "Roadmap"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------------------ */

export function DemoTeaserSection() {
  const screens = [
    { icon: Siren, title: "Emergency and dead-zone mode", text: "Urgency check, CPR rhythm, lock-screen passport." },
    { icon: MessagesSquare, title: "Bedside translator", text: "A doctor’s round in three plain-English answers." },
    { icon: ReceiptText, title: "Bill and drug auditor", text: "Duplicate medicines and overcharges, found offline." },
  ];
  return (
    <Section id="demo">
      <div className="overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-lift sm:p-10 lg:p-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <Badge className="border-white/20 bg-white/10 text-white">
              <CloudOff aria-hidden /> Works in airplane mode
            </Badge>
            <h2 id="demo-title" className="mt-5 text-3xl font-extrabold sm:text-4xl">
              Three screens, running entirely on this device.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">
              Turn off Wi-Fi and try it. Sample data is fictional and clearly labelled; nothing you type leaves the browser.
            </p>
            <a href="/demo" className={cn(buttonVariants({ size: "lg" }), "mt-8 bg-white text-ink hover:bg-primary-soft")}>
              Open the live demo <ArrowRight aria-hidden />
            </a>
          </div>
          <ul className="grid gap-3">
            {screens.map((s, i) => (
              <li key={s.title} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display font-bold">
                    <span className="mr-2 tabular-nums text-white/60">{i + 1}</span>
                    {s.title}
                  </p>
                  <p className="text-sm text-white/75">{s.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------------ */

const COMPARE: [string, string, string, string][] = [
  ["Coverage", "Post-care storage only", "Pre-care advice only", "End to end: before, during and after hospitalisation"],
  ["Dead-zone usability", "Needs cloud", "Needs cloud", "Offline edge architecture"],
  ["Bill and drug auditing", "None", "None", "Automated duplicate-drug and overcharge detection"],
  ["Data intake", "Manual PDF upload", "Text questionnaires", "Printed pharmacy receipt OCR"],
  ["Clinical position", "Passive record store", "Direct diagnosis", "Protective, non-confrontational background investigator"],
];

export function CompareSection() {
  return (
    <Section id="compare" className="border-y border-line bg-surface">
      <SectionHeading
        id="compare-title"
        eyebrow="Why it is different"
        title="Not another record store. Not another symptom checker."
        text="Compared by category of tool, not by product."
      />
      {/* Desktop / tablet: table */}
      <div className="mt-10 hidden overflow-hidden rounded-card border border-line md:block">
        <table className="w-full text-left text-[15px]">
          <caption className="sr-only">Comparison of VigilCare with health record apps and symptom checkers</caption>
          <thead className="bg-page">
            <tr>
              <th scope="col" className="w-[18%] p-4 font-semibold text-muted">Dimension</th>
              <th scope="col" className="w-[22%] p-4 font-semibold text-ink">Health record apps</th>
              <th scope="col" className="w-[22%] p-4 font-semibold text-ink">Symptom checkers</th>
              <th scope="col" className="bg-primary p-4 font-bold text-white">VigilCare</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map(([dim, a, b, ps]) => (
              <tr key={dim} className="border-t border-line">
                <th scope="row" className="p-4 font-semibold text-ink">{dim}</th>
                <td className="p-4 text-muted">{a}</td>
                <td className="p-4 text-muted">{b}</td>
                <td className="bg-primary-soft/60 p-4 font-semibold text-ink">
                  <span className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {ps}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile: stacked cards, no horizontal scroll */}
      <ul className="mt-8 space-y-4 md:hidden">
        {COMPARE.map(([dim, a, b, ps]) => (
          <li key={dim} className="rounded-card border border-line bg-page p-4">
            <h3 className="font-bold text-ink">{dim}</h3>
            <dl className="mt-3 space-y-2 text-[15px]">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Health record apps</dt>
                <dd className="text-ink">{a}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Symptom checkers</dt>
                <dd className="text-ink">{b}</dd>
              </div>
              <div className="rounded-xl bg-primary-soft p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-primary-ink">VigilCare</dt>
                <dd className="font-semibold text-ink">{ps}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------------ */

type Tier = { name: string; icon: LucideIcon; items: string[]; today?: boolean };

const TIERS: Tier[] = [
  {
    name: "Client tier",
    icon: Smartphone,
    today: true,
    items: ["Next.js app with service worker", "On-device OCR (Tesseract)", "Rule-based triage and auditor", "Local storage, nothing uploaded"],
  },
  {
    name: "API tier",
    icon: Server,
    items: ["Express API gateway", "FastAPI services: triage, summariser, auditor", "Sync when signal returns"],
  },
  {
    name: "Persistence tier",
    icon: Database,
    items: ["PostgreSQL: users, bills, audits", "MongoDB: transcripts and notes", "Redis: cache and job queue"],
  },
  {
    name: "Datasets and integrations",
    icon: Layers,
    items: ["Drug and active-ingredient database", "Regulated price references", "Emergency dispatch services", "Patient rights directory"],
  },
];

export function ArchitectureSection() {
  return (
    <Section id="architecture">
      <SectionHeading
        id="architecture-title"
        eyebrow="Under the hood"
        title="Edge first, cloud when it helps."
        text="The target architecture keeps critical features on the phone and syncs when a signal returns. Today’s demo runs entirely in the client tier."
      />
      <div className="mt-12 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        {TIERS.map((t, i) => (
          <div key={t.name} className="contents">
            <div
              className={cn(
                "relative rounded-card border bg-surface p-5 shadow-soft",
                t.today ? "border-2 border-primary" : "border-dashed border-line-strong",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("grid size-10 place-items-center rounded-xl", t.today ? "bg-primary text-white" : "bg-page text-muted")}>
                  <t.icon className="size-5" aria-hidden />
                </span>
                {t.today ? (
                  <Badge variant="live">
                    <CircleCheck aria-hidden /> Today&rsquo;s demo runs here
                  </Badge>
                ) : (
                  <Badge variant="roadmap">Roadmap</Badge>
                )}
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{t.name}</h3>
              <ul className="mt-3 space-y-2 text-[15px] text-muted">
                {t.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", t.today ? "bg-primary" : "bg-line-strong")} aria-hidden />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
            {i < TIERS.length - 1 && (
              <div aria-hidden className="flex items-center justify-center text-line-strong">
                <ArrowRight className="size-6 rotate-90 lg:rotate-0" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------------ */

const PRINCIPLES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Stethoscope,
    title: "Not a doctor",
    text: "VigilCare never diagnoses or prescribes. It gives facts and ranges, labels what is illustrative, and always points to professional care.",
  },
  {
    icon: HandHeart,
    title: "Non-confrontational",
    text: "It never argues with the care team. Every finding comes with a polite question the family can ask, so conversations stay calm.",
  },
  {
    icon: ShieldCheck,
    title: "Data stays on the device",
    text: "Bills, notes and health details are processed and stored on the phone. Nothing is uploaded in the demo.",
  },
];

export function PrinciplesSection() {
  return (
    <Section id="principles" className="border-t border-line bg-surface">
      <SectionHeading id="principles-title" eyebrow="Principles" title="A quiet investigator on the family’s side." />
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <li key={p.title} className="rounded-card border border-line bg-page p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary-ink">
              <p.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-5 text-xl font-bold text-ink">{p.title}</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-muted">{p.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
