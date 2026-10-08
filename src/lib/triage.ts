/**
 * Rule-based, deterministic triage for the demo. Any critical keyword wins;
 * urgent beats routine; anything unrecognised is treated as urgent.
 */
import rules from "@/data/triageRules.json";

export type Tier = "routine" | "urgent" | "critical";

export type Differential = { label: string; percent: number };

export type TriageResult = {
  tier: Tier;
  /** Human labels of the rule groups that matched, e.g. "Possible stroke signs". */
  reasons: string[];
  /** The exact phrases we recognised in the input. */
  matched: string[];
  /** Illustrative ranges. Never populated for critical results. */
  differentials: Differential[];
  message?: string;
};

type Rule = { id: string; label: string; keywords: string[]; differentials?: Differential[] };

export function normaliseInput(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function matchRules(input: string, list: Rule[]) {
  const hits: { rule: Rule; phrases: string[] }[] = [];
  for (const rule of list) {
    const phrases = rule.keywords.filter((k) => input.includes(` ${normaliseInput(k).trim()} `));
    if (phrases.length) hits.push({ rule, phrases });
  }
  // Most specific first: the rule with the most matched phrases leads.
  return hits.sort((a, b) => b.phrases.length - a.phrases.length);
}

export function triage(text: string): TriageResult {
  const input = normaliseInput(text);

  if (input.trim().length === 0) {
    return { tier: "urgent", reasons: [], matched: [], differentials: [], message: rules.fallback.message };
  }

  const critical = matchRules(input, rules.critical);
  if (critical.length) {
    return {
      tier: "critical",
      reasons: critical.map((h) => h.rule.label),
      matched: critical.flatMap((h) => h.phrases),
      differentials: [],
    };
  }

  const urgent = matchRules(input, rules.urgent);
  if (urgent.length) {
    return {
      tier: "urgent",
      reasons: urgent.map((h) => h.rule.label),
      matched: urgent.flatMap((h) => h.phrases),
      differentials: urgent[0].rule.differentials ?? [],
    };
  }

  const routine = matchRules(input, rules.routine);
  if (routine.length) {
    return {
      tier: "routine",
      reasons: routine.map((h) => h.rule.label),
      matched: routine.flatMap((h) => h.phrases),
      differentials: routine[0].rule.differentials ?? [],
    };
  }

  return { tier: "urgent", reasons: [], matched: [], differentials: [], message: rules.fallback.message };
}

export const scenarios = rules.scenarios;
