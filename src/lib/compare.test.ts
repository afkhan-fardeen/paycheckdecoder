import { describe, expect, it } from "vitest";
import { compareStates, takeHomeCurve, CURVE_MAX, CURVE_MIN } from "./compare";
import { STATE_CODES } from "./rates";

describe("compareStates", () => {
  const rows = compareStates(STATE_CODES, 75_000, "single");

  it("returns one row per state, best take-home first", () => {
    expect(rows).toHaveLength(STATE_CODES.length);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].net).toBeGreaterThanOrEqual(rows[i].net);
  });

  it("matches a direct hand calculation for Texas at $75,000 single", () => {
    // 75,000 - 16,100 = 58,900 taxable: 1,240 + 4,560 + 22% * 8,500 = 1,870 -> 7,670 federal.
    // Biweekly rounding: gross 2,884.62 * 26 = 75,000.12; compare within a dollar of 75,000 - 7,670 - 4,650 - 1,087.50.
    const tx = rows.find((r) => r.code === "TX")!;
    expect(Math.abs(tx.net / 100 - (75_000 - 7_670 - 4_650 - 1_087.5))).toBeLessThan(2);
  });

  it("a no-tax state beats a taxed state at the same salary", () => {
    const tx = rows.find((r) => r.code === "TX")!;
    const il = rows.find((r) => r.code === "IL")!;
    expect(tx.net).toBeGreaterThan(il.net);
  });

  it("slices add up to the whole paycheck", () => {
    for (const r of rows) expect(r.slices.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 6);
  });
});

describe("takeHomeCurve", () => {
  const curve = takeHomeCurve("TX");

  it("covers the salary range and never takes home more than is earned", () => {
    expect(curve[0].salary).toBe(CURVE_MIN);
    expect(curve.at(-1)!.salary).toBe(CURVE_MAX);
    for (const p of curve) {
      expect(p.net).toBeLessThan(p.salary);
      expect(p.net + p.taxes).toBeCloseTo(p.salary, -1);
    }
  });

  it("take-home always rises with salary", () => {
    for (let i = 1; i < curve.length; i++) expect(curve[i].net).toBeGreaterThan(curve[i - 1].net);
  });
});
