import { describe, expect, it } from "vitest";
import { scenarios, triage } from "./triage";

describe("triage", () => {
  it("classifies the four stage scenarios deterministically", () => {
    expect(scenarios.map((s) => triage(s.text).tier)).toEqual(["critical", "critical", "urgent", "routine"]);
  });

  it.each([
    "face drooping and slurred speech",
    "his arm weakness started suddenly",
    "sudden vision loss in one eye",
    "she lost balance and fell",
    "chest pressure and jaw pain",
    "pain spreading to arm with cold sweat",
    "he is gasping and can't breathe",
  ])("treats red flags as critical: %s", (text) => {
    expect(triage(text).tier).toBe("critical");
  });

  it("lets a red flag win over routine words", () => {
    expect(triage("mild headache and slurred speech").tier).toBe("critical");
  });

  it("never shows probabilities on a critical result", () => {
    expect(triage("chest pain").differentials).toEqual([]);
  });

  it("defaults unrecognised input to urgent with the fallback message", () => {
    const r = triage("something feels off with grandma");
    expect(r.tier).toBe("urgent");
    expect(r.message).toBe("We could not classify this. If in doubt, treat it as urgent.");
  });

  it("returns illustrative differentials that add up to 100 for non-critical results", () => {
    const r = triage("mild headache");
    expect(r.tier).toBe("routine");
    expect(r.differentials).toEqual([
      { label: "Tension headache", percent: 60 },
      { label: "Dehydration", percent: 30 },
      { label: "Sinusitis", percent: 10 },
    ]);
  });

  it("prefers urgent over routine when both match", () => {
    expect(triage("headache with high fever").tier).toBe("urgent");
  });
});
