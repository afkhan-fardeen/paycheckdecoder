import type { StateCode } from "./rates";

export interface StateInfo {
  code: StateCode;
  slug: string;
  name: string;
  /** Short line shown under the state name in the picker. */
  tagline: string;
  /** Opening paragraph of "How {state} payroll tax works". */
  structure: string;
  programs: { name: string; text: string }[];
  localNote: string;
  faqs: { q: string; a: string }[];
  /** Codes of states linked from "Related calculators". */
  related: StateCode[];
}

/**
 * Per-state editorial content. This text is part of what a reviewer signs off with the
 * rate files (see docs/runbook.md): a state is not published until both are checked.
 */
export const STATES: Record<StateCode, StateInfo> = {
  TX: {
    code: "TX",
    slug: "texas",
    name: "Texas",
    tagline: "No state income tax",
    structure:
      "Texas does not tax wages at the state level. Your paycheck is reduced by federal income tax withholding, Social Security and Medicare, and by whatever deductions you choose, such as a 401(k) or health insurance.",
    programs: [
      {
        name: "Unemployment insurance",
        text: "Texas unemployment tax is paid by employers and is not withheld from your pay.",
      },
      {
        name: "Disability and paid family leave",
        text: "Texas has no state-run disability or paid family leave program that takes money from your paycheck.",
      },
    ],
    localNote:
      "Texas cities and counties do not collect an income tax on wages, so there is no local rate to enter.",
    faqs: [
      {
        q: "Does Texas have a state income tax?",
        a: "No. Texas does not collect a personal income tax on wages, so the only income tax taken from your paycheck is federal.",
      },
      {
        q: "Why is my Texas take-home pay still lower than my gross pay?",
        a: "Federal income tax, Social Security (6.2%) and Medicare (1.45%) still apply, plus any pre-tax or after-tax deductions you elect.",
      },
      {
        q: "Do I pay Texas unemployment tax?",
        a: "No. Employers pay it. It does not appear as a deduction on your paycheck.",
      },
      {
        q: "If I live in Texas but work in another state, which rules apply?",
        a: "The state where you work usually decides state withholding. Use that state's calculator, or ask your employer which state they withhold for.",
      },
    ],
    related: ["FL", "TN", "NV"],
  },
  FL: {
    code: "FL",
    slug: "florida",
    name: "Florida",
    tagline: "No state income tax",
    structure:
      "Florida does not tax individual income, so wages are taxed only at the federal level. Your paycheck is reduced by federal income tax withholding, Social Security and Medicare, plus your own deductions.",
    programs: [
      {
        name: "Reemployment tax",
        text: "Florida's unemployment program is called reemployment tax and is paid by employers, not withheld from your pay.",
      },
      {
        name: "Disability and paid family leave",
        text: "Florida has no state-run disability or paid family leave program that takes money from your paycheck.",
      },
    ],
    localNote:
      "Florida cities and counties do not collect an income tax on wages, so there is no local rate to enter.",
    faqs: [
      {
        q: "Does Florida have a state income tax?",
        a: "No. Florida does not tax the wages of individuals, so no state income tax is withheld from your paycheck.",
      },
      {
        q: "What is taken out of a Florida paycheck?",
        a: "Federal income tax, Social Security (6.2%), Medicare (1.45%) and any deductions you choose, such as retirement contributions or health premiums.",
      },
      {
        q: "Is Florida reemployment tax deducted from my pay?",
        a: "No. Employers pay it. It is not a deduction on your paycheck.",
      },
      {
        q: "Does a Florida paycheck have to match this estimate?",
        a: "Not exactly. Your Form W-4 choices, benefits and your employer's payroll software can shift withholding a little. Treat the result as an estimate.",
      },
    ],
    related: ["TX", "TN", "NV"],
  },
  TN: {
    code: "TN",
    slug: "tennessee",
    name: "Tennessee",
    tagline: "No state income tax",
    structure:
      "Tennessee does not tax wages. Its tax on investment income, the Hall tax, was fully repealed for 2021 and later years, so wage earners see only federal income tax, Social Security and Medicare, plus their own deductions.",
    programs: [
      {
        name: "Unemployment insurance",
        text: "Tennessee unemployment tax is paid by employers and is not withheld from your pay.",
      },
      {
        name: "Disability and paid family leave",
        text: "Tennessee has no state-run disability or paid family leave program that takes money from your paycheck.",
      },
    ],
    localNote:
      "Tennessee cities and counties do not collect an income tax on wages, so there is no local rate to enter.",
    faqs: [
      {
        q: "Does Tennessee tax wages?",
        a: "No. Tennessee has no tax on wages. The Hall tax on investment income was repealed starting in 2021.",
      },
      {
        q: "What comes out of a Tennessee paycheck?",
        a: "Federal income tax, Social Security (6.2%), Medicare (1.45%) and the deductions you elect.",
      },
      {
        q: "Is there a Tennessee payroll tax I should know about?",
        a: "Employers pay Tennessee unemployment tax. Nothing is withheld from your pay for it.",
      },
      {
        q: "How is the take-home pay on this page calculated?",
        a: "The calculator annualizes your pay, applies the standard deduction and the federal brackets, and adds Social Security and Medicare. The methodology page lists each step and its source.",
      },
    ],
    related: ["TX", "FL", "NV"],
  },
  NV: {
    code: "NV",
    slug: "nevada",
    name: "Nevada",
    tagline: "No state income tax",
    structure:
      "Nevada has no personal income tax. Your paycheck is reduced by federal income tax withholding, Social Security and Medicare, plus your own deductions such as a 401(k) or health insurance.",
    programs: [
      {
        name: "Unemployment insurance",
        text: "Nevada unemployment tax is paid by employers and is not withheld from your pay.",
      },
      {
        name: "Modified Business Tax",
        text: "Nevada's payroll-based Modified Business Tax is paid by employers and does not reduce your pay.",
      },
    ],
    localNote:
      "Nevada cities and counties do not collect an income tax on wages, so there is no local rate to enter.",
    faqs: [
      {
        q: "Does Nevada have a state income tax?",
        a: "No. Nevada does not collect a personal income tax, so only federal income tax is withheld from your wages.",
      },
      {
        q: "Is the Nevada Modified Business Tax taken from my paycheck?",
        a: "No. It is a payroll-based tax that employers pay. It does not appear as a deduction for you.",
      },
      {
        q: "What lowers my Nevada take-home pay?",
        a: "Federal income tax, Social Security (6.2%), Medicare (1.45%) and the pre-tax or after-tax deductions you choose.",
      },
      {
        q: "Why might my employer's pay stub differ from this estimate?",
        a: "Your Form W-4 choices, benefit deductions and the payroll system's rounding can all move withholding by a few dollars per paycheck.",
      },
    ],
    related: ["TX", "FL", "TN"],
  },
};

export function stateBySlug(slug: string): StateInfo | undefined {
  return Object.values(STATES).find((s) => s.slug === slug);
}
