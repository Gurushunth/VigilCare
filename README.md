# Vigilcare

The independent, offline-first health transparency and emergency shield for patients and caregivers. Hackathon prototype.

- `/`: landing page (problem, three-phase journey, comparison, architecture, principles)
- `/demo`: three live screens that run entirely in the browser, including in airplane mode
  1. Emergency and dead-zone mode: rule-based triage, CPR metronome, lock-screen passport preview
  2. Bedside consultation translator: scripted rounds plus a basic offline paste mode
  3. Printed invoice and drug auditor: sample bill or on-device OCR, duplicate-drug and price checks

> viglecare is a hackathon prototype. It does not provide medical diagnosis or treatment advice. In an emergency call 112 or 108.

## Run it

```bash
npm install          # also copies Tesseract assets into public/tesseract
npm test             # auditor, triage and translator unit tests
npm run build        # next build, then generates the service worker precache list
npm start            # serve the production build on http://localhost:3000
```

Always present from a production build (`npm run build && npm start`). The service worker is only registered in production and does not behave reliably under `next dev`.

## Pitch-day checklist

1. `npm run build && npm start`, open `http://localhost:3000` once **while online** and wait a few seconds (the service worker caches about 20 MB, including the OCR engine).
2. Open `/demo` once too. Then turn on airplane mode and reload: both pages and all three screens keep working.
3. Presenter keys on `/demo`: **1**, **2**, **3** switch screens; **Reset demo** clears saved data and resets every screen.
4. Replace the placeholder prices in `src/data/priceReference.json` with verified figures (and set `verified`, `source`, `asOf`). Until then the site labels them as placeholders.
5. Fill in team details in the brief if you want a team section; it is left off while they are placeholders.

## Notes and deviations from the brief

- **Next.js 16.4, not 15.** The repository was already scaffolded with Next 16.4 (Turbopack, Cache Components). We kept it rather than downgrade; App Router APIs used here are the same. See `node_modules/next/dist/docs/`.
- **shadcn/ui components are hand-written** in `src/components/ui` on the same Radix primitives, because the shadcn registry was unreachable from the build environment.
- **On-device voice is opt-in.** `SpeechRecognition.available({ processLocally: true })` crashed the tab in the bundled Chromium, so the demo only probes it when the user presses "Try on-device voice (experimental)". Typing and the four scenario chips always work.
- **Reduced motion** hides the hero particles entirely.
- **OCR**: Tesseract reads the rupee sign as a leading digit (`₹60` → `360`); the parser repairs this and the user can correct any line before auditing.

## Where things live

| Path | What |
| --- | --- |
| `src/data/*.json` | Drugs, placeholder price references, sample bill, triage rules, glossary, consultations |
| `src/lib/auditor.ts` | Pure audit functions and bill-text parser (tests in `auditor.test.ts`) |
| `src/lib/triage.ts`, `src/lib/consult.ts` | Triage rules engine and translator helpers (with tests) |
| `src/components/demo/` | The three demo screens |
| `src/components/landing/` | Hero, particles and landing sections |
| `public/sw.js`, `scripts/gen-sw-manifest.mjs` | Service worker and its generated precache list |
| `scripts/copy-tesseract.mjs` | Self-hosts the Tesseract worker, LSTM cores and English data |
| `assets/sample-bill.svg` | Source of `public/sample-bill.png` (fictional hospital) |
