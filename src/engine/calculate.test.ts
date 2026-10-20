import { describe, expect, it } from "vitest";
import { federalRates, getStateRates } from "@/lib/rates";
import { breakdownSlices } from "./breakdown";
import { taxFromBrackets } from "./brackets";
import { calculatePaycheck, validateInput } from "./calculate";
import type { PaycheckInput } from "./types";

const rates = { federal: federalRates, state: getStateRates("TX") };
const calc = (input: PaycheckInput) => calculatePaycheck(input, rates);

/**
 * Golden cases. Each expected value is worked by hand from IRS Rev. Proc. 2025-32 (2026
 * brackets and standard deductions), 6.2% Social Security up to $184,500, 1.45% Medicare
 * and 0.9% Additional Medicare above $200,000. They check the arithmetic, not the IRS
 * itself: official Pub 15-T worked examples still need adding at sign-off.
 */
describe("golden cases", () => {
  it("single, biweekly, $2,000 gross", () => {
    // annual 52,000 - 16,100 = 35,900 taxable. 12,400*10% = 1,240; 23,500*12% = 2,820; tax 4,060.
    // 4,060 / 26 = 156.15. SS 52,000*6.2% = 3,224 / 26 = 124.00. Medicare 754 / 26 = 29.00.
    const r = calc({ grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" });
    expect(r.lines.federal.perPeriod).toBe(15615);
    expect(r.lines.socialSecurity.perPeriod).toBe(12400);
    expect(r.lines.medicare.perPeriod).toBe(2900);
    expect(r.lines.net.perPeriod).toBe(169085);
    expect(r.lines.federal.annual).toBe(15615 * 26);
  });

  it("married, weekly, $3,000 gross", () => {
    // annual 156,000 - 32,200 = 123,800. 2,480 + 9,120 + 22%*23,000 = 5,060; tax 16,660 / 52 = 320.38.
    // SS 9,672 / 52 = 186.00. Medicare 2,262 / 52 = 43.50.
    const r = calc({ grossPerPeriod: 3000, frequency: "weekly", filingStatus: "married" });
    expect(r.lines.federal.perPeriod).toBe(32038);
    expect(r.lines.socialSecurity.perPeriod).toBe(18600);
    expect(r.lines.medicare.perPeriod).toBe(4350);
  });

  it("head of household, monthly, $8,000 gross", () => {
    // annual 96,000 - 24,150 = 71,850. 1,770 + 5,970 = 7,740 at 67,450; + 22%*4,400 = 968; tax 8,708 / 12 = 725.67.
    const r = calc({ grossPerPeriod: 8000, frequency: "monthly", filingStatus: "head" });
    expect(r.lines.federal.perPeriod).toBe(72567);
    expect(r.lines.socialSecurity.perPeriod).toBe(49600);
    expect(r.lines.medicare.perPeriod).toBe(11600);
  });

  it("high earner above the wage base and the Additional Medicare threshold", () => {
    // annual 260,000. SS capped: 184,500*6.2% = 11,439 / 26 = 439.96. Medicare 3,770 / 26 = 145.00.
    // Additional Medicare 60,000*0.9% = 540 / 26 = 20.77. Taxable 243,900: 41,024 base at 201,775 + 32%*42,125 = 13,480; 54,504 / 26 = 2,096.31.
    const r = calc({ grossPerPeriod: 10000, frequency: "biweekly", filingStatus: "single" });
    expect(r.lines.socialSecurity.perPeriod).toBe(43996);
    expect(r.lines.medicare.perPeriod).toBe(14500);
    expect(r.lines.additionalMedicare.perPeriod).toBe(2077);
    expect(r.lines.federal.perPeriod).toBe(209631);
  });

  it("401(k) cuts income-tax wages only; health premiums cut FICA wages too", () => {
    // weekly gross 1,500, 401k 100, health 60. Income wages 1,340 -> 69,680; FICA wages 1,440 -> 74,880.
    // Taxable 53,580: 5,800 + 22%*3,180 = 699.60; 6,499.60 / 52 = 124.99. SS 4,642.56 / 52 = 89.28. Medicare 1,085.76 / 52 = 20.88.
    const r = calc({
      grossPerPeriod: 1500,
      frequency: "weekly",
      filingStatus: "single",
      preTax401k: 100,
      preTaxHealth: 60,
    });
    expect(r.lines.federal.perPeriod).toBe(12499);
    expect(r.lines.socialSecurity.perPeriod).toBe(8928);
    expect(r.lines.medicare.perPeriod).toBe(2088);
    expect(r.lines.net.perPeriod).toBe(110485);
  });

  it("W-4 credits and extra withholding", () => {
    // Same as the first case: tax 4,060 - 2,000 credit = 2,060 / 26 = 79.23, plus 10.00 extra.
    const r = calc({
      grossPerPeriod: 2000,
      frequency: "biweekly",
      filingStatus: "single",
      w4: { creditsPerYear: 2000, extraWithholdingPerPeriod: 10 },
    });
    expect(r.lines.federal.perPeriod).toBe(8923);
  });

  it("W-4 other income and extra deductions move taxable income", () => {
    // 52,000 + 4,000 other income - 3,000 deductions - 16,100 = 36,900. 1,240 + 12%*24,500 = 2,940; tax 4,180 / 26 = 160.77.
    const r = calc({
      grossPerPeriod: 2000,
      frequency: "biweekly",
      filingStatus: "single",
      w4: { otherIncomePerYear: 4000, deductionsPerYear: 3000 },
    });
    expect(r.lines.federal.perPeriod).toBe(16077);
  });

  it("income below the standard deduction owes no federal income tax", () => {
    const r = calc({ grossPerPeriod: 200, frequency: "weekly", filingStatus: "single" });
    expect(r.lines.federal.perPeriod).toBe(0);
  });

  it("local tax uses the visitor's rate on income-tax wages", () => {
    const r = calc({
      grossPerPeriod: 2000,
      frequency: "biweekly",
      filingStatus: "single",
      localRatePercent: 1,
    });
    expect(r.lines.local.perPeriod).toBe(2000);
  });

  it("zero gross gives zeros, not NaN", () => {
    const r = calc({ grossPerPeriod: 0, frequency: "monthly", filingStatus: "single" });
    expect(r.lines.net.perPeriod).toBe(0);
    expect(r.takeHomeRate).toBe(0);
  });
});

describe("bracket math", () => {
  it("is continuous at every bracket edge", () => {
    for (const status of ["single", "married", "head"] as const) {
      const table = federalRates.parameters.brackets[status];
      for (const { upTo } of table) {
        if (upTo === null) continue;
        const below = taxFromBrackets(upTo - 0.01, table);
        const above = taxFromBrackets(upTo + 0.01, table);
        expect(above - below).toBeGreaterThanOrEqual(0);
        expect(above - below).toBeLessThan(0.02);
      }
    }
  });

  it("matches the Rev. Proc. 2025-32 'tax is' base amounts", () => {
    const t = federalRates.parameters.brackets;
    expect(taxFromBrackets(50400, t.single)).toBeCloseTo(5800, 6);
    expect(taxFromBrackets(105700, t.single)).toBeCloseTo(17966, 6);
    expect(taxFromBrackets(640600, t.single)).toBeCloseTo(192979.25, 6);
    expect(taxFromBrackets(100800, t.married)).toBeCloseTo(11600, 6);
    expect(taxFromBrackets(768700, t.married)).toBeCloseTo(206583.5, 6);
    expect(taxFromBrackets(67450, t.head)).toBeCloseTo(7740, 6);
    expect(taxFromBrackets(640600, t.head)).toBeCloseTo(191171, 6);
  });
});

describe("invariants", () => {
  it("lines always add up to gross and annual = perPeriod * periods", () => {
    const frequencies = ["weekly", "biweekly", "semimonthly", "monthly"] as const;
    const statuses = ["single", "married", "head"] as const;
    let seed = 12345;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 500; i++) {
      const gross = Math.round(rand() * 40000 * 100) / 100;
      const r = calc({
        grossPerPeriod: gross,
        frequency: frequencies[i % 4],
        filingStatus: statuses[i % 3],
        preTax401k: Math.round(rand() * gross * 0.1 * 100) / 100,
        preTaxHealth: Math.round(rand() * gross * 0.05 * 100) / 100,
        postTax: Math.round(rand() * gross * 0.02 * 100) / 100,
      });
      const l = r.lines;
      const sum =
        l.net.perPeriod +
        l.preTax401k.perPeriod +
        l.preTaxHealth.perPeriod +
        l.federal.perPeriod +
        l.socialSecurity.perPeriod +
        l.medicare.perPeriod +
        l.additionalMedicare.perPeriod +
        l.state.perPeriod +
        l.local.perPeriod +
        l.postTax.perPeriod;
      expect(sum).toBe(l.gross.perPeriod);
      expect(l.net.annual).toBe(l.net.perPeriod * r.periods);
      expect(l.net.perPeriod).toBeGreaterThanOrEqual(0);
      const slices = breakdownSlices(r);
      expect(slices.reduce((s, x) => s + x.perPeriod, 0)).toBe(l.gross.perPeriod);
    }
  });
});

describe("validation", () => {
  it("rejects negative, non-finite and absurd input", () => {
    expect(validateInput({ grossPerPeriod: -1, frequency: "weekly", filingStatus: "single" })).toHaveLength(
      1,
    );
    expect(validateInput({ grossPerPeriod: NaN, frequency: "weekly", filingStatus: "single" })).toHaveLength(
      1,
    );
    expect(validateInput({ grossPerPeriod: 1e9, frequency: "weekly", filingStatus: "single" })).toHaveLength(
      1,
    );
  });

  it("rejects pre-tax deductions above gross and an out-of-range local rate", () => {
    expect(
      validateInput({ grossPerPeriod: 100, frequency: "weekly", filingStatus: "single", preTax401k: 150 }),
    ).toHaveLength(1);
    expect(
      validateInput({
        grossPerPeriod: 100,
        frequency: "weekly",
        filingStatus: "single",
        localRatePercent: 40,
      }),
    ).toHaveLength(1);
  });

  it("calculatePaycheck throws on invalid input and on deductions that exceed net", () => {
    expect(() => calc({ grossPerPeriod: -5, frequency: "weekly", filingStatus: "single" })).toThrow(
      RangeError,
    );
    expect(() =>
      calc({ grossPerPeriod: 100, frequency: "weekly", filingStatus: "single", postTax: 500 }),
    ).toThrow(RangeError);
  });
});

/**
 * IRS Publication 15-T (2026), automated percentage method, STANDARD schedules (step 2 box not checked).
 * Worksheet 1A line 1(g) subtracts $8,600 (married filing jointly: $12,900) from annual wages, then the
 * schedule applies. Read from irs.gov/publications/p15t on 2026-10-18. This proves the engine's
 * "standard deduction, then brackets" method gives the same tax as the IRS tables.
 */
describe("matches IRS Publication 15-T (2026) percentage method", () => {
  type Row = [floor: number, base: number, rate: number];
  const SINGLE: Row[] = [
    [0, 0, 0],
    [7500, 0, 0.1],
    [19900, 1240, 0.12],
    [57900, 5800, 0.22],
    [113200, 17966, 0.24],
    [209275, 41024, 0.32],
    [263725, 58448, 0.35],
    [648100, 192979.25, 0.37],
  ];
  const MARRIED: Row[] = [
    [0, 0, 0],
    [19300, 0, 0.1],
    [44100, 2480, 0.12],
    [120100, 11600, 0.22],
    [230700, 35932, 0.24],
    [422850, 82048, 0.32],
    [531750, 116896, 0.35],
    [788000, 206583.5, 0.37],
  ];
  const pub15t = (rows: Row[], adjustment: number, annualWages: number) => {
    const adjusted = Math.max(0, annualWages - adjustment);
    const row = [...rows].reverse().find(([floor]) => adjusted >= floor)!;
    return row[1] + (adjusted - row[0]) * row[2];
  };

  it("single and married tax agree at wages across every bracket", () => {
    for (const annual of [
      0, 8000, 16100, 25000, 40000, 52000, 75000, 120000, 180000, 250000, 400000, 700000,
    ]) {
      for (const [status, rows, adjustment] of [
        ["single", SINGLE, 8600],
        ["married", MARRIED, 12900],
      ] as const) {
        const expected = pub15t(rows, adjustment, annual);
        const r = calc({ grossPerPeriod: annual / 52, frequency: "weekly", filingStatus: status });
        // The weekly pay input and the weekly tax are each rounded to the cent, which can move the
        // annual figure by up to about 35 cents. A method difference would be dollars.
        expect(Math.abs(r.lines.federal.annual / 100 - expected)).toBeLessThan(0.5);
      }
    }
  });
});
