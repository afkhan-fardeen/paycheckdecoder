import { toCents } from "./money";
import { PERIODS_PER_YEAR, type PayFrequency } from "./types";

export interface HourlyInput {
  wage: number;
  hoursPerWeek: number;
  weeksPerYear: number;
}

export interface HourlyConversion {
  /** Whole cents. */
  yearly: number;
  monthly: number;
  biweekly: number;
  weekly: number;
  /** Eight-hour day. */
  daily: number;
}

export function validateHourly({ wage, hoursPerWeek, weeksPerYear }: HourlyInput): string[] {
  const issues: string[] = [];
  if (!Number.isFinite(wage) || wage < 0 || wage > 100_000)
    issues.push("enter a wage between $0 and $100,000.");
  if (!Number.isFinite(hoursPerWeek) || hoursPerWeek < 0 || hoursPerWeek > 168) {
    issues.push("enter hours between 0 and 168.");
  }
  if (!Number.isFinite(weeksPerYear) || weeksPerYear < 0 || weeksPerYear > 52) {
    issues.push("enter weeks between 0 and 52.");
  }
  return issues;
}

/** Gross pay from an hourly wage. All results in whole cents. */
export function convertHourly(input: HourlyInput): HourlyConversion {
  const issues = validateHourly(input);
  if (issues.length > 0) throw new RangeError(`Invalid hourly input: ${issues.join(" ")}`);
  const { wage, hoursPerWeek, weeksPerYear } = input;
  const yearly = toCents(wage * hoursPerWeek * weeksPerYear);
  return {
    yearly,
    monthly: Math.round(yearly / 12),
    biweekly: Math.round(yearly / 26),
    weekly: toCents(wage * hoursPerWeek),
    daily: toCents(wage * 8),
  };
}

/** Gross pay per paycheck for an hourly worker, in dollars, for the paycheck calculator. */
export function grossPerPeriodFromHourly(input: HourlyInput, frequency: PayFrequency): number {
  const { yearly } = convertHourly(input);
  return Math.round(yearly / PERIODS_PER_YEAR[frequency]) / 100;
}

/** Gross pay per paycheck for a salaried worker, in dollars. */
export function grossPerPeriodFromSalary(annualSalary: number, frequency: PayFrequency): number {
  return Math.round((annualSalary * 100) / PERIODS_PER_YEAR[frequency]) / 100;
}
