import { describe, expect, it } from "vitest";
import consultations from "@/data/consultations.json";
import glossary from "@/data/glossary.json";
import { classifySentence, findTerms, highlightTerms, sortIntoBuckets } from "./consult";

const example =
  "Patient is haemodynamically stable and afebrile since morning. We will switch IV antibiotics to oral, repeat CBC and CRP tomorrow, and keep NPO after midnight for the USG abdomen. Watch for desaturation or reduced urine output.";

describe("glossary", () => {
  it("has about 40 entries, each with a plain meaning", () => {
    expect(glossary.length).toBeGreaterThanOrEqual(38);
    for (const g of glossary) expect(g.plain.length).toBeGreaterThan(5);
  });

  it("finds the jargon in the example round", () => {
    const terms = findTerms(example).map((t) => t.term);
    for (const t of ["haemodynamically stable", "afebrile", "IV", "oral", "CBC", "CRP", "NPO", "USG", "desaturation", "urine output"]) {
      expect(terms).toContain(t);
    }
  });

  it("keeps the original text when segments are joined", () => {
    expect(highlightTerms(example).map((s) => s.text).join("")).toBe(example);
  });

  it("does not match terms inside other words", () => {
    expect(findTerms("Provide stationery").map((t) => t.term)).toEqual([]);
  });
});

describe("sorting into cards", () => {
  it("sorts the example into changed / next / watch", () => {
    const b = sortIntoBuckets(example);
    expect(b.changed).toHaveLength(1);
    expect(b.next).toHaveLength(1);
    expect(b.watch).toHaveLength(1);
    expect(b.watch[0]).toMatch(/^Watch for desaturation/);
  });

  it("classifies cue words", () => {
    expect(classifySentence("Creatinine is stable.")).toBe("changed");
    expect(classifySentence("Plan dressing change on alternate days.")).toBe("next");
    expect(classifySentence("Watch for fever.")).toBe("watch");
  });
});

describe("seeded consultations", () => {
  it("has three, each with all three hand-written cards filled", () => {
    expect(consultations).toHaveLength(3);
    for (const c of consultations) {
      expect(c.summary.changed.length).toBeGreaterThan(0);
      expect(c.summary.next.length).toBeGreaterThan(0);
      expect(c.summary.watch.length).toBeGreaterThan(0);
    }
  });
});
