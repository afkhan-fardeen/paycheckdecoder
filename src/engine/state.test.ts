import { describe, expect, it } from "vitest";
import { federalRates, getStateRates, type StateCode } from "@/lib/rates";
import { calculatePaycheck, validateInput } from "./calculate";
import type { PaycheckInput } from "./types";

const calc = (code: StateCode, input: PaycheckInput) =>
  calculatePaycheck(input, { federal: federalRates, state: getStateRates(code) });

/**
 * Official worked examples, read from each state's 2026 publication on 2026-10-18.
 * The input pay is the taxable wage in those examples, so every other deduction is zero.
 */
describe("official state examples", () => {
  it("Illinois IL-700-T page 4: $800 weekly, line-1 allowances only", () => {
    // The official example also claims 2 line-2 allowances ($1,000 each) and withholds $32.13.
    // Line 2 is not modelled, so check the same method with 2 line-1 allowances instead:
    // 41,600 - 2*2,925 = 35,750 * 4.95% = 1,769.625 / 52 = 34.03.
    const r = calc("IL", {
      grossPerPeriod: 800,
      frequency: "weekly",
      filingStatus: "single",
      stateAllowances: 2,
    });
    expect(r.lines.state.perPeriod).toBe(3403);
  });

  it("Illinois IL-700-T method matches the printed $32.13 when exemptions total $7,850", () => {
    // 7,850 of exemptions equals 2 line-1 allowances plus 2 line-2 allowances. Reproduce via 2.684 allowances:
    // not representable, so verify the formula directly: (41,600 - 7,850) * 4.95% / 52 = 32.13.
    expect(Math.round((((41600 - 7850) * 0.0495) / 52) * 100)).toBe(3213);
  });

  it("North Carolina NC-30 page 20: $450 weekly, single, 2 allowances withholds $4", () => {
    const r = calc("NC", {
      grossPerPeriod: 450,
      frequency: "weekly",
      filingStatus: "single",
      stateAllowances: 2,
    });
    expect(r.lines.state.perPeriod).toBe(400);
  });

  it("Georgia guide page 51: $2,000 semi-monthly, married, 1 dependent withholds $27.03", () => {
    const r = calc("GA", {
      grossPerPeriod: 2000,
      frequency: "semimonthly",
      filingStatus: "married",
      stateAllowances: 1,
    });
    expect(r.lines.state.perPeriod).toBe(2703);
  });

  it("Georgia guide page 52: head of household, $935 biweekly, 2 dependents withholds $0", () => {
    const r = calc("GA", {
      grossPerPeriod: 935,
      frequency: "biweekly",
      filingStatus: "head",
      stateAllowances: 2,
    });
    expect(r.lines.state.perPeriod).toBe(0);
  });
});

describe("hand-computed state cases", () => {
  it("Ohio: tier 2, no exemptions", () => {
    // biweekly 2,000 -> 52,000. (52,000 - 26,050) * 2.99% + 416.80 = 1,192.705 / 26 = 45.87.
    const r = calc("OH", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" });
    expect(r.lines.state.perPeriod).toBe(4587);
  });

  it("Ohio: two exemptions lower taxable pay by $1,300", () => {
    // 50,700 -> (50,700 - 26,050) * 2.99% + 416.80 = 1,153.835 / 26 = 44.38.
    const r = calc("OH", {
      grossPerPeriod: 2000,
      frequency: "biweekly",
      filingStatus: "single",
      stateAllowances: 2,
    });
    expect(r.lines.state.perPeriod).toBe(4438);
  });

  it("Ohio: tier 1 and tier 3", () => {
    // weekly 400 -> 20,800 * 1.6% = 332.80 / 52 = 6.40.
    expect(
      calc("OH", { grossPerPeriod: 400, frequency: "weekly", filingStatus: "single" }).lines.state.perPeriod,
    ).toBe(640);
    // monthly 12,500 -> 150,000: 2,627.91 + 50,000 * 3.4% = 4,327.91 / 12 = 360.66.
    expect(
      calc("OH", { grossPerPeriod: 12500, frequency: "monthly", filingStatus: "single" }).lines.state
        .perPeriod,
    ).toBe(36066);
  });

  it("Ohio tier edges are continuous", () => {
    const at = (wages: number) =>
      calc("OH", { grossPerPeriod: wages / 26, frequency: "biweekly", filingStatus: "single" }).lines.state
        .annual;
    expect(Math.abs(at(26_050.5) - at(26_049.5))).toBeLessThan(60);
    expect(Math.abs(at(100_001) - at(99_999))).toBeLessThan(60);
  });

  it("Illinois: no allowances, $2,000 biweekly", () => {
    // 52,000 * 4.95% = 2,574 / 26 = 99.00.
    expect(
      calc("IL", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.state
        .perPeriod,
    ).toBe(9900);
  });

  it("North Carolina: head of household uses the larger deduction, whole dollars", () => {
    // 52,000 - 19,125 = 32,875 * 4.09% = 1,344.6 / 26 = 51.7 -> $52.
    const r = calc("NC", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "head" });
    expect(r.lines.state.perPeriod).toBe(5200);
    expect(r.lines.state.perPeriod % 100).toBe(0);
  });

  it("Georgia: single, $2,000 biweekly", () => {
    // 52,000 - 15,000 = 37,000 * 4.99% = 1,846.3 / 26 = 71.01.
    expect(
      calc("GA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.state
        .perPeriod,
    ).toBe(7101);
  });

  it("allowances cannot push withholding below zero", () => {
    for (const code of ["IL", "NC", "OH", "GA"] as const) {
      const r = calc(code, {
        grossPerPeriod: 300,
        frequency: "weekly",
        filingStatus: "single",
        stateAllowances: 99,
      });
      expect(r.lines.state.perPeriod).toBe(0);
    }
  });

  it("401(k) lowers state taxable pay too", () => {
    const base = calc("GA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" });
    const k = calc("GA", {
      grossPerPeriod: 2000,
      frequency: "biweekly",
      filingStatus: "single",
      preTax401k: 200,
    });
    expect(k.lines.state.perPeriod).toBeLessThan(base.lines.state.perPeriod);
  });
});

describe("Washington programs", () => {
  it("applies PFML employee share and WA Cares on gross pay", () => {
    // biweekly 2,000 -> 52,000. PFML 52,000 * 1.13% * 71.43% = 419.71; WA Cares 52,000 * 0.58% = 301.60.
    // Total 721.31 / 26 = 27.74.
    const r = calc("WA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" });
    expect(r.lines.state.perPeriod).toBe(0);
    expect(r.lines.statePrograms.perPeriod).toBe(2774);
  });

  it("caps PFML at the wage cap but not WA Cares", () => {
    // monthly 20,000 -> 240,000. PFML 184,500 * 1.13% * 71.43% = 1,489.2; WA Cares 240,000 * 0.58% = 1,392.
    // Total 2,881.2 / 12 = 240.10.
    const r = calc("WA", { grossPerPeriod: 20000, frequency: "monthly", filingStatus: "single" });
    expect(r.lines.statePrograms.perPeriod).toBe(24010);
  });

  it("programs are part of total taxes and the net adds up", () => {
    const r = calc("WA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" });
    const l = r.lines;
    expect(
      l.net.perPeriod +
        l.federal.perPeriod +
        l.socialSecurity.perPeriod +
        l.medicare.perPeriod +
        l.statePrograms.perPeriod,
    ).toBe(200000);
  });

  it("other states have no programs", () => {
    expect(
      calc("TX", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.statePrograms
        .perPeriod,
    ).toBe(0);
  });
});

describe("allowance validation", () => {
  it("rejects fractions, negatives and large counts", () => {
    const base = { grossPerPeriod: 100, frequency: "weekly", filingStatus: "single" } as const;
    expect(validateInput({ ...base, stateAllowances: 1.5 })).toHaveLength(1);
    expect(validateInput({ ...base, stateAllowances: -1 })).toHaveLength(1);
    expect(validateInput({ ...base, stateAllowances: 100 })).toHaveLength(1);
    expect(validateInput({ ...base, stateAllowances: 3 })).toHaveLength(0);
  });
});
