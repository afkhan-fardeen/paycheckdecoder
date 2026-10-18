import { calculatePaycheck, grossPerPeriodFromSalary, type PaycheckResult } from "@/engine";
import { federalRates, getStateRates, type StateCode } from "./rates";

/** The default worked example used in answer blocks and examples: single, paid every two weeks. */
export const EXAMPLE_SALARY = 52_000;

export function examplePaycheck(
  code: StateCode,
  salary = EXAMPLE_SALARY,
  frequency: "biweekly" | "monthly" | "weekly" | "semimonthly" = "biweekly",
): PaycheckResult {
  return calculatePaycheck(
    {
      grossPerPeriod: grossPerPeriodFromSalary(salary, frequency),
      frequency,
      filingStatus: "single",
    },
    { federal: federalRates, state: getStateRates(code) },
  );
}
