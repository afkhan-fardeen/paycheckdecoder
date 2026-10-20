import type { StateRates } from "@/lib/rates-schema";
import { taxFromBrackets } from "./brackets";
import type { FilingStatus } from "./types";

export interface StateTaxInput {
  /** Annualized income-tax wages in dollars. */
  wages: number;
  filingStatus: FilingStatus;
  /** Allowances, exemptions or dependents claimed on the state form. */
  allowances: number;
  /** Annual FICA withheld in dollars, for states that deduct it (Massachusetts). */
  annualFica: number;
  /** Annual traditional 401(k) deferrals in dollars, for states that tax them (Pennsylvania). */
  annualRetirement: number;
}

export interface StateTaxResult {
  /** Annual withholding in dollars, unrounded unless the state rounds. */
  tax: number;
  /** The amount the tax was computed on, after deductions. County taxes can apply to this. */
  taxable: number;
}

type Rules = Extract<StateRates, { method: "flat" | "brackets" }>["parameters"];

/** Standard deduction and low-income threshold for a filing status, honouring allowance tiers and any phase-out. */
function deductionFor(p: Rules, input: StateTaxInput): { standard: number; lowIncome: number } {
  const { filingStatus: status, allowances, wages } = input;
  let standard = p.standardDeduction[status];
  let lowIncome = p.lowIncomeExemption[status];
  // The most demanding tier the visitor qualifies for wins (California: married with 2+ allowances).
  const tier = p.allowanceTiers
    .filter((t) => t.status === status && allowances >= t.minAllowances)
    .sort((a, b) => b.minAllowances - a.minAllowances)[0];
  if (tier) {
    standard = tier.standardDeduction;
    lowIncome = tier.lowIncomeExemption ?? lowIncome;
  }
  const phase = p.deductionPhaseOut?.[status];
  if (phase) {
    if (wages >= phase.to) standard = 0;
    else if (wages > phase.from) standard = standard * ((phase.to - wages) / (phase.to - phase.from));
  }
  return { standard, lowIncome };
}

/**
 * Annual state income tax withholding, by the method in the state's rate file.
 * Pure: depends only on its arguments.
 */
export function stateTax(rates: StateRates, input: StateTaxInput): StateTaxResult {
  const { filingStatus, allowances } = input;
  const addBack =
    (rates.method === "flat" || rates.method === "brackets") && rates.parameters.taxRetirementContributions
      ? input.annualRetirement
      : 0;
  const wages = input.wages + addBack;
  switch (rates.method) {
    case "none":
      return { tax: 0, taxable: 0 };
    case "flat":
    case "brackets": {
      const p = rates.parameters;
      const { standard, lowIncome } = deductionFor(p, { ...input, wages });
      if (allowances >= p.lowIncomeMinAllowances && lowIncome > 0 && wages <= lowIncome) {
        return { tax: 0, taxable: 0 };
      }
      const allowanceDeduction = allowances > 0 ? p.allowanceBase + allowances * p.allowanceAmount : 0;
      const ficaDeduction = p.ficaDeductionCap === null ? 0 : Math.min(input.annualFica, p.ficaDeductionCap);
      const taxable = Math.max(0, wages - standard - allowanceDeduction - ficaDeduction);
      const gross =
        rates.method === "flat"
          ? taxable * rates.parameters.rate
          : taxFromBrackets(taxable, rates.parameters.brackets[filingStatus]);
      const credits = allowances * p.allowanceCredit + p.statusCredit[filingStatus];
      const tax = Math.max(0, (p.roundAnnualTax ? Math.round(gross) : gross) - credits);
      return { tax, taxable };
    }
    case "tiered": {
      const p = rates.parameters;
      const taxable = Math.max(0, wages - allowances * p.allowanceAmount);
      let floor = 0;
      for (const tier of p.tiers) {
        if (tier.upTo === null || taxable <= tier.upTo) {
          return { tax: tier.base + (taxable - floor) * tier.rate, taxable };
        }
        floor = tier.upTo;
      }
      return { tax: 0, taxable };
    }
  }
}

/** Whether a method rounds each paycheck's withholding to the whole dollar. */
function roundsPerPaycheck(rates: StateRates): boolean {
  return (rates.method === "flat" || rates.method === "brackets") && rates.parameters.roundToDollar;
}

/** Per-paycheck withholding in whole cents, honouring a state's whole-dollar rounding rule. */
export function stateTaxPerPeriodCents(rates: StateRates, annualTax: number, periods: number): number {
  if (roundsPerPaycheck(rates)) return Math.round(annualTax / periods) * 100;
  return Math.round((annualTax * 100) / periods);
}

/** Annual employee-paid premiums for state programs (for example Washington PFML), in dollars. */
export function stateProgramsAnnual(rates: StateRates, annualGrossWages: number): number {
  let total = 0;
  for (const program of rates.programs) {
    const base = program.wageCap === null ? annualGrossWages : Math.min(annualGrossWages, program.wageCap);
    total += base * program.rate * program.employeeShare;
  }
  return total;
}
