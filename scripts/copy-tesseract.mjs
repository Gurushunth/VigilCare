// Self-host Tesseract.js so OCR works offline: worker, LSTM-only cores and
// English language data are copied into public/tesseract/. Runs on
// postinstall and before every build.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "tesseract");

const tesseractDir = dirname(require.resolve("tesseract.js/package.json"));
const coreDir = dirname(require.resolve("tesseract.js-core/package.json"));
const langDir = dirname(require.resolve("@tesseract.js-data/eng/package.json"));

const copies = [
  [join(tesseractDir, "dist", "worker.min.js"), join(out, "worker.min.js")],
  // OEM 1 (LSTM only): the worker picks one of these depending on SIMD support.
  ...["tesseract-core-lstm", "tesseract-core-simd-lstm", "tesseract-core-relaxedsimd-lstm"].map((f) => [
    join(coreDir, `${f}.wasm.js`),
    join(out, "core", `${f}.wasm.js`),
  ]),
  [join(langDir, "4.0.0_best_int", "eng.traineddata.gz"), join(out, "lang", "eng.traineddata.gz")],
];

for (const [from, to] of copies) {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}
console.log(`tesseract: copied ${copies.length} files to public/tesseract`);
