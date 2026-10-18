import type { StateRates } from "@/lib/rates-schema";
import type { FilingStatus } from "./types";

/**
 * Annual state income tax withholding in dollars (unrounded), for the method in `rates`.
 * `wages` are annualized income-tax wages; `allowances` is the count on the state's form.
 */
export function stateIncomeTaxAnnual(
  rates: StateRates,
  wages: number,
  filingStatus: FilingStatus,
  allowances: number,
): number {
  switch (rates.method) {
    case "none":
      return 0;
    case "flat": {
      const p = rates.parameters;
      const taxable = Math.max(0, wages - p.standardDeduction[filingStatus] - allowances * p.allowanceAmount);
      return taxable * p.rate;
    }
    case "tiered": {
      const p = rates.parameters;
      const taxable = Math.max(0, wages - allowances * p.allowanceAmount);
      let floor = 0;
      for (const tier of p.tiers) {
        if (tier.upTo === null || taxable <= tier.upTo) return tier.base + (taxable - floor) * tier.rate;
        floor = tier.upTo;
      }
      return 0;
    }
  }
}

/** Per-paycheck withholding in whole cents, honouring a state's whole-dollar rounding rule. */
export function stateIncomeTaxPerPeriodCents(rates: StateRates, annualTax: number, periods: number): number {
  if (rates.method === "flat" && rates.parameters.roundToDollar) {
    return Math.round(annualTax / periods) * 100;
  }
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
