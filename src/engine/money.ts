/** Dollars to whole cents. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Cents to a dollars number. Display only: never feed the result back into tax math. */
export function toDollars(cents: number): number {
  return cents / 100;
}

const withCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const whole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** `$1,721.00`: per-paycheck amounts. */
export function formatCents(cents: number): string {
  return withCents.format(toDollars(cents));
}

/** `$44,746`: annual headline amounts, rounded to whole dollars. */
export function formatWhole(cents: number): string {
  return whole.format(toDollars(cents));
}

/** `86.1%`: at most one decimal. */
export function formatPercent(ratio: number): string {
  return `${(Math.round(ratio * 1000) / 10).toFixed(1).replace(/\.0$/, "")}%`;
}
