import { z } from "zod";

const bracketSchema = z.object({
  upTo: z.number().positive().nullable(),
  rate: z.number().min(0).max(1),
});

const bracketTable = z
  .array(bracketSchema)
  .min(1)
  .superRefine((rows, ctx) => {
    rows.forEach((row, i) => {
      const last = i === rows.length - 1;
      if (last && row.upTo !== null) {
        ctx.addIssue({ code: "custom", message: "last bracket must have upTo null" });
      }
      if (!last) {
        const next = rows[i + 1];
        if (row.upTo === null || (next.upTo !== null && next.upTo <= row.upTo)) {
          ctx.addIssue({ code: "custom", message: "bracket limits must ascend" });
        }
      }
    });
  });

const perStatus = <T extends z.ZodType>(inner: T) => z.object({ single: inner, married: inner, head: inner });

const sourceSchema = z.object({ name: z.string().min(1), url: z.url() });

const common = {
  jurisdiction: z.string().min(2),
  taxYear: z.number().int(),
  effectiveFrom: z.iso.date(),
  effectiveTo: z.iso.date(),
  sources: z.array(sourceSchema).min(1),
  retrievedOn: z.iso.date().nullable(),
  verifiedBy: z.string().min(1).nullable(),
  verifiedOn: z.iso.date().nullable(),
  notes: z.array(z.string()).default([]),
};

export const federalRatesSchema = z.object({
  ...common,
  type: z.literal("federal"),
  method: z.literal("brackets"),
  parameters: z.object({
    standardDeduction: perStatus(z.number().nonnegative()),
    brackets: perStatus(bracketTable),
    socialSecurity: z.object({ rate: z.number(), wageBase: z.number().positive() }),
    medicare: z.object({
      rate: z.number(),
      additionalRate: z.number(),
      additionalThreshold: z.number().positive(),
    }),
  }),
});

const programSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  /** Total premium rate, 0 to 1. */
  rate: z.number().min(0).max(1),
  /** Fraction of the premium the employee pays, 0 to 1. */
  employeeShare: z.number().min(0).max(1),
  /** Annual wage cap, or null when uncapped. */
  wageCap: z.number().positive().nullable(),
});

const tierTable = z
  .array(
    z.object({
      upTo: z.number().positive().nullable(),
      base: z.number().min(0),
      rate: z.number().min(0).max(1),
    }),
  )
  .min(1)
  .superRefine((rows, ctx) => {
    rows.forEach((row, i) => {
      const last = i === rows.length - 1;
      if (last && row.upTo !== null)
        ctx.addIssue({ code: "custom", message: "last tier must have upTo null" });
      if (!last) {
        const next = rows[i + 1];
        if (row.upTo === null || (next.upTo !== null && next.upTo <= row.upTo)) {
          ctx.addIssue({ code: "custom", message: "tier limits must ascend" });
        }
      }
    });
  });

const stateCommon = { ...common, type: z.literal("state"), programs: z.array(programSchema).default([]) };

/**
 * State income-tax withholding methods. Each new method needs an engine implementation
 * (src/engine/state.ts) and golden tests from the state's official examples before its
 * data file ships.
 *  - none:   no income tax on wages
 *  - flat:   (annual wages - standard deduction - allowances * allowanceAmount) * rate
 *  - tiered: TW = annual wages - allowances * allowanceAmount, then base + (TW - tier floor) * rate
 */
export const stateRatesSchema = z.discriminatedUnion("method", [
  z.object({ ...stateCommon, method: z.literal("none"), parameters: z.object({}) }),
  z.object({
    ...stateCommon,
    method: z.literal("flat"),
    parameters: z.object({
      rate: z.number().min(0).max(1),
      standardDeduction: perStatus(z.number().nonnegative()),
      allowanceAmount: z.number().nonnegative(),
      /** Round each paycheck's withholding to the whole dollar (North Carolina). */
      roundToDollar: z.boolean(),
    }),
  }),
  z.object({
    ...stateCommon,
    method: z.literal("tiered"),
    parameters: z.object({ allowanceAmount: z.number().nonnegative(), tiers: tierTable }),
  }),
]);

export type FederalRates = z.infer<typeof federalRatesSchema>;
export type StateRates = z.infer<typeof stateRatesSchema>;
export type StateProgram = z.infer<typeof programSchema>;
export type RateFile = FederalRates | StateRates;
