/** One row of a bracket table: income up to `upTo` (null = no limit) is taxed at `rate`. */
export interface BracketRow {
  upTo: number | null;
  rate: number;
}

/** Tax on annual taxable income from a marginal bracket table, in dollars (unrounded). */
export function taxFromBrackets(taxable: number, table: readonly BracketRow[]): number {
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
