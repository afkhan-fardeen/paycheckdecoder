import type { FederalRates, StateRates } from "@/lib/rates-schema";

export type FilingStatus = "single" | "married" | "head";
export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";

export const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

/** Optional Form W-4 (2020 and later) fields. All amounts are in dollars. */
export interface W4Inputs {
  /** Step 3: credit for dependents and other credits, per year. */
  creditsPerYear?: number;
  /** Step 4(a): other income, per year. */
  otherIncomePerYear?: number;
  /** Step 4(b): deductions beyond the standard deduction, per year. */
  deductionsPerYear?: number;
  /** Step 4(c): extra withholding, per paycheck. */
  extraWithholdingPerPeriod?: number;
}

/** Everything the engine needs for one estimate. Dollar amounts are per paycheck. */
export interface PaycheckInput {
  grossPerPeriod: number;
  frequency: PayFrequency;
  filingStatus: FilingStatus;
  /** Traditional 401(k): reduces income-tax wages but not FICA wages. */
  preTax401k?: number;
  /** Section 125 health premiums and payroll HSA: reduce income-tax and FICA wages. */
  preTaxHealth?: number;
  /** Deductions taken after tax (Roth 401(k), union dues, garnishments). */
  postTax?: number;
  /**
   * Allowances, exemptions or dependents claimed on the state's withholding form
   * (IL-W-4 line 1, NC-4, Ohio IT 4, Georgia G-4). Whole number, default 0.
   */
  stateAllowances?: number;
  /** Optional local income tax rate as a percent, entered by the visitor. */
  localRatePercent?: number;
  w4?: W4Inputs;
}

export interface RateSet {
  federal: FederalRates;
  state: StateRates;
}

export type LineKey =
  | "gross"
  | "preTax401k"
  | "preTaxHealth"
  | "federal"
  | "socialSecurity"
  | "medicare"
  | "additionalMedicare"
  | "state"
  | "statePrograms"
  | "local"
  | "postTax"
  | "net";

/** Money in whole cents. `annual` is always `perPeriod * periods`, so columns add up. */
export interface Amount {
  perPeriod: number;
  annual: number;
}

export interface PaycheckResult {
  periods: number;
  lines: Record<LineKey, Amount>;
  totalTaxes: Amount;
  totalDeductions: Amount;
  /** net / gross, 0 to 1. */
  takeHomeRate: number;
  /** total taxes / gross, 0 to 1. */
  effectiveTaxRate: number;
}

export interface ValidationIssue {
  field: keyof PaycheckInput | "w4";
  message: string;
}
