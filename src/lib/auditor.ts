/**
 * PatientShield bill and drug auditor.
 *
 * Pure functions only: no I/O, no randomness, no dates. The same input always
 * produces the same alerts, which is what we need on stage.
 */
import drugsData from "@/data/drugs.json";
import priceData from "@/data/priceReference.json";
import { formatINR } from "@/lib/utils";

export type BillItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type Drug = (typeof drugsData.drugs)[number];
export type Supply = (typeof drugsData.supplies)[number];
export type PriceReference = (typeof priceData.items)[number];

export type MatchedItem = BillItem & {
  /** Canonical name used for price lookup (drug brand or supply name). */
  canonical: string | null;
  kind: "drug" | "supply" | "unknown";
  drug?: Drug;
  purpose: string;
  activeIngredient?: string;
  drugClass?: string;
};

export type AlertSeverity = "red" | "amber";

export type AuditAlert = {
  id: string;
  severity: AlertSeverity;
  kind: "duplicate-ingredient" | "duplicate-class" | "price-above-reference";
  title: string;
  detail: string;
  /** A polite question the family can ask. Non-confrontational by design. */
  question: string;
  items: string[];
  /** Only for price alerts. */
  price?: {
    billedUnit: number;
    referenceUnit: number;
    quantity: number;
    billedTotal: number;
    referenceTotal: number;
    difference: number;
    unit: string;
    basis: string;
    source: string;
    asOf: string;
    verified: boolean;
  };
  /** Only for duplicate-ingredient alerts. */
  dose?: {
    ingredient: string;
    combinedDailyMg: number;
    limitMg: number | null;
    limitBasis: string | null;
    exceedsLimit: boolean;
  };
};

export type AuditResult = {
  items: MatchedItem[];
  alerts: AuditAlert[];
  issueCount: number;
  overchargeTotal: number;
  summary: string;
};

/** Billed unit price may exceed the reference by this fraction before we flag it. */
export const PRICE_TOLERANCE = 0.1;

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9()\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aliasMatches(name: string, alias: string): boolean {
  const n = ` ${normalise(name).replace(/[-]/g, " ")} `;
  const a = normalise(alias).replace(/[-]/g, " ");
  return n.includes(` ${a} `) || n.includes(` ${a}`) || n.replace(/\s/g, "").includes(a.replace(/\s/g, ""));
}

function bestAlias<T extends { aliases: string[] }>(name: string, entries: T[]): T | undefined {
  let best: { entry: T; len: number } | undefined;
  for (const entry of entries) {
    for (const alias of entry.aliases) {
      if (aliasMatches(name, alias) && (!best || alias.length > best.len)) {
        best = { entry, len: alias.length };
      }
    }
  }
  return best?.entry;
}

export function matchItem(item: BillItem): MatchedItem {
  const drug = bestAlias(item.name, drugsData.drugs);
  if (drug) {
    return {
      ...item,
      canonical: drug.brand,
      kind: "drug",
      drug,
      purpose: drug.purpose,
      activeIngredient: drug.activeIngredient,
      drugClass: drug.drugClass,
    };
  }
  const supply = bestAlias(item.name, drugsData.supplies);
  if (supply) {
    return { ...item, canonical: supply.name, kind: "supply", purpose: supply.purpose };
  }
  return {
    ...item,
    canonical: null,
    kind: "unknown",
    purpose: "Not in our offline list yet. Ask the pharmacist what this is for.",
  };
}

export function findPriceReference(canonical: string | null): PriceReference | undefined {
  if (!canonical) return undefined;
  return priceData.items.find((p) => p.item === canonical);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function formatGrams(mg: number): string {
  const g = mg / 1000;
  return `${Number.isInteger(g) ? g : g.toFixed(1)} g`;
}

function joinNames(names: string[]): string {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function detectDuplicateIngredients(items: MatchedItem[]): AuditAlert[] {
  const byIngredient = new Map<string, MatchedItem[]>();
  for (const item of items) {
    if (item.kind !== "drug" || !item.drug) continue;
    const list = byIngredient.get(item.drug.activeIngredient) ?? [];
    // Two lines of the same brand are a quantity question, not a duplicate drug.
    if (!list.some((x) => x.drug?.brand === item.drug?.brand)) list.push(item);
    byIngredient.set(item.drug.activeIngredient, list);
  }

  const alerts: AuditAlert[] = [];
  for (const [ingredient, group] of byIngredient) {
    if (group.length < 2) continue;
    const brands = group.map((g) => g.drug!.brand);
    const combinedDailyMg = group.reduce((sum, g) => sum + g.drug!.strengthMg * g.drug!.typicalMaxDosesPerDay, 0);
    const limit = (drugsData.ingredientLimits as Record<string, { maxDailyMg: number; basis: string }>)[ingredient];
    const exceedsLimit = limit ? combinedDailyMg > limit.maxDailyMg : false;
    const perBrand = group
      .map((g) => `${g.drug!.brand} (${g.drug!.strengthMg} mg × ${g.drug!.typicalMaxDosesPerDay})`)
      .join(" + ");

    let detail = `${joinNames(brands)} are both ${ingredient}. They are different brand names for the same medicine.`;
    if (limit) {
      detail += ` At a typical four doses a day each, the combined intake would be ${formatGrams(combinedDailyMg)} (${perBrand}) against the commonly cited adult limit of ${formatGrams(limit.maxDailyMg)} in 24 hours.`;
    }

    alerts.push({
      id: `dup-ingredient-${ingredient}`,
      severity: "red",
      kind: "duplicate-ingredient",
      title: "Duplicate active ingredient",
      detail,
      question: `Could you help me understand why both ${joinNames(brands)} are on the bill?`,
      items: brands,
      dose: {
        ingredient,
        combinedDailyMg,
        limitMg: limit?.maxDailyMg ?? null,
        limitBasis: limit?.basis ?? null,
        exceedsLimit,
      },
    });
  }
  return alerts;
}

export function detectDuplicateClasses(items: MatchedItem[]): AuditAlert[] {
  const byClass = new Map<string, Set<string>>();
  const brandsByClass = new Map<string, string[]>();
  for (const item of items) {
    if (item.kind !== "drug" || !item.drug) continue;
    const ingredients = byClass.get(item.drug.drugClass) ?? new Set<string>();
    const brands = brandsByClass.get(item.drug.drugClass) ?? [];
    if (!ingredients.has(item.drug.activeIngredient)) {
      ingredients.add(item.drug.activeIngredient);
      brands.push(item.drug.brand);
    }
    byClass.set(item.drug.drugClass, ingredients);
    brandsByClass.set(item.drug.drugClass, brands);
  }

  const alerts: AuditAlert[] = [];
  for (const [drugClass, ingredients] of byClass) {
    // Same ingredient is already reported as a duplicate ingredient; this is for different ingredients.
    if (ingredients.size < 2) continue;
    const brands = brandsByClass.get(drugClass)!;
    alerts.push({
      id: `dup-class-${normalise(drugClass).replace(/\W+/g, "-")}`,
      severity: "amber",
      kind: "duplicate-class",
      title: "Two medicines from the same group",
      detail: `${joinNames(brands)} are different medicines that do the same job (${drugClass}). Sometimes this is intended, often one is enough.`,
      question: `Is it intended that ${joinNames(brands)} are both given? They seem to work the same way.`,
      items: brands,
    });
  }
  return alerts;
}

export function detectPriceIssues(items: MatchedItem[]): AuditAlert[] {
  const alerts: AuditAlert[] = [];
  for (const item of items) {
    const ref = findPriceReference(item.canonical);
    if (!ref || item.quantity <= 0) continue;
    const billedUnit = item.quantity > 0 ? round2(item.amount / item.quantity) : item.unitPrice;
    if (billedUnit <= ref.referencePrice * (1 + PRICE_TOLERANCE)) continue;

    const referenceTotal = round2(ref.referencePrice * item.quantity);
    const difference = round2(item.amount - referenceTotal);
    alerts.push({
      id: `price-${normalise(ref.item).replace(/\W+/g, "-")}`,
      severity: "amber",
      kind: "price-above-reference",
      title: "Price above reference",
      detail: `${ref.item}: ${item.quantity} × ${formatINR(billedUnit)} = ${formatINR(item.amount)} billed, against a reference of ${formatINR(ref.referencePrice)} per ${ref.unit} (${formatINR(referenceTotal)}). Difference: ${formatINR(difference)}.`,
      question: `Could you help me understand the charge for ${ref.item.toLowerCase()}? It is ${formatINR(item.amount)} for ${item.quantity}, and I would like to know what it covers.`,
      items: [ref.item],
      price: {
        billedUnit,
        referenceUnit: ref.referencePrice,
        quantity: item.quantity,
        billedTotal: item.amount,
        referenceTotal,
        difference,
        unit: ref.unit,
        basis: ref.basis,
        source: ref.source,
        asOf: ref.asOf,
        verified: ref.verified,
      },
    });
  }
  return alerts;
}

export function summarise(issueCount: number, overchargeTotal: number): string {
  if (issueCount === 0) return "No issues found on this bill.";
  const issues = `${issueCount} ${issueCount === 1 ? "issue" : "issues"} found`;
  return overchargeTotal > 0 ? `${issues}, ${formatINR(overchargeTotal)} potential overcharge.` : `${issues}.`;
}

export function auditBill(items: BillItem[]): AuditResult {
  const matched = items.map(matchItem);
  const alerts = [
    ...detectDuplicateIngredients(matched),
    ...detectDuplicateClasses(matched),
    ...detectPriceIssues(matched),
  ].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "red" ? -1 : 1));
  const overchargeTotal = round2(alerts.reduce((sum, a) => sum + (a.price?.difference ?? 0), 0));
  return {
    items: matched,
    alerts,
    issueCount: alerts.length,
    overchargeTotal,
    summary: summarise(alerts.length, overchargeTotal),
  };
}

/* ------------------------------------------------------------------------ */
/* OCR text → line items                                                     */
/* ------------------------------------------------------------------------ */

const NUM = String.raw`(\d{1,6}(?:[.,]\d{1,2})?)`;

function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, "."));
}

/**
 * Best-effort parser for printed bills. Accepts lines such as
 *   "Surgical gloves (pair) x 10 at ₹60 = ₹600"
 *   "Dolo 650 Tablet   15   2.00   30.00"
 * Anything it cannot read is skipped; the user corrects the table before auditing.
 */
export function parseBillText(text: string): BillItem[] {
  const items: BillItem[] = [];
  const skip = /\b(total|subtotal|sub total|gst|cgst|sgst|tax|discount|amount in words|balance|paid|bill no|invoice|date|patient|qty|rate|description)\b/i;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/[₹]|rs\.?|inr/gi, " ").replace(/\s+/g, " ").trim();
    if (line.length < 4 || skip.test(line)) continue;

    // "Name x 10 at 60 = 600"
    const xAt = line.match(new RegExp(String.raw`^(.+?)\s*[x×*]\s*${NUM}\s*(?:@|at)\s*${NUM}\s*=\s*${NUM}$`, "i"));
    if (xAt) {
      const [, name, q, r, a] = xAt;
      items.push(clean(name, toNumber(q), toNumber(r), toNumber(a)));
      continue;
    }

    // "Name   qty   rate   amount" (optionally with a leading serial number)
    const cols = line.match(new RegExp(String.raw`^(?:\d{1,2}[.)]?\s+)?(.+?)\s+${NUM}\s+${NUM}\s+${NUM}$`));
    if (cols) {
      const [, name, q, r, a] = cols;
      const qty = toNumber(q);
      const rate = toNumber(r);
      const amount = toNumber(a);
      if (/[a-z]/i.test(name) && Number.isInteger(qty) && qty > 0) {
        items.push(clean(name, qty, rate, amount));
      }
    }
  }
  return items;
}

function clean(name: string, quantity: number, unitPrice: number, amount: number): BillItem {
  const fixedAmount = amount > 0 ? amount : round2(quantity * unitPrice);
  return { name: name.replace(/[|:]+$/, "").trim(), quantity, unitPrice, amount: fixedAmount };
}
