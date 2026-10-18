import {
  calculatePaycheck,
  grossPerPeriodFromHourly,
  grossPerPeriodFromSalary,
  validateInput,
  type FilingStatus,
  type PayFrequency,
  type PaycheckInput,
  type PaycheckResult,
} from "@/engine";
import { parseNumber } from "./parse";
import { federalRates, getStateRates, type StateCode } from "./rates";

/** Everything the calculator form holds, as the visitor typed it. */
export interface FormState {
  payType: "salary" | "hourly";
  amount: string;
  hours: string;
  frequency: PayFrequency;
  filingStatus: FilingStatus;
  preTax401k: string;
  preTaxHealth: string;
  postTax: string;
  localRate: string;
  credits: string;
  otherIncome: string;
  deductions: string;
  extra: string;
}

export type FieldName = keyof FormState | "form";

export const DEFAULT_FORM: FormState = {
  payType: "salary",
  amount: "52,000",
  hours: "40",
  frequency: "biweekly",
  filingStatus: "single",
  preTax401k: "",
  preTaxHealth: "",
  postTax: "",
  localRate: "",
  credits: "",
  otherIncome: "",
  deductions: "",
  extra: "",
};

export interface Estimate {
  /** Messages are shown after the word "Error:". */
  errors: Partial<Record<FieldName, string>>;
  input?: PaycheckInput;
  result?: PaycheckResult;
}

const ISSUE_FIELD: Record<string, FieldName> = {
  grossPerPeriod: "amount",
  preTax401k: "preTax401k",
  preTaxHealth: "preTaxHealth",
  postTax: "postTax",
  localRatePercent: "localRate",
  w4: "credits",
};

export function computeEstimate(form: FormState, code: StateCode): Estimate {
  const errors: Estimate["errors"] = {};

  const amount = parseNumber(form.amount);
  const hours = parseNumber(form.hours);
  if (Number.isNaN(amount)) {
    errors.amount = form.payType === "salary" ? "enter your yearly salary." : "enter your hourly wage.";
  } else if (form.payType === "hourly" && amount > 100_000) {
    errors.amount = "enter a wage between $0 and $100,000.";
  } else if (form.payType === "salary" && amount > 100_000_000) {
    errors.amount = "enter a salary under $100,000,000.";
  }
  if (form.payType === "hourly" && (Number.isNaN(hours) || hours < 0 || hours > 168)) {
    errors.hours = "enter hours between 0 and 168.";
  }

  const optional = (key: keyof FormState, label: string) => {
    const n = parseNumber(form[key] as string, 0);
    if (Number.isNaN(n)) errors[key] = `enter ${label} as a number.`;
    return n;
  };
  const preTax401k = optional("preTax401k", "your 401(k) amount");
  const preTaxHealth = optional("preTaxHealth", "your health insurance amount");
  const postTax = optional("postTax", "your after-tax deductions");
  const localRate = optional("localRate", "a local tax rate");
  const credits = optional("credits", "W-4 credits");
  const otherIncome = optional("otherIncome", "other income");
  const deductions = optional("deductions", "W-4 deductions");
  const extra = optional("extra", "extra withholding");

  if (Object.keys(errors).length > 0) return { errors };

  const gross =
    form.payType === "salary"
      ? grossPerPeriodFromSalary(amount, form.frequency)
      : grossPerPeriodFromHourly({ wage: amount, hoursPerWeek: hours, weeksPerYear: 52 }, form.frequency);

  const input: PaycheckInput = {
    grossPerPeriod: gross,
    frequency: form.frequency,
    filingStatus: form.filingStatus,
    preTax401k,
    preTaxHealth,
    postTax,
    localRatePercent: localRate,
    w4: {
      creditsPerYear: credits,
      otherIncomePerYear: otherIncome,
      deductionsPerYear: deductions,
      extraWithholdingPerPeriod: extra,
    },
  };

  const issues = validateInput(input);
  if (issues.length > 0) {
    for (const issue of issues) errors[ISSUE_FIELD[issue.field] ?? "form"] ??= issue.message;
    return { errors, input };
  }
  try {
    const result = calculatePaycheck(input, { federal: federalRates, state: getStateRates(code) });
    return { errors, input, result };
  } catch (e) {
    if (e instanceof RangeError) {
      return { errors: { form: "your deductions and taxes are more than your gross pay." }, input };
    }
    throw e;
  }
}
