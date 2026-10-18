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

/**
 * State income-tax methods. Only "none" is implemented in v1; each new method
 * needs an engine implementation and golden tests before its data file ships.
 */
export const stateRatesSchema = z.object({
  ...common,
  type: z.literal("state"),
  method: z.literal("none"),
  parameters: z.object({}),
});

export type FederalRates = z.infer<typeof federalRatesSchema>;
export type StateRates = z.infer<typeof stateRatesSchema>;
export type RateFile = FederalRates | StateRates;
