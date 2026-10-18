import type { FederalRates } from "@/lib/rates-schema";
import { toCents } from "./money";
import { stateIncomeTaxAnnual, stateIncomeTaxPerPeriodCents, stateProgramsAnnual } from "./state";
import {
  PERIODS_PER_YEAR,
  type Amount,
  type FilingStatus,
  type LineKey,
  type PaycheckInput,
  type PaycheckResult,
  type RateSet,
  type ValidationIssue,
} from "./types";

const MAX_GROSS_PER_PERIOD = 10_000_000;

/** Tax on annual taxable income from a bracket table, in dollars (unrounded). */
export function taxFromBrackets(
  taxable: number,
  table: FederalRates["parameters"]["brackets"][FilingStatus],
): number {
  let tax = 0;
  let floor = 0;
  for (const { upTo, rate } of table) {
    const ceiling = upTo ?? Infinity;
    if (taxable <= floor) break;
    tax += (Math.min(taxable, ceiling) - floor) * rate;
    floor = ceiling;
  }
  return tax;
}

function nonNegative(value: number | undefined): boolean {
  return value === undefined || (Number.isFinite(value) && value >= 0);
}

/** Returns an empty list when the input can be calculated. Messages are shown after "Error:". */
export function validateInput(input: PaycheckInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!Number.isFinite(input.grossPerPeriod) || input.grossPerPeriod < 0) {
    issues.push({ field: "grossPerPeriod", message: "enter a pay amount of $0 or more." });
  } else if (input.grossPerPeriod > MAX_GROSS_PER_PERIOD) {
    issues.push({ field: "grossPerPeriod", message: "enter a pay amount under $10,000,000." });
  }
  for (const [field, label] of [
    ["preTax401k", "401(k)"],
    ["preTaxHealth", "health insurance"],
    ["postTax", "after-tax deductions"],
  ] as const) {
    if (!nonNegative(input[field])) {
      issues.push({ field, message: `enter ${label} of $0 or more.` });
    }
  }
  const allowances = input.stateAllowances;
  if (allowances !== undefined && (!Number.isInteger(allowances) || allowances < 0 || allowances > 99)) {
    issues.push({ field: "stateAllowances", message: "enter a whole number of allowances from 0 to 99." });
  }
  const rate = input.localRatePercent;
  if (rate !== undefined && (!Number.isFinite(rate) || rate < 0 || rate > 15)) {
    issues.push({ field: "localRatePercent", message: "enter a local tax rate between 0 and 15." });
  }
  const w4 = input.w4;
  if (
    w4 &&
    !(
      nonNegative(w4.creditsPerYear) &&
      nonNegative(w4.otherIncomePerYear) &&
      nonNegative(w4.deductionsPerYear) &&
      nonNegative(w4.extraWithholdingPerPeriod)
    )
  ) {
    issues.push({ field: "w4", message: "enter W-4 amounts of $0 or more." });
  }
  if (issues.length === 0) {
    const pre = (input.preTax401k ?? 0) + (input.preTaxHealth ?? 0);
    if (pre > input.grossPerPeriod) {
      issues.push({
        field: "preTax401k",
        message: "pre-tax deductions cannot be more than gross pay.",
      });
    }
  }
  return issues;
}

/**
 * Estimates one paycheck. Pure: the same input and rate files always give the same result.
 *
 * Method: annualize the paycheck, apply the 2026 standard deduction and brackets
 * (equivalent to the Pub 15-T percentage method for a post-2020 W-4 with step 2 unchecked),
 * then divide by pay periods. Every line is rounded to the cent per paycheck and annual
 * figures are `perPeriod * periods`, so the columns always add up.
 *
 * State income tax follows the method in the state's rate file (none, flat or tiered) and
 * employee-paid state programs (Washington PFML and WA Cares) are applied to gross wages.
 *
 * Not modelled: W-4 step 2 (multiple jobs) checkbox, supplemental wage rates,
 * mid-year wage-base cut-offs, program exemptions.
 */
export function calculatePaycheck(input: PaycheckInput, rates: RateSet): PaycheckResult {
  const issues = validateInput(input);
  if (issues.length > 0) {
    throw new RangeError(`Invalid paycheck input: ${issues.map((i) => i.message).join(" ")}`);
  }
  const { federal } = rates;
  const fp = federal.parameters;
  const periods = PERIODS_PER_YEAR[input.frequency];

  const gross = toCents(input.grossPerPeriod);
  const k401 = toCents(input.preTax401k ?? 0);
  const health = toCents(input.preTaxHealth ?? 0);
  const postTax = toCents(input.postTax ?? 0);

  const incomeWages = gross - k401 - health; // cents, per paycheck
  const ficaWages = gross - health;

  const annualIncomeWages = (incomeWages / 100) * periods; // dollars
  const annualFicaWages = (ficaWages / 100) * periods;

  const w4 = input.w4 ?? {};
  const taxable = Math.max(
    0,
    annualIncomeWages +
      (w4.otherIncomePerYear ?? 0) -
      (w4.deductionsPerYear ?? 0) -
      fp.standardDeduction[input.filingStatus],
  );
  const annualFederal = Math.max(
    0,
    taxFromBrackets(taxable, fp.brackets[input.filingStatus]) - (w4.creditsPerYear ?? 0),
  );
  const perPeriodCents = (annualDollars: number) => Math.round((annualDollars * 100) / periods);

  const federalTax = perPeriodCents(annualFederal) + toCents(w4.extraWithholdingPerPeriod ?? 0);
  const socialSecurity = perPeriodCents(
    Math.min(annualFicaWages, fp.socialSecurity.wageBase) * fp.socialSecurity.rate,
  );
  const medicare = perPeriodCents(annualFicaWages * fp.medicare.rate);
  const additionalMedicare = perPeriodCents(
    Math.max(0, annualFicaWages - fp.medicare.additionalThreshold) * fp.medicare.additionalRate,
  );
  const stateTax = stateIncomeTaxPerPeriodCents(
    rates.state,
    stateIncomeTaxAnnual(rates.state, annualIncomeWages, input.filingStatus, input.stateAllowances ?? 0),
    periods,
  );
  const statePrograms = perPeriodCents(stateProgramsAnnual(rates.state, (gross / 100) * periods));
  const local = Math.round((incomeWages * (input.localRatePercent ?? 0)) / 100);

  const taxes =
    federalTax + socialSecurity + medicare + additionalMedicare + stateTax + statePrograms + local;
  const net = gross - k401 - health - taxes - postTax;
  if (net < 0) {
    throw new RangeError("Invalid paycheck input: deductions and taxes are more than gross pay.");
  }

  const amount = (perPeriod: number): Amount => ({ perPeriod, annual: perPeriod * periods });
  const lines: Record<LineKey, Amount> = {
    gross: amount(gross),
    preTax401k: amount(k401),
    preTaxHealth: amount(health),
    federal: amount(federalTax),
    socialSecurity: amount(socialSecurity),
    medicare: amount(medicare),
    additionalMedicare: amount(additionalMedicare),
    state: amount(stateTax),
    statePrograms: amount(statePrograms),
    local: amount(local),
    postTax: amount(postTax),
    net: amount(net),
  };

  return {
    periods,
    lines,
    totalTaxes: amount(taxes),
    totalDeductions: amount(k401 + health + postTax),
    takeHomeRate: gross === 0 ? 0 : net / gross,
    effectiveTaxRate: gross === 0 ? 0 : taxes / gross,
  };
}
