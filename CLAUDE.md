@AGENTS.md

# VigilCare: standing rules

VigilCare is our 24-hour hackathon entry: the independent, offline-first
health transparency and emergency shield for patients and caregivers. The site
has a landing page (`/`) and a live demo (`/demo`) that is run on stage, partly
in airplane mode. **Reliability on stage beats breadth.** Prefer scripted,
deterministic behaviour with honest labels over clever behaviour that can fail.

## Stack

- Next.js App Router, React 19, TypeScript. The brief asked for Next 15; the
  repo was scaffolded with Next 16.4 and we kept it. Read
  `node_modules/next/dist/docs/` before using a Next API.
- Tailwind CSS v4, shadcn/ui-style components in `src/components/ui`
  (hand-written, Radix primitives via `radix-ui`), lucide-react icons.
  No other UI kits.
- Particles: `@tsparticles/react` + `@tsparticles/slim` (v4 API:
  `ParticlesProvider` with a stable `init`, then `<Particles>`).
- Everything runs in the browser: React state plus localStorage. No backend,
  no API routes, no database, no network calls at runtime. The target
  architecture (Express gateway, FastAPI, PostgreSQL, MongoDB, Redis) appears
  only as a diagram.
- Seed data lives in `src/data/*.json`. Audit logic lives in
  `src/lib/auditor.ts` as pure functions with unit tests (`npm test`, Vitest).
- Fonts through `next/font` (bundled at build). No CDN scripts, fonts or
  images anywhere. Tesseract worker, core and language data are self-hosted
  under `public/tesseract/` (copied by `scripts/copy-tesseract.mjs`).
- Offline: hand-written service worker `public/sw.js`; its precache list is
  generated after `next build` by `scripts/gen-sw-manifest.mjs`. Test offline
  only on a production build (`npm run build && npm start`), never `next dev`.

## Design

- Light theme only. Tokens in `src/app/globals.css`: page `#F6FAFA`, surface
  `#FFFFFF`, ink `#0F2A33`, primary `#0E7C86`, muted `#51666E`.
- Green, amber and red are reserved for the three risk tiers and audit
  alerts. Always pair colour with an icon and a text label. Check WCAG AA.
- Headings Plus Jakarta Sans, body Inter, `tabular-nums` for amounts.
- Works from 380px to 1920px with no horizontal scroll. Large tap targets.
- Particles only in the hero, never behind body text or demo screens.

## Honesty

- Never invent names, statistics, awards or testimonials. Team details that
  are still placeholders are left off the site.
- Label everything scripted, seeded or illustrative. Roadmap features are
  labelled "Roadmap"; only the three demo screens are "Live in demo".
- Triage errs toward the more urgent tier. No probabilities on Critical.
- Placeholder prices are never presented as verified regulatory caps; show
  basis and as-of date next to every price comparison.
- Never name competitor products; use category names.
- Disclaimer: "VigilCare is a hackathon prototype. It does not provide
  medical diagnosis or treatment advice. In an emergency call 112 or 108."
