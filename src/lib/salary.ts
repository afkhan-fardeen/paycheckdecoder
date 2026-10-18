/** Hourly wages that get their own converter page (v1: the top 25 by search volume to confirm in Ahrefs). */
export const SALARY_WAGES = [
  10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 32, 35, 38, 40, 45, 50,
] as const;

export const salarySlug = (wage: number) => `${wage}-an-hour-is-how-much-a-year`;

export function wageFromSlug(slug: string): number | null {
  const m = /^(\d+)-an-hour-is-how-much-a-year$/.exec(slug);
  if (!m) return null;
  const wage = Number(m[1]);
  return (SALARY_WAGES as readonly number[]).includes(wage) ? wage : null;
}

/** Nearest listed wages around `wage`, two below and two above where they exist. */
export function nearbyWages(wage: number): number[] {
  const i = SALARY_WAGES.indexOf(wage as (typeof SALARY_WAGES)[number]);
  return SALARY_WAGES.slice(Math.max(0, i - 2), i + 3) as unknown as number[];
}
