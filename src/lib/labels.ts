import type { FilingStatus, PayFrequency } from "@/engine";

export const FREQUENCY_LABEL: Record<PayFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every two weeks",
  semimonthly: "Twice a month",
  monthly: "Monthly",
};

/** Lower-case phrase for sentences: "per two weeks". */
export const FREQUENCY_PER: Record<PayFrequency, string> = {
  weekly: "per week",
  biweekly: "per two weeks",
  semimonthly: "twice a month",
  monthly: "per month",
};

export const FILING_LABEL: Record<FilingStatus, string> = {
  single: "Single",
  married: "Married",
  head: "Head of household",
};
