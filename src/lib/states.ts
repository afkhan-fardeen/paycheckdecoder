import { STATE_CODES, getStateRates, type StateCode } from "./rates";
import { describeStateRules } from "./state-methods";
import { US_STATE_BY_CODE } from "./us-states";

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
  /** Unused: related states are now chosen by search demand. Kept on the handwritten states for reference. */
  related?: StateCode[];
}

/**
 * Per-state editorial content. This text is part of what a reviewer signs off with the
 * rate files (see docs/runbook.md): a state is not published until both are checked.
 */
const HANDWRITTEN: Partial<Record<StateCode, StateInfo>> = {
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

/**
 * What only a person can supply for a state that is built from its rate data: the employee's withholding
 * form, the label for the allowance field, and any local-tax note. Everything with a number in it is
 * generated from the rate file.
 */
interface StateSpec {
  /** Employee withholding certificate, for example "Form DE 4". */
  form?: string;
  /** Label for the allowance field; omit when the state has no allowances. */
  allowanceLabel?: string;
  /** Replaces the default local-tax note. */
  localNote?: string;
  /** True when employees pay a state unemployment contribution (Alaska, New Jersey, Pennsylvania). */
  employeePaysUnemployment?: boolean;
}

const DEFAULT_LOCAL_NOTE =
  "This calculator does not include city or county taxes. If your locality taxes wages, enter that rate in the local rate field.";

const SPECS: Partial<Record<StateCode, StateSpec>> = {
  CA: {
    form: "Form DE 4",
    allowanceLabel: "Allowances on Form DE 4",
    localNote:
      "California cities and counties do not collect an income tax on wages from your paycheck, so there is no local rate to enter.",
  },
  MI: {
    form: "Form MI-W4",
    allowanceLabel: "Exemptions on Form MI-W4",
    localNote:
      "Many Michigan cities, including Detroit, charge a city income tax on wages. Enter your city rate in the local rate field to include it.",
  },
  CO: {
    form: "Form DR 0004 (optional; the federal Form W-4 sets the default)",
    localNote:
      "Some Colorado cities charge a flat monthly occupational privilege tax. This calculator does not include it.",
  },
  MD: {
    form: "Form MW507",
    allowanceLabel: "Exemptions on Form MW507",
    localNote:
      "Maryland counties and Baltimore City add a local income tax that is withheld with the state tax. Enter your county's rate in the local rate field.",
  },
  IA: { form: "Form IA W-4", allowanceLabel: "Allowances on Form IA W-4" },
  AR: { form: "Form AR4EC", allowanceLabel: "Exemptions on Form AR4EC" },
  KY: {
    form: "Form K-4",
    localNote:
      "Many Kentucky cities and counties charge an occupational license tax on wages. Enter your combined local rate in the local rate field.",
  },
  MO: {
    form: "Form MO W-4",
    localNote:
      "Kansas City and St. Louis charge an earnings tax on wages. Enter that rate in the local rate field if it applies to you.",
  },
  ME: { form: "Form W-4ME", allowanceLabel: "Allowances on Form W-4ME" },
  MA: { form: "Form M-4", allowanceLabel: "Exemptions on Form M-4" },
  MN: { form: "Form W-4MN", allowanceLabel: "Allowances on Form W-4MN" },
  AZ: { form: "Form A-4" },
  VA: { form: "Form VA-4", allowanceLabel: "Exemptions on Form VA-4" },
  OK: { form: "Form OK-W-4", allowanceLabel: "Allowances on Form OK-W-4" },
  WI: { form: "Form WT-4", allowanceLabel: "Exemptions on Form WT-4" },
  NE: { form: "Form W-4N", allowanceLabel: "Allowances on Form W-4N" },
  ND: {},
  NY: {
    form: "Form IT-2104",
    allowanceLabel: "Exemptions on Form IT-2104",
    localNote:
      "New York City residents pay a city income tax and Yonkers residents pay a surcharge, both withheld by employers. Enter your effective city rate in the local rate field to include it.",
  },
  AK: { employeePaysUnemployment: true },
  NH: {},
  SD: {},
  WY: {},
  PA: {
    employeePaysUnemployment: true,
    localNote:
      "Most Pennsylvania cities, townships and school districts charge an earned income tax on wages, usually withheld by your employer. Enter your combined local rate in the local rate field.",
  },
};

function taglineFor(code: StateCode): string {
  const rates = getStateRates(code);
  const base =
    rates.method === "none"
      ? "No state income tax"
      : rates.method === "flat"
        ? "Flat state income tax"
        : "Graduated state income tax";
  return rates.programs.length ? `${base}, plus payroll programs` : base;
}

/** Builds a state's page content from its rate file and spec, so every number in the text comes from the data. */
function buildState(code: StateCode, spec: StateSpec): StateInfo {
  const rates = getStateRates(code);
  const base = US_STATE_BY_CODE[code];
  const name = base.name;
  const methodSentence =
    rates.method === "none"
      ? `${name} does not tax wages at the state level.`
      : rates.method === "flat"
        ? `${name} withholds one flat rate on your taxable pay, after any standard deduction and the allowances you claim.`
        : `${name} withholds with graduated rates that rise with pay, after any standard deduction and the allowances you claim.`;
  const employeePrograms = rates.programs.map((p) => p.name);
  const programs: StateInfo["programs"] = [
    ...employeePrograms.map((n) => ({
      name: n,
      text: "Withheld from your paycheck by your employer. The rate and wage limit are listed in the rules above and come from the state's own pages.",
    })),
    spec.employeePaysUnemployment
      ? {
          name: "Unemployment insurance",
          text: `${name} employees also pay a state unemployment contribution. It is listed in the rules above.`,
        }
      : {
          name: "Unemployment insurance",
          text: `${name} unemployment tax is paid by employers and is not withheld from your pay.`,
        },
  ];
  const rules = describeStateRules(rates);
  const faqs: StateInfo["faqs"] = [
    {
      q: `How does ${name} withhold income tax from a paycheck?`,
      a: `${rules.slice(0, 2).join(" ")} The full rules are listed on this page, with the state's source.`,
    },
    {
      q: `Which form do I give my employer for ${name} withholding?`,
      a: spec.form
        ? `${spec.form}. ${spec.allowanceLabel ? "The allowance field in this calculator is the number you enter on that form. " : ""}If you do not file one, your employer applies the state's default.`
        : `Most ${name} employers use the federal Form W-4 for state withholding, unless the state publishes its own certificate. Ask your payroll department which form applies to you.`,
    },
    employeePrograms.length
      ? {
          q: `Which payroll programs come out of a ${name} paycheck besides income tax?`,
          a: `${employeePrograms.join(" and ")} ${employeePrograms.length > 1 ? "are" : "is"} withheld from your pay. The rates and wage limits are listed in the rules on this page.`,
        }
      : {
          q: `Do I pay ${name} unemployment tax?`,
          a: `No. Employers pay it. It does not appear as a deduction on your paycheck.`,
        },
    {
      q: `Why might my employer's pay stub differ from this ${name} estimate?`,
      a: "Your withholding form, benefit deductions, other jobs and your employer's payroll software can each move withholding by a few dollars per paycheck. Treat the result as an estimate.",
    },
  ];
  return {
    code,
    slug: base.slug,
    name,
    tagline: taglineFor(code),
    allowanceLabel: spec.allowanceLabel,
    structure: `${methodSentence} Your paycheck is also reduced by federal income tax withholding, Social Security and Medicare, plus your own deductions such as a 401(k) or health insurance.`,
    programs,
    localNote: spec.localNote ?? DEFAULT_LOCAL_NOTE,
    faqs,
  };
}

/** Every published state's page content. Building fails if a rate file has neither handwritten content nor a spec. */
export const STATES: Record<StateCode, StateInfo> = Object.fromEntries(
  STATE_CODES.map((code) => {
    const hand = HANDWRITTEN[code];
    if (hand) return [code, hand];
    const spec = SPECS[code];
    if (!spec)
      throw new Error(`No page content for ${code}: add it to HANDWRITTEN or SPECS in src/lib/states.ts`);
    return [code, buildState(code, spec)];
  }),
) as Record<StateCode, StateInfo>;

export function stateBySlug(slug: string): StateInfo | undefined {
  return Object.values(STATES).find((s) => s.slug === slug);
}
