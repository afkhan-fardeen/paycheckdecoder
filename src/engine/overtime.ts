import { toCents } from "./money";

export interface OvertimeInput {
  wage: number;
  totalHours: number;
  /** Hours per week before overtime applies. The federal FLSA threshold is 40. */
  threshold?: number;
  /** 1.5 for time and a half, 2 for double time. */
  multiplier?: number;
}

export interface OvertimeResult {
  regularHours: number;
  overtimeHours: number;
  /** Whole cents. */
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  overtimeRate: number;
}

export function validateOvertime(input: OvertimeInput): string[] {
  const issues: string[] = [];
  const { wage, totalHours, threshold = 40, multiplier = 1.5 } = input;
  if (!Number.isFinite(wage) || wage < 0 || wage > 100_000)
    issues.push("enter a wage between $0 and $100,000.");
  if (!Number.isFinite(totalHours) || totalHours < 0 || totalHours > 168) {
    issues.push("enter hours between 0 and 168.");
  }
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 168) {
    issues.push("enter an overtime threshold between 0 and 168 hours.");
  }
  if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 3) {
    issues.push("enter an overtime multiplier between 1 and 3.");
  }
  return issues;
}

/** One week of pay with overtime. State rules (for example daily overtime) can differ. */
export function calculateOvertime(input: OvertimeInput): OvertimeResult {
  const issues = validateOvertime(input);
  if (issues.length > 0) throw new RangeError(`Invalid overtime input: ${issues.join(" ")}`);
  const { wage, totalHours, threshold = 40, multiplier = 1.5 } = input;
  const regularHours = Math.min(totalHours, threshold);
  const overtimeHours = Math.max(0, totalHours - threshold);
  const regularPay = toCents(regularHours * wage);
  const overtimeRate = toCents(wage * multiplier);
  const overtimePay = toCents(overtimeHours * wage * multiplier);
  return {
    regularHours,
    overtimeHours,
    regularPay,
    overtimePay,
    grossPay: regularPay + overtimePay,
    overtimeRate,
  };
}
