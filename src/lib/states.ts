import type { StateCode } from "./rates";

export interface StateInfo {
  code: StateCode;
  slug: string;
  name: string;
  /** Short line shown under the state name in the picker. */
  tagline: string;
  /** Label for the state withholding allowance field, or undefined when the state has none. */
  allowanceLabel?: string;
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
  WA: {
    code: "WA",
    slug: "washington",
    name: "Washington",
    tagline: "WA Cares and Paid Leave apply",
    structure:
      "Washington does not tax wages as income. Your paycheck is still reduced by federal income tax withholding, Social Security and Medicare, plus two employee-paid state programs: the WA Cares long-term care premium and Paid Family and Medical Leave.",
    programs: [
      {
        name: "WA Cares and Paid Family and Medical Leave",
        text: "Both are withheld from your paycheck by your employer. The current rates and wage caps are listed above and come from the state's own pages.",
      },
      {
        name: "Unemployment insurance",
        text: "Washington unemployment tax is paid by employers and is not withheld from your pay.",
      },
    ],
    localNote:
      "Washington cities and counties do not collect an income tax on wages, so there is no local rate to enter.",
    faqs: [
      {
        q: "Does Washington have a state income tax?",
        a: "No. Washington does not tax wages as income, but two state programs, WA Cares and Paid Family and Medical Leave, take a share of your pay.",
      },
      {
        q: "What is WA Cares?",
        a: "WA Cares is the state's long-term care insurance program. Employees pay the premium through payroll, unless they hold an approved exemption, which this calculator does not model.",
      },
      {
        q: "Does my employer pay part of Paid Family and Medical Leave?",
        a: "Employers with 50 or more employees pay part of the premium. The calculator assumes you pay the employee share shown above.",
      },
      {
        q: "Do I have to pay these if I work in Washington but live elsewhere?",
        a: "Premiums generally follow where you work. Check with your employer or the state's Employment Security Department about your situation.",
      },
    ],
    related: ["TX", "FL", "NV", "TN", "IL"],
  },
  IL: {
    code: "IL",
    slug: "illinois",
    name: "Illinois",
    tagline: "Flat state income tax",
    allowanceLabel: "Allowances on Form IL-W-4, line 1",
    structure:
      "Illinois taxes wages at one flat rate. Your employer withholds that rate after subtracting an allowance amount for each allowance you claim on Form IL-W-4, then your paycheck is also reduced by federal income tax withholding, Social Security and Medicare.",
    programs: [
      {
        name: "Unemployment insurance",
        text: "Illinois unemployment tax is paid by employers and is not withheld from your pay.",
      },
      {
        name: "Disability and paid family leave",
        text: "Illinois has no state-run disability or paid family leave insurance that takes money from your paycheck.",
      },
    ],
    localNote:
      "Illinois cities and counties do not collect an income tax on wages, so there is no local rate to enter.",
    faqs: [
      {
        q: "What is the Illinois income tax rate?",
        a: "Illinois uses one flat rate for all income levels, shown in the rules above. There are no brackets.",
      },
      {
        q: "What is Form IL-W-4?",
        a: "It tells your employer how many allowances you claim. Each one lowers the pay that is taxed. The calculator's allowance field is the number you put on line 1.",
      },
      {
        q: "Does Illinois have a standard deduction in withholding?",
        a: "No. Illinois withholding subtracts only the allowance amounts. Any deductions you take come at filing time.",
      },
      {
        q: "Why is my Illinois withholding different from this estimate?",
        a: "Line 2 allowances on Form IL-W-4 and any extra withholding you requested are not modelled, and your employer's payroll system may round differently.",
      },
    ],
    related: ["OH", "GA", "NC", "WA"],
  },
  NC: {
    code: "NC",
    slug: "north-carolina",
    name: "North Carolina",
    tagline: "Flat state income tax",
    allowanceLabel: "Allowances on Form NC-4",
    structure:
      "North Carolina taxes wages at a flat rate. Employers withhold at that rate plus a small addition, after subtracting a standard deduction and an amount for each allowance on Form NC-4. Your paycheck is also reduced by federal income tax withholding, Social Security and Medicare.",
    programs: [
      {
        name: "Unemployment insurance",
        text: "North Carolina unemployment tax is paid by employers and is not withheld from your pay.",
      },
      {
        name: "Disability and paid family leave",
        text: "North Carolina has no state-run disability or paid family leave insurance that takes money from your paycheck.",
      },
    ],
    localNote:
      "North Carolina cities and counties do not collect an income tax on wages, so there is no local rate to enter.",
    faqs: [
      {
        q: "What is the North Carolina income tax rate?",
        a: "North Carolina uses a flat income tax rate. Employers withhold one tenth of a percentage point more than that rate, which is the withholding rate shown above.",
      },
      {
        q: "Why is the withholding rate higher than the tax rate?",
        a: "North Carolina sets withholding at the income tax rate plus 0.1%, so slightly more is held back during the year.",
      },
      {
        q: "Does North Carolina round withholding?",
        a: "Yes. Each paycheck's state withholding is rounded to the nearest whole dollar, so your state line has no cents.",
      },
      {
        q: "What is Form NC-4?",
        a: "It tells your employer your filing status and how many allowances you claim. Each allowance lowers the pay that is taxed for withholding.",
      },
    ],
    related: ["GA", "OH", "IL", "TN"],
  },
  OH: {
    code: "OH",
    slug: "ohio",
    name: "Ohio",
    tagline: "Graduated withholding, local tax common",
    allowanceLabel: "Exemptions on Form IT 4",
    structure:
      "Ohio employers withhold state income tax with a formula that has three pay tiers and an exemption amount for each exemption on Form IT 4. These withholding rates are set by the Ohio Department of Taxation and are not the same as the rate on the annual tax return. Your paycheck is also reduced by federal income tax withholding, Social Security and Medicare.",
    programs: [
      {
        name: "Unemployment insurance",
        text: "Ohio unemployment tax is paid by employers and is not withheld from your pay.",
      },
      {
        name: "School district income tax",
        text: "Some Ohio school districts levy an income tax that your employer withholds. This is not included unless you enter it as a local rate.",
      },
    ],
    localNote:
      "Many Ohio cities charge an income tax on wages, usually withheld by your employer for the city where you work. Enter your combined city and school district rate in the local rate field to include it.",
    faqs: [
      {
        q: "Why does Ohio withholding use a formula with three tiers?",
        a: "The Ohio Department of Taxation publishes a withholding formula, effective August 1, 2026, with a rate for each pay tier. It is built to approximate the annual tax over the year.",
      },
      {
        q: "Do I pay city income tax in Ohio?",
        a: "Often, yes. Many Ohio cities tax wages. Enter your city rate, and any school district rate, in the local rate field to see it in your estimate.",
      },
      {
        q: "What is Form IT 4?",
        a: "It tells your employer how many exemptions you claim. Each exemption lowers the pay that is taxed for withholding.",
      },
      {
        q: "Did Ohio's withholding change this year?",
        a: "Yes. New tables took effect for payrolls ending on or after August 1, 2026. This calculator uses the current tables, so a paycheck from earlier in the year may differ.",
      },
    ],
    related: ["IL", "GA", "NC", "TN"],
  },
  GA: {
    code: "GA",
    slug: "georgia",
    name: "Georgia",
    tagline: "Flat state income tax",
    allowanceLabel: "Dependents on Form G-4",
    structure:
      "Georgia taxes wages at one flat rate. Employers withhold it after subtracting a standard deduction that depends on filing status, plus an allowance for each dependent claimed on Form G-4. Your paycheck is also reduced by federal income tax withholding, Social Security and Medicare.",
    programs: [
      {
        name: "Unemployment insurance",
        text: "Georgia unemployment tax is paid by employers and is not withheld from your pay.",
      },
      {
        name: "Disability and paid family leave",
        text: "Georgia has no state-run disability or paid family leave insurance that takes money from your paycheck.",
      },
    ],
    localNote:
      "Georgia cities and counties do not collect an income tax on wages, so there is no local rate to enter.",
    faqs: [
      {
        q: "What is the Georgia income tax rate?",
        a: "Georgia uses one flat rate. The state lowered it during 2026, and the current withholding rate is shown in the rules above.",
      },
      {
        q: "Did my employer withhold a different rate earlier this year?",
        a: "Possibly. The state told employers to keep withholding the old rate until the change took effect and allowed them to switch afterwards, so early-2026 paychecks may differ from this estimate.",
      },
      {
        q: "How does filing status change Georgia withholding?",
        a: "The standard deduction is larger for married filing jointly when the spouse does not work. Married couples who both work use the smaller deduction on Form G-4, so they see less pay than this estimate for married filers.",
      },
      {
        q: "What is Form G-4?",
        a: "It tells your employer your filing status and the number of dependents you claim. Each dependent allowance lowers the pay that is taxed.",
      },
    ],
    related: ["NC", "OH", "IL", "TN"],
  },
};

export function stateBySlug(slug: string): StateInfo | undefined {
  return Object.values(STATES).find((s) => s.slug === slug);
}
