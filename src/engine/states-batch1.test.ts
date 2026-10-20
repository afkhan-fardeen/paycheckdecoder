import { describe, expect, it } from "vitest";
import { federalRates, getStateRates, type StateCode } from "@/lib/rates";
import { calculatePaycheck } from "./calculate";
import type { PaycheckInput } from "./types";

const calc = (code: StateCode, input: PaycheckInput) =>
  calculatePaycheck(input, { federal: federalRates, state: getStateRates(code) });
const state = (code: StateCode, input: PaycheckInput) => calc(code, input).lines.state.perPeriod;

/** Official worked examples are labelled; the rest are hand-computed from each state's published formula. */
describe("California (EDD Method B, 2026)", () => {
  it("official example F: $4,750 monthly, married, 4 allowances = $7.17", () => {
    expect(
      state("CA", {
        grossPerPeriod: 4750,
        frequency: "monthly",
        filingStatus: "married",
        stateAllowances: 4,
      }),
    ).toBe(717);
  });
  it("official example E: $2,400 semi-monthly, married, 4 allowances = $4.13", () => {
    expect(
      state("CA", {
        grossPerPeriod: 2400,
        frequency: "semimonthly",
        filingStatus: "married",
        stateAllowances: 4,
      }),
    ).toBe(413);
  });
  it("official example A: $210 weekly, single, 1 allowance is under the low-income exemption = $0", () => {
    expect(
      state("CA", { grossPerPeriod: 210, frequency: "weekly", filingStatus: "single", stateAllowances: 1 }),
    ).toBe(0);
  });
  it("married with fewer than 2 allowances uses the smaller $5,706 deduction", () => {
    // 52,000 - 5,706 = 46,294: 243.74 + 2.2% * (46,294 - 22,158) = 530.99 -> 774.73 / 26 = 29.80
    expect(state("CA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "married" })).toBe(2980);
  });
  it("head of household uses the $11,412 deduction", () => {
    // 52,000 - 11,412 = 40,588: 243.90 + 4.4% * (40,588 - 22,173)... bracket 22,173-52,530 is 2.2%: 243.90 + 2.2% * (40,588-22,173) wait: base 0..22,173 at 1.1% = 243.90, then 2.2% of excess
    const r = calc("CA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "head" });
    expect(r.lines.state.perPeriod).toBe(Math.round(((243.903 + (40588 - 22173) * 0.022) * 100) / 26));
  });
  it("SDI: 1.3% of all wages, no cap", () => {
    expect(
      calc("CA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.statePrograms
        .perPeriod,
    ).toBe(2600);
    // 600,000 a year: SDI is 7,800, not capped.
    expect(
      calc("CA", { grossPerPeriod: 50000, frequency: "monthly", filingStatus: "single" }).lines.statePrograms
        .annual,
    ).toBe(780000);
  });
});

describe("Michigan (Form 446)", () => {
  it("4.25% with no exemptions", () => {
    // 52,000 * 4.25% = 2,210 / 26 = 85.00
    expect(state("MI", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" })).toBe(8500);
  });
  it("each exemption is $5,900", () => {
    // (52,000 - 11,800) * 4.25% = 1,708.50 / 26 = 65.71
    expect(
      state("MI", {
        grossPerPeriod: 2000,
        frequency: "biweekly",
        filingStatus: "single",
        stateAllowances: 2,
      }),
    ).toBe(6571);
  });
});

describe("Colorado (DR 1098)", () => {
  it("single: $5,500 deducted, 4.4%", () => {
    // (52,000 - 5,500) * 4.4% = 2,046 / 26 = 78.69
    expect(state("CO", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" })).toBe(7869);
  });
  it("married: $11,000 deducted", () => {
    // (52,000 - 11,000) * 4.4% = 1,804 / 26 = 69.38
    expect(state("CO", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "married" })).toBe(6938);
  });
  it("FAMLI: 0.44% employee share, capped at the wage base", () => {
    expect(
      calc("CO", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.statePrograms
        .perPeriod,
    ).toBe(880);
    // 20,000 a month = 240,000: capped at 184,500 * 0.44% = 811.80 a year
    expect(
      calc("CO", { grossPerPeriod: 20000, frequency: "monthly", filingStatus: "single" }).lines.statePrograms
        .annual,
    ).toBe(Math.round(81180 / 12) * 12);
  });
});

describe("Maryland (Employer Withholding Guide)", () => {
  it("state tax: $3,400 standard deduction and $3,200 per exemption, 4.75%", () => {
    // 52,000 - 3,400 - 3,200 = 45,400 * 4.75% = 2,156.50 / 26 = 82.94
    expect(
      state("MD", {
        grossPerPeriod: 2000,
        frequency: "biweekly",
        filingStatus: "single",
        stateAllowances: 1,
      }),
    ).toBe(8294);
  });
  it("county rate applies to the same taxable income", () => {
    // 45,400 / 26 = 1,746.15 * 2.25% = 39.29
    const r = calc("MD", {
      grossPerPeriod: 2000,
      frequency: "biweekly",
      filingStatus: "single",
      stateAllowances: 1,
      localRatePercent: 2.25,
    });
    expect(r.lines.local.perPeriod).toBe(3929);
  });
  it("combined state and county matches the guide's 2.25% table at the bottom bracket", () => {
    // The printed table is 7.00% (= 4.75% + 2.25%) on taxable income up to $100,000 for single filers.
    const r = calc("MD", {
      grossPerPeriod: 2000,
      frequency: "biweekly",
      filingStatus: "single",
      localRatePercent: 2.25,
    });
    const taxable = 52000 - 3400;
    expect(r.lines.state.annual + r.lines.local.annual).toBeGreaterThan(taxable * 0.0699 * 100);
    expect(r.lines.state.annual + r.lines.local.annual).toBeLessThan(taxable * 0.0701 * 100 + 26);
  });
  it("no withholding under the $5,000 annual floor", () => {
    expect(state("MD", { grossPerPeriod: 90, frequency: "weekly", filingStatus: "single" })).toBe(0);
  });
  it("married and head of household share the wider $150,000 first bracket", () => {
    const m = state("MD", { grossPerPeriod: 8000, frequency: "monthly", filingStatus: "married" });
    const h = state("MD", { grossPerPeriod: 8000, frequency: "monthly", filingStatus: "head" });
    expect(m).toBe(h);
  });
});

describe("Iowa (2026 withholding formula)", () => {
  it("official example 1: $2,100 biweekly, other, $40 allowance = $59.26", () => {
    expect(
      state("IA", {
        grossPerPeriod: 2100,
        frequency: "biweekly",
        filingStatus: "single",
        stateAllowances: 1,
      }),
    ).toBe(5926);
  });
  it("official example 2: married filing jointly, $80 allowance = $38.72", () => {
    expect(
      state("IA", {
        grossPerPeriod: 2100,
        frequency: "biweekly",
        filingStatus: "married",
        stateAllowances: 2,
      }),
    ).toBe(3872);
  });
  it("official example 3: head of household, $160 allowance = $45.15", () => {
    expect(
      state("IA", { grossPerPeriod: 2100, frequency: "biweekly", filingStatus: "head", stateAllowances: 4 }),
    ).toBe(4515);
  });
});

describe("Arkansas (Withholding Tax Formula Method)", () => {
  it("official example: $2,127 monthly, 2 exemptions = $36.50", () => {
    expect(
      state("AR", { grossPerPeriod: 2127, frequency: "monthly", filingStatus: "single", stateAllowances: 2 }),
    ).toBe(3650);
  });
  it("pay under the standard deduction owes nothing", () => {
    expect(state("AR", { grossPerPeriod: 200, frequency: "monthly", filingStatus: "single" })).toBe(0);
  });
  it("top bracket tracks the table's 'rate x income - adjustment' form above $97,600", () => {
    // Table: 3.7% x income - $79.90 for income of $97,601 and over. Income here = 150,000 - 2,470.
    const r = calc("AR", { grossPerPeriod: 12500, frequency: "monthly", filingStatus: "single" });
    const tableTax = 0.037 * (150000 - 2470) - 79.9;
    expect(Math.abs(r.lines.state.annual / 100 - tableTax)).toBeLessThan(5);
  });
});

describe("Kentucky (42A003)", () => {
  it("official example: $3,270 monthly = $104.65", () => {
    expect(state("KY", { grossPerPeriod: 3270, frequency: "monthly", filingStatus: "single" })).toBe(10465);
  });
});

describe("Missouri (2026 formula)", () => {
  it("single, $35,000 a year: annual tax from the rate table, rounded to the dollar", () => {
    // taxable 18,900: 26.96 + 33.70 + 40.44 + 47.18 + 53.92 + 60.66 + 4.7% * 9,464 (444.81) = 707.67 / 12 = 58.97 -> $59
    expect(state("MO", { grossPerPeriod: 2916.67, frequency: "monthly", filingStatus: "single" })).toBe(5900);
  });
  it("married uses the $32,200 deduction", () => {
    const r = state("MO", { grossPerPeriod: 2916.67, frequency: "monthly", filingStatus: "married" });
    expect(r).toBeLessThan(5900);
  });
});

describe("Maine (2026 percentage method)", () => {
  it("official example 1: $300 weekly, single, 2 allowances = $0", () => {
    expect(
      state("ME", { grossPerPeriod: 300, frequency: "weekly", filingStatus: "single", stateAllowances: 2 }),
    ).toBe(0);
  });
  it("official example 2: $1,000 weekly, single, 2 allowances = $32", () => {
    expect(
      state("ME", { grossPerPeriod: 1000, frequency: "weekly", filingStatus: "single", stateAllowances: 2 }),
    ).toBe(3200);
  });
  it("official example 3: $4,500 weekly, married, 2 allowances = $256 (deduction phase-out)", () => {
    expect(
      state("ME", { grossPerPeriod: 4500, frequency: "weekly", filingStatus: "married", stateAllowances: 2 }),
    ).toBe(25600);
  });
  it("the standard deduction is zero at the top of the phase-out", () => {
    // 200,000 single: deduction 0. Taxable 200,000; 4,117 + 7.15% * (200,000 - 64,850) = 13,780 / 26 -> $530
    expect(state("ME", { grossPerPeriod: 200000 / 26, frequency: "biweekly", filingStatus: "single" })).toBe(
      Math.round((1589.2 + 37450 * 0.0675 + (200000 - 64850) * 0.0715) / 26) * 100,
    );
  });
});

describe("Massachusetts (Circular M, 5.0%)", () => {
  it("official table: weekly $300-$310 withholds $14.08 with 0 exemptions", () => {
    expect(state("MA", { grossPerPeriod: 305, frequency: "weekly", filingStatus: "single" })).toBe(1408);
  });
  it("official table: weekly $300-$310 withholds $9.85 with 1 exemption", () => {
    expect(
      state("MA", { grossPerPeriod: 305, frequency: "weekly", filingStatus: "single", stateAllowances: 1 }),
    ).toBe(985);
  });
  it("head of household takes $120 a year off", () => {
    const single = calc("MA", {
      grossPerPeriod: 1000,
      frequency: "weekly",
      filingStatus: "single",
      stateAllowances: 1,
    }).lines.state.annual;
    const head = calc("MA", {
      grossPerPeriod: 1000,
      frequency: "weekly",
      filingStatus: "head",
      stateAllowances: 1,
    }).lines.state.annual;
    // $120 a year is $2.31 a week after rounding each paycheck to the cent, so annual figures differ by pennies.
    expect(Math.abs(single - head - 12000)).toBeLessThan(25);
  });
  it("employees claiming an exemption with wages under $8,000 a year owe nothing", () => {
    expect(
      state("MA", { grossPerPeriod: 150, frequency: "weekly", filingStatus: "single", stateAllowances: 1 }),
    ).toBe(0);
  });
  it("the FICA deduction stops at $2,000 a year", () => {
    // 100,000 a year: FICA 7,650 exceeds the cap. (100,000 - 2,000 - 4,400) * 5% = 4,680 / 52 = 90.00
    expect(
      state("MA", {
        grossPerPeriod: 100000 / 52,
        frequency: "weekly",
        filingStatus: "single",
        stateAllowances: 1,
      }),
    ).toBe(9000);
  });
  it("PFML: up to 0.46% from the employee", () => {
    expect(
      calc("MA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.statePrograms
        .perPeriod,
    ).toBe(Math.round((52000 * 0.0046 * 100) / 26));
  });
});

describe("Minnesota (2026 computer formula)", () => {
  it("single, $2,000 biweekly, 0 allowances", () => {
    // (38,010 - 4,700) * 5.35% = 1,782.085; (52,000 - 38,010) * 6.8% = 951.32; total 2,733.405 / 26 = 105.13
    expect(state("MN", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" })).toBe(10513);
  });
  it("allowances are $5,300 each and income under the first band owes nothing", () => {
    expect(state("MN", { grossPerPeriod: 80, frequency: "weekly", filingStatus: "single" })).toBe(0);
  });
  it("Paid Leave: 0.44% employee share", () => {
    expect(
      calc("MN", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.statePrograms
        .perPeriod,
    ).toBe(880);
  });
});

describe("Arizona (Form A-4 default)", () => {
  it("2.0% of gross taxable wages", () => {
    expect(state("AZ", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" })).toBe(4000);
  });
});

describe("Pennsylvania (3.07% flat)", () => {
  it("3.07% of compensation, no deductions", () => {
    // 52,000 * 3.07% = 1,596.40 / 26 = 61.40
    expect(state("PA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" })).toBe(6140);
  });
  it("401(k) deferrals do not reduce Pennsylvania withholding", () => {
    const withK = state("PA", {
      grossPerPeriod: 2000,
      frequency: "biweekly",
      filingStatus: "single",
      preTax401k: 100,
    });
    expect(withK).toBe(6140);
  });
  it("Section 125 health premiums do reduce it", () => {
    // (2,000 - 100) * 26 = 49,400 * 3.07% = 1,516.58 / 26 = 58.33
    expect(
      state("PA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single", preTaxHealth: 100 }),
    ).toBe(5833);
  });
  it("a local earned income tax also counts the 401(k) deferral", () => {
    const r = calc("PA", {
      grossPerPeriod: 2000,
      frequency: "biweekly",
      filingStatus: "single",
      preTax401k: 100,
      localRatePercent: 1,
    });
    expect(r.lines.local.perPeriod).toBe(2000);
  });
  it("employee unemployment contribution is 0.07% of all wages", () => {
    // 52,000 * 0.07% = 36.40 / 26 = 1.40
    expect(
      calc("PA", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.statePrograms
        .perPeriod,
    ).toBe(140);
  });
});

describe("Alaska, New Hampshire, South Dakota and Wyoming have no wage tax", () => {
  it.each(["AK", "NH", "SD", "WY"] as const)("%s withholds no state income tax", (code) => {
    expect(state(code, { grossPerPeriod: 5000, frequency: "biweekly", filingStatus: "single" })).toBe(0);
  });
  it("Alaska employees pay 0.5% unemployment up to the $54,200 base", () => {
    expect(
      calc("AK", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.statePrograms
        .perPeriod,
    ).toBe(1000);
    // High earner: capped at 0.5% x 54,200 = 271.00 a year (10.42 per biweekly paycheck, rounded)
    const r = calc("AK", { grossPerPeriod: 10000, frequency: "biweekly", filingStatus: "single" });
    expect(Math.abs(r.lines.statePrograms.annual - 27100)).toBeLessThan(26);
  });
  it.each(["NH", "SD", "WY"] as const)("%s has no employee payroll programs", (code) => {
    expect(
      calc(code, { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines.statePrograms
        .perPeriod,
    ).toBe(0);
  });
});

describe("Virginia (July 2025+ formula)", () => {
  it("official example: $2,649 semi-monthly, 5 exemptions = $109.50", () => {
    // The state's example rounds an intermediate figure to whole dollars ($1,907.62 -> $1,908), so it differs by 2 cents.
    const cents = state("VA", {
      grossPerPeriod: 2649,
      frequency: "semimonthly",
      filingStatus: "single",
      stateAllowances: 5,
    });
    expect(Math.abs(cents - 10950)).toBeLessThanOrEqual(2);
  });
  it("income under the deduction owes nothing", () => {
    expect(state("VA", { grossPerPeriod: 600, frequency: "monthly", filingStatus: "single" })).toBe(0);
  });
});

describe("Oklahoma (2026 packet OW-2)", () => {
  it("official example: $1,825 semi-monthly, married, 2 allowances = $37", () => {
    expect(
      state("OK", {
        grossPerPeriod: 1825,
        frequency: "semimonthly",
        filingStatus: "married",
        stateAllowances: 2,
      }),
    ).toBe(3700);
  });
  it("rounds half up to the whole dollar", () => {
    // single, $2,000 biweekly, 0 allowances: 52,000 -> 109.25 + 4.5% * (52,000 - 13,550) = 1,839.5 / 26 = 70.75 -> $71
    expect(state("OK", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" })).toBe(7100);
  });
});

describe("Wisconsin (W-166 alternate method)", () => {
  it("official example 1: $350 weekly, single, 1 exemption = $7.59", () => {
    expect(
      state("WI", { grossPerPeriod: 350, frequency: "weekly", filingStatus: "single", stateAllowances: 1 }),
    ).toBe(759);
  });
  it("official example 2: $500 weekly, single, 3 exemptions = $14.34", () => {
    expect(
      state("WI", { grossPerPeriod: 500, frequency: "weekly", filingStatus: "single", stateAllowances: 3 }),
    ).toBe(1434);
  });
  it("official example 3: $1,000 biweekly, married, 3 exemptions = $22.08", () => {
    expect(
      state("WI", {
        grossPerPeriod: 1000,
        frequency: "biweekly",
        filingStatus: "married",
        stateAllowances: 3,
      }),
    ).toBe(2208);
  });
});

describe("Nebraska (Circular EN 2026 percentage method)", () => {
  it("weekly $400, single: the printed weekly table gives $10.15", () => {
    // 1.42 + 3.22% x (400 - 129) = 10.15
    expect(state("NE", { grossPerPeriod: 400, frequency: "weekly", filingStatus: "single" })).toBe(1015);
  });
  it("weekly $400, married: within 2 cents of the printed table ($6.91)", () => {
    expect(
      Math.abs(state("NE", { grossPerPeriod: 400, frequency: "weekly", filingStatus: "married" }) - 691),
    ).toBeLessThanOrEqual(2);
  });
  it("each allowance takes about $2,440 off the wages", () => {
    // weekly 400 - 2 x 46.92 = 306.16 -> 1.42 + 3.22% x (306.16 - 129) = 7.12
    expect(
      Math.abs(
        state("NE", {
          grossPerPeriod: 400,
          frequency: "weekly",
          filingStatus: "single",
          stateAllowances: 2,
        }) - 712,
      ),
    ).toBeLessThanOrEqual(2);
  });
  it("head of household uses the single table", () => {
    expect(state("NE", { grossPerPeriod: 400, frequency: "weekly", filingStatus: "head" })).toBe(
      state("NE", { grossPerPeriod: 400, frequency: "weekly", filingStatus: "single" }),
    );
  });
});

describe("North Dakota (2026 booklet, Forms W-4 for 2020 and after)", () => {
  it("nothing is withheld below the annual zero band", () => {
    expect(state("ND", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" })).toBe(0);
  });
  it("single, $1,800 weekly: annual $701.51 from the 2026 table, $13 a week", () => {
    expect(state("ND", { grossPerPeriod: 1800, frequency: "weekly", filingStatus: "single" })).toBe(1300);
  });
  it("head of household has its own, higher zero band", () => {
    // 100,000 head: (100,000 - 78,475) x 1.95% = 419.74 / 26 = 16.14 -> $16
    expect(state("ND", { grossPerPeriod: 100000 / 26, frequency: "biweekly", filingStatus: "head" })).toBe(
      1600,
    );
  });
});

describe("New York (NYS-50-T-NYS 1/26, annual Method II)", () => {
  it("official example 1: weekly $400, single, 3 exemptions = $8.01 (period tables round their breakpoints)", () => {
    expect(
      Math.abs(
        state("NY", {
          grossPerPeriod: 400,
          frequency: "weekly",
          filingStatus: "single",
          stateAllowances: 3,
        }) - 801,
      ),
    ).toBeLessThanOrEqual(5);
  });
  it("official example 3: monthly $50,000, single, 3 exemptions = $3,576.63 (the schedule's printed constants are rounded)", () => {
    // The schedule's "add" amounts are whole dollars, so cumulative marginal rates differ by about $4.29 a year (36 cents a month).
    expect(
      Math.abs(
        state("NY", {
          grossPerPeriod: 50000,
          frequency: "monthly",
          filingStatus: "single",
          stateAllowances: 3,
        }) - 357663,
      ),
    ).toBeLessThanOrEqual(40);
  });
  it("married uses the larger $7,950 allowance", () => {
    const single = calc("NY", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines
      .state.annual;
    const married = calc("NY", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "married" }).lines
      .state.annual;
    expect(married).toBeLessThan(single);
  });
  it("SDI is capped at $31.20 a year and PFL at $411.91", () => {
    const low = calc("NY", { grossPerPeriod: 2000, frequency: "biweekly", filingStatus: "single" }).lines
      .statePrograms;
    // SDI 31.20 / 26 = 1.20; PFL 52,000 x 0.432% = 224.64 / 26 = 8.64
    expect(low.perPeriod).toBe(984);
    const high = calc("NY", { grossPerPeriod: 20000, frequency: "monthly", filingStatus: "single" }).lines
      .statePrograms;
    expect(Math.abs(high.annual - Math.round((3120 + 41191) / 12) * 12)).toBeLessThan(12);
  });
});
