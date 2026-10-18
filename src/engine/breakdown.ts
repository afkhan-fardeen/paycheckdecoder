import type { PaycheckResult } from "./types";

export type SliceKey = "net" | "federal" | "social" | "medicare" | "state" | "deductions";

export interface Slice {
  key: SliceKey;
  label: string;
  /** Whole cents per paycheck. */
  perPeriod: number;
  annual: number;
  /** Share of gross, 0 to 1. */
  share: number;
}

/**
 * The six slices of the breakdown bar, net first. Zero slices stay in the list (the table
 * shows them with a note); the bar component skips them.
 */
export function breakdownSlices(result: PaycheckResult): Slice[] {
  const { lines, periods } = result;
  const gross = lines.gross.perPeriod;
  const make = (key: SliceKey, label: string, perPeriod: number): Slice => ({
    key,
    label,
    perPeriod,
    annual: perPeriod * periods,
    share: gross === 0 ? 0 : perPeriod / gross,
  });
  return [
    make("net", "Take-home pay", lines.net.perPeriod),
    make("federal", "Federal income tax", lines.federal.perPeriod),
    make("social", "Social Security", lines.socialSecurity.perPeriod),
    make("medicare", "Medicare", lines.medicare.perPeriod + lines.additionalMedicare.perPeriod),
    make("state", "State and local tax", lines.state.perPeriod + lines.local.perPeriod),
    make("deductions", "Deductions", result.totalDeductions.perPeriod),
  ];
}
