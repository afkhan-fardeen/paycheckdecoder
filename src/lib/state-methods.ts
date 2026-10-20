import type { StateRates } from "./rates-schema";

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const pct = (ratio: number) => `${Number((ratio * 100).toFixed(3))}%`;

type Rules = Extract<StateRates, { method: "flat" | "brackets" }>["parameters"];
const STATUS = { single: "single", married: "married", head: "head of household" } as const;

/** One line per filing status, or a single line when they are all equal. */
function perStatusLine(label: string, v: { single: number; married: number; head: number }): string | null {
  if (!v.single && !v.married && !v.head) return null;
  if (v.single === v.married && v.single === v.head) return `${label}: ${usd(v.single)} a year.`;
  return `${label}: ${usd(v.single)} single, ${usd(v.married)} married, ${usd(v.head)} head of household.`;
}

function ruleLines(p: Rules): string[] {
  const lines: string[] = [];
  const std = perStatusLine("Standard deduction", p.standardDeduction);
  lines.push(std ?? "There is no standard deduction in the withholding calculation.");
  for (const t of p.allowanceTiers) {
    lines.push(
      `${t.status === "married" ? "Married" : STATUS[t.status]} filers claiming ${t.minAllowances} or more allowances use a ${usd(t.standardDeduction)} standard deduction.`,
    );
  }
  if (p.deductionPhaseOut && Object.values(p.deductionPhaseOut).some(Boolean)) {
    lines.push(
      "The standard deduction phases out for higher wages and reaches zero at the top of the range.",
    );
  }
  if (p.allowanceAmount || p.allowanceBase) {
    lines.push(
      p.allowanceBase
        ? `Claiming allowances lowers taxable pay by ${usd(p.allowanceBase)} plus ${usd(p.allowanceAmount)} for each one.`
        : `Each allowance lowers taxable pay by ${usd(p.allowanceAmount)} a year.`,
    );
  }
  if (p.allowanceCredit) lines.push(`Each allowance takes ${usd(p.allowanceCredit)} a year off the tax.`);
  const credit = perStatusLine("Annual credit", p.statusCredit);
  if (credit) lines.push(credit);
  if (p.ficaDeductionCap !== null) {
    lines.push(
      `Social Security and Medicare withheld are deducted, up to ${usd(p.ficaDeductionCap)} a year.`,
    );
  }
  const low = perStatusLine("No tax is withheld when annual wages are at or below", p.lowIncomeExemption);
  if (low) lines.push(low);
  if (p.roundAnnualTax)
    lines.push("The annual tax is rounded to the whole dollar before it is divided across paychecks.");
  if (p.roundToDollar) lines.push("Each paycheck's withholding is rounded to the whole dollar.");
  return lines;
}

/** Plain-language rules for a state, generated from its rate file so page text can never drift from the numbers. */
export function describeStateRules(rates: StateRates): string[] {
  const lines: string[] = [];
  if (rates.method === "none") {
    lines.push("No state income tax is withheld from wages.");
  } else if (rates.method === "flat") {
    lines.push(
      `Withholding rate: ${pct(rates.parameters.rate)} of taxable pay.`,
      ...ruleLines(rates.parameters),
    );
  } else if (rates.method === "brackets") {
    const rateList = Object.values(rates.parameters.brackets).flatMap((t) => t.map((r) => r.rate));
    const lo = Math.min(...rateList);
    const hi = Math.max(...rateList);
    const count = rates.parameters.brackets.single.length;
    lines.push(
      `Graduated rates from ${pct(lo)} to ${pct(hi)} across ${count} brackets, with separate tables by filing status.`,
      ...ruleLines(rates.parameters),
    );
  } else {
    const p = rates.parameters;
    let floor = 0;
    for (const t of p.tiers) {
      lines.push(
        `${t.upTo === null ? `Taxable pay over ${usd(floor)}` : floor === 0 ? `Taxable pay up to ${usd(t.upTo)}` : `Taxable pay from ${usd(floor)} to ${usd(t.upTo)}`}: ${
          t.base ? `${usd(t.base)} plus ` : ""
        }${pct(t.rate)}${t.base ? ` of the amount over ${usd(floor)}` : ""}.`,
      );
      if (t.upTo !== null) floor = t.upTo;
    }
    if (p.allowanceAmount)
      lines.push(`Each exemption reduces taxable pay by ${usd(p.allowanceAmount)} a year.`);
  }
  if (rates.localTaxBase === "taxable") {
    lines.push(
      "A local (county) rate, if you enter one, is applied to the same taxable pay as the state tax.",
    );
  }
  for (const program of rates.programs) {
    const mine = program.rate * program.employeeShare;
    const share =
      program.employeeShare < 1
        ? `you pay ${pct(program.employeeShare)} of a ${pct(program.rate)} premium (about ${pct(mine)} of gross wages)`
        : `${pct(program.rate)} of gross wages, paid by you`;
    lines.push(
      `${program.name}: ${share}${program.wageCap ? `, up to ${usd(program.wageCap)} a year` : ", with no wage cap"}.`,
    );
  }
  return lines;
}

/** One sentence for the answer block, for example "Illinois withholds a flat 4.95% after allowances." */
export function stateAnswerNote(name: string, rates: StateRates): string {
  const programs = rates.programs.map((p) => p.name).join(" and ");
  if (rates.method === "none") {
    return programs
      ? `${name} has no state income tax, but ${programs} premiums come out of your pay.`
      : `${name} has no state income tax.`;
  }
  const base =
    rates.method === "flat"
      ? `${name} withholds a flat ${pct(rates.parameters.rate)} of taxable pay.`
      : rates.method === "brackets"
        ? `${name} uses graduated withholding rates.`
        : `${name} uses a graduated withholding formula.`;
  return programs ? `${base} ${programs} premiums also come out of your pay.` : base;
}

/** Short note under the state line in the breakdown table. */
export function stateTableNote(name: string, rates: StateRates): string {
  if (rates.method === "none") return `${name} has no state income tax`;
  if (rates.method === "flat") return `Flat ${pct(rates.parameters.rate)} after deductions and allowances`;
  if (rates.method === "brackets") return "Graduated rates after deductions and allowances";
  return "Graduated withholding formula";
}

/** Subject for "after federal income tax, ..." in the answer block. */
export function taxPhrase(name: string, rates: StateRates): string {
  const state = rates.method === "none" ? "" : `${name} income tax, `;
  const programs = rates.programs.length ? `${rates.programs.map((p) => p.name).join(", ")}, ` : "";
  return `federal income tax, ${state}${programs}Social Security and Medicare`;
}

export type TaxTypeTone = "none" | "flat" | "graduated";

/** Short label for cards and filters: how this state taxes wages. */
export function stateTaxType(rates: StateRates): { label: string; tone: TaxTypeTone } {
  if (rates.method === "none") return { label: "No income tax", tone: "none" };
  if (rates.method === "flat") return { label: "Flat rate", tone: "flat" };
  return { label: "Graduated", tone: "graduated" };
}
