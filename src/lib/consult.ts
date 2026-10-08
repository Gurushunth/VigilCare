/**
 * "Basic offline mode" for pasted consultation notes: glossary highlighting
 * and keyword-cue sorting into three plain-English buckets. Deterministic.
 */
import glossary from "@/data/glossary.json";

export type GlossaryEntry = (typeof glossary)[number];

export type Segment = { text: string; entry?: GlossaryEntry };

export type Bucket = "changed" | "next" | "watch";

type AliasIndex = { alias: string; entry: GlossaryEntry }[];

const aliasIndex: AliasIndex = glossary
  .flatMap((entry) => entry.aliases.map((alias) => ({ alias: alias.toLowerCase(), entry })))
  // Longest alias first so "reduced urine output" beats "urine output".
  .sort((a, b) => b.alias.length - a.alias.length);

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const termRegex = new RegExp(
  `(?<![a-z0-9])(${aliasIndex.map((a) => escapeRegExp(a.alias)).join("|")})(?![a-z0-9])`,
  "gi",
);

/** Split text into plain and glossary-term segments. */
export function highlightTerms(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(termRegex)) {
    const start = m.index ?? 0;
    if (start > last) segments.push({ text: text.slice(last, start) });
    const found = aliasIndex.find((a) => a.alias === m[0].toLowerCase());
    segments.push({ text: m[0], entry: found?.entry });
    last = start + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

export function findTerms(text: string): GlossaryEntry[] {
  const seen = new Set<string>();
  const out: GlossaryEntry[] = [];
  for (const seg of highlightTerms(text)) {
    if (seg.entry && !seen.has(seg.entry.term)) {
      seen.add(seg.entry.term);
      out.push(seg.entry);
    }
  }
  return out;
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const WATCH_CUES = /\b(watch|look out|monitor for|if (he|she|they|the patient) (has|have|gets|develops)|warning|call (us|staff|the nurse)|inform|alert|desaturation|reduced urine|bleeding|any fever|signs? of)\b/i;
const NEXT_CUES = /\b(will|plan|planned|tomorrow|tonight|schedule|scheduled|repeat|switch|start|starting|continue|continuing|adding|add|keep|taper|step down|discharge|refer|order|ordered|get a|arrange|next)\b/i;

export function classifySentence(sentence: string): Bucket {
  if (WATCH_CUES.test(sentence)) return "watch";
  if (NEXT_CUES.test(sentence)) return "next";
  return "changed";
}

/** Replace known terms with "term (plain meaning)" so the card reads in plain English. */
export function explainInline(sentence: string): string {
  return highlightTerms(sentence)
    .map((s) => (s.entry ? `${s.text} (${s.entry.plain.replace(/\.$/, "").toLowerCase()})` : s.text))
    .join("");
}

export function sortIntoBuckets(text: string): Record<Bucket, string[]> {
  const buckets: Record<Bucket, string[]> = { changed: [], next: [], watch: [] };
  for (const sentence of splitSentences(text)) buckets[classifySentence(sentence)].push(explainInline(sentence));
  return buckets;
}

export const glossaryEntries = glossary;
