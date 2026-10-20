import type { StateRates } from "./rates-schema";

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const pct = (ratio: number) => `${Number((ratio * 100).toFixed(3))}%`;

/** Plain-language rules for a state, generated from its rate file so page text can never drift from the numbers. */
export function describeStateRules(rates: StateRates): string[] {
  const lines: string[] = [];
  if (rates.method === "none") {
    lines.push("No state income tax is withheld from wages.");
  } else if (rates.method === "flat") {
    const p = rates.parameters;
    lines.push(`Withholding rate: ${pct(p.rate)} of taxable pay.`);
    const d = p.standardDeduction;
    if (d.single || d.married || d.head) {
      lines.push(
        d.single === d.married && d.single === d.head
          ? `Standard deduction: ${usd(d.single)} a year.`
          : `Standard deduction a year: ${usd(d.single)} single, ${usd(d.married)} married, ${usd(d.head)} head of household.`,
      );
    } else {
      lines.push("There is no standard deduction in the withholding calculation.");
    }
    if (p.allowanceAmount)
      lines.push(`Each allowance reduces taxable pay by ${usd(p.allowanceAmount)} a year.`);
    if (p.roundToDollar) lines.push("Each paycheck's withholding is rounded to the whole dollar.");
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
  if (rates.method === "flat") {
    return `${name} withholds a flat ${pct(rates.parameters.rate)} of taxable pay.`;
  }
  return `${name} uses a graduated withholding formula.`;
}

/** Short note under the state line in the breakdown table. */
export function stateTableNote(name: string, rates: StateRates): string {
  if (rates.method === "none") return `${name} has no state income tax`;
  if (rates.method === "flat") return `Flat ${pct(rates.parameters.rate)} after deductions and allowances`;
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
