import {
  breakdownSlices,
  calculatePaycheck,
  grossPerPeriodFromSalary,
  type FilingStatus,
  type Slice,
} from "@/engine";
import { federalRates, getStateRates, type StateCode } from "./rates";
import { stateTaxType, type TaxTypeTone } from "./state-methods";
import { STATES } from "./states";

export interface CompareRow {
  code: StateCode;
  name: string;
  slug: string;
  /** Annual take-home, whole cents. */
  net: number;
  annualTaxes: number;
  /** Net / gross, 0 to 1. */
  rate: number;
  slices: Slice[];
  taxLabel: string;
  taxTone: TaxTypeTone;
}

/** Take-home for one salary in each state: single or married, paid every two weeks, no deductions. Sorted best first. */
export function compareStates(codes: StateCode[], salary: number, filing: FilingStatus): CompareRow[] {
  return codes
    .map((code) => {
      const state = getStateRates(code);
      const result = calculatePaycheck(
        {
          grossPerPeriod: grossPerPeriodFromSalary(salary, "biweekly"),
          frequency: "biweekly",
          filingStatus: filing,
        },
        { federal: federalRates, state },
      );
      const type = stateTaxType(state);
      return {
        code,
        name: STATES[code].name,
        slug: STATES[code].slug,
        net: result.lines.net.annual,
        annualTaxes: result.totalTaxes.annual,
        rate: result.takeHomeRate,
        slices: breakdownSlices(result),
        taxLabel: type.label,
        taxTone: type.tone,
      };
    })
    .sort((a, b) => b.net - a.net || a.name.localeCompare(b.name));
}

export interface CurvePoint {
  salary: number;
  /** Whole dollars per year. */
  net: number;
  taxes: number;
  rate: number;
}

export const CURVE_MIN = 20_000;
export const CURVE_MAX = 200_000;
export const CURVE_STEP = 5_000;

/** Annual take-home across a range of salaries for one state, single filer. Powers the line chart. */
export function takeHomeCurve(code: StateCode, filing: FilingStatus = "single"): CurvePoint[] {
  const state = getStateRates(code);
  const points: CurvePoint[] = [];
  for (let salary = CURVE_MIN; salary <= CURVE_MAX; salary += CURVE_STEP) {
    const r = calculatePaycheck(
      {
        grossPerPeriod: grossPerPeriodFromSalary(salary, "biweekly"),
        frequency: "biweekly",
        filingStatus: filing,
      },
      { federal: federalRates, state },
    );
    points.push({
      salary,
      net: Math.round(r.lines.net.annual / 100),
      taxes: Math.round(r.totalTaxes.annual / 100),
      rate: r.takeHomeRate,
    });
  }
  return points;
}
