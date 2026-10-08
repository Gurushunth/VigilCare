import { describe, expect, it } from "vitest";
import sampleBill from "@/data/sampleBill.json";
import priceData from "@/data/priceReference.json";
import { auditBill, matchItem, parseBillText } from "./auditor";

describe("sample bill audit (the result we show on stage)", () => {
  const result = auditBill(sampleBill.items);

  it("finds exactly two issues", () => {
    expect(result.alerts).toHaveLength(2);
    expect(result.issueCount).toBe(2);
  });

  it("raises a red duplicate-paracetamol alert first, with 4.6 g vs 4 g", () => {
    const red = result.alerts[0];
    expect(red.severity).toBe("red");
    expect(red.kind).toBe("duplicate-ingredient");
    expect(red.items).toEqual(["Dolo 650", "Calpol 500"]);
    expect(red.dose).toEqual({
      ingredient: "paracetamol",
      combinedDailyMg: 4600,
      limitMg: 4000,
      limitBasis: "Commonly cited adult limit of 4 g in 24 hours",
      exceedsLimit: true,
    });
    expect(red.detail).toContain("Dolo 650 and Calpol 500 are both paracetamol");
    expect(red.detail).toContain("4.6 g");
    expect(red.detail).toContain("4 g in 24 hours");
    expect(red.question).toBe("Could you help me understand why both Dolo 650 and Calpol 500 are on the bill?");
  });

  it("raises an amber alert for gloves: ₹600 billed vs ₹200 reference, ₹400 difference", () => {
    const amber = result.alerts[1];
    expect(amber.severity).toBe("amber");
    expect(amber.kind).toBe("price-above-reference");
    expect(amber.items).toEqual(["Surgical gloves (pair)"]);
    expect(amber.price).toMatchObject({
      billedUnit: 60,
      referenceUnit: 20,
      quantity: 10,
      billedTotal: 600,
      referenceTotal: 200,
      difference: 400,
      verified: false,
    });
    expect(amber.price?.basis).toBeTruthy();
    expect(amber.price?.asOf).toBeTruthy();
    expect(amber.question.length).toBeGreaterThan(10);
  });

  it("produces the exact summary banner", () => {
    expect(result.overchargeTotal).toBe(400);
    expect(result.summary).toBe("2 issues found, ₹400 potential overcharge.");
  });

  it("decodes a plain-English purpose for every line", () => {
    expect(result.items.every((i) => i.kind !== "unknown")).toBe(true);
    for (const item of result.items) expect(item.purpose.length).toBeGreaterThan(10);
  });

  it("is deterministic across repeated runs", () => {
    for (let i = 0; i < 20; i++) expect(auditBill(sampleBill.items)).toEqual(result);
  });
});

describe("matching", () => {
  it("maps both paracetamol brands to the same active ingredient", () => {
    expect(matchItem({ name: "DOLO-650 TAB", quantity: 1, unitPrice: 1, amount: 1 }).activeIngredient).toBe("paracetamol");
    expect(matchItem({ name: "Calpol 500 Tablet", quantity: 1, unitPrice: 1, amount: 1 }).activeIngredient).toBe("paracetamol");
  });

  it("marks unknown items honestly", () => {
    expect(matchItem({ name: "Mystery syrup", quantity: 1, unitPrice: 1, amount: 1 }).kind).toBe("unknown");
  });
});

describe("other rules", () => {
  it("flags two different drugs from the same class in amber", () => {
    const r = auditBill([
      { name: "Pantoprazole 40 mg", quantity: 10, unitPrice: 9, amount: 90 },
      { name: "Omeprazole 20 mg", quantity: 10, unitPrice: 5, amount: 50 },
    ]);
    expect(r.alerts).toHaveLength(1);
    expect(r.alerts[0]).toMatchObject({ severity: "amber", kind: "duplicate-class" });
  });

  it("reports a clean bill", () => {
    const r = auditBill([{ name: "Dolo 650", quantity: 10, unitPrice: 2, amount: 20 }]);
    expect(r.alerts).toHaveLength(0);
    expect(r.summary).toBe("No issues found on this bill.");
  });

  it("never marks a placeholder price as verified", () => {
    expect(priceData.items.every((p) => p.verified === false)).toBe(true);
    expect(priceData.items.find((p) => p.item === "Surgical gloves (pair)")?.referencePrice).toBe(20);
  });
});

describe("parseBillText", () => {
  it("reads the 'x qty at rate = amount' format", () => {
    expect(parseBillText("Surgical gloves (pair) x 10 at ₹60 = ₹600")).toEqual([
      { name: "Surgical gloves (pair)", quantity: 10, unitPrice: 60, amount: 600 },
    ]);
  });

  it("reads column format and skips headers and totals", () => {
    const text = [
      "SUNRISE DEMO HOSPITAL",
      "Description Qty Rate Amount",
      "1 Dolo 650 Tablet 15 2.00 30.00",
      "2 Calpol 500 Tablet 15 2.00 30.00",
      "Total 60.00",
    ].join("\n");
    expect(parseBillText(text)).toEqual([
      { name: "Dolo 650 Tablet", quantity: 15, unitPrice: 2, amount: 30 },
      { name: "Calpol 500 Tablet", quantity: 15, unitPrice: 2, amount: 30 },
    ]);
  });

  it("repairs the rupee sign misread as a leading digit (real Tesseract output)", () => {
    expect(parseBillText("6 Surgical gloves (pair) x 10 at 360 = 3600")).toEqual([
      { name: "Surgical gloves (pair)", quantity: 10, unitPrice: 60, amount: 600 },
    ]);
  });

  it("parses real Tesseract output of the sample bill image into the same audit result", () => {
    const ocr = [
      "SUNRISE DEMO HOSPITAL",
      "(FICTIONAL - FOR DEMONSTRATION ONLY)",
      "In-patient Pharmacy, 12 Example Road, Demo City",
      "PHARMACY BILL",
      "Bill No: SDH-PH-24-0917 Date: 06-10-2026",
      "Patient: Demo Patient (fictional) Ward: 3B",
      "# Description Qty Rate Amount",
      "1 Dolo 650 Tablet 15 2.00 30.00",
      "2 Calpol 500 Tablet 15 2.00 30.00",
      "3 Pantoprazole 40 mg Tablet 10 9.00 90.00",
      "4 Ondansetron 4 mg Tablet 10 5.00 50.00",
      "5 IV Set 1 150.00 150.00",
      "6 Surgical gloves (pair) x 10 at 360 = 3600",
      "TOTAL %950.00",
      "Prices inclusive of GST where applicable.",
      "Amount in words: Nine hundred fifty rupees only.",
    ].join("\n");
    const items = parseBillText(ocr);
    expect(items).toEqual(sampleBill.items);
    expect(auditBill(items).summary).toBe("2 issues found, ₹400 potential overcharge.");
  });

  it("round-trips the sample bill text into the same audit result", () => {
    const text = sampleBill.items
      .map((i, n) => `${n + 1} ${i.name} ${i.quantity} ${i.unitPrice.toFixed(2)} ${i.amount.toFixed(2)}`)
      .join("\n");
    expect(auditBill(parseBillText(text)).summary).toBe("2 issues found, ₹400 potential overcharge.");
  });
});
