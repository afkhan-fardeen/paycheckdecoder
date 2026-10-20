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

const stateCommon = {
  ...common,
  type: z.literal("state"),
  programs: z.array(programSchema).default([]),
  /**
   * What a visitor-entered local rate applies to: all income-tax wages (default) or the state's taxable
   * amount after deductions (Maryland counties).
   */
  localTaxBase: z.enum(["wages", "taxable"]).default("wages"),
};

const money = z.number().nonnegative();

/** Replaces the standard deduction and low-income threshold when a filing status claims enough allowances (California). */
const allowanceTier = z.object({
  status: z.enum(["single", "married", "head"]),
  minAllowances: z.number().int().positive(),
  standardDeduction: money,
  lowIncomeExemption: money.optional(),
});

/** Linear phase-out of the standard deduction between two annual wage levels (Maine). */
const phaseOut = z.object({ from: money, to: money });

/**
 * Optional rules shared by the "flat" and "brackets" methods. Every field defaults to "off", so a state
 * file only lists what its own withholding formula uses.
 */
const rules = {
  /** Annual deduction per allowance, exemption or dependent. */
  allowanceAmount: money.default(0),
  /** Extra deduction when at least one allowance is claimed (Massachusetts: $3,400 + $1,000 each). */
  allowanceBase: money.default(0),
  /** Annual tax credit per allowance (Arkansas, California, Iowa). */
  allowanceCredit: money.default(0),
  /** Annual tax credit by filing status (Massachusetts head of household). */
  statusCredit: perStatus(money).default({ single: 0, married: 0, head: 0 }),
  /** No withholding when annual wages are at or below this (California, Maryland). */
  lowIncomeExemption: perStatus(money).default({ single: 0, married: 0, head: 0 }),
  /** The low-income rule only applies once this many allowances are claimed (Massachusetts: 1). */
  lowIncomeMinAllowances: z.number().int().nonnegative().default(0),
  allowanceTiers: z.array(allowanceTier).default([]),
  deductionPhaseOut: perStatus(phaseOut.nullable()).optional(),
  /** Deduct FICA withheld, up to this many dollars a year (Massachusetts: $2,000). */
  ficaDeductionCap: money.nullable().default(null),
  /** The state taxes 401(k) deferrals, so they stay in taxable wages for withholding (Pennsylvania, New Jersey). */
  taxRetirementContributions: z.boolean().default(false),
  /** Round the annual tax to whole dollars before credits and division (Arkansas). */
  roundAnnualTax: z.boolean().default(false),
  /** Round each paycheck's withholding to the whole dollar (North Carolina, Maine, Missouri). */
  roundToDollar: z.boolean().default(false),
};

/**
 * State income-tax withholding methods. Each new method needs an engine implementation
 * (src/engine/state.ts) and golden tests from the state's official examples before its
 * data file ships.
 *  - none:     no income tax on wages
 *  - flat:     (annual wages - deductions) * rate, less credits
 *  - brackets: bracket tables by filing status after deductions, less credits
 *  - tiered:   TW = annual wages - allowances * allowanceAmount, then base + (TW - tier floor) * rate
 */
export const stateRatesSchema = z.discriminatedUnion("method", [
  z.object({ ...stateCommon, method: z.literal("none"), parameters: z.object({}) }),
  z.object({
    ...stateCommon,
    method: z.literal("flat"),
    parameters: z.object({
      rate: z.number().min(0).max(1),
      standardDeduction: perStatus(money),
      ...rules,
    }),
  }),
  z.object({
    ...stateCommon,
    method: z.literal("brackets"),
    parameters: z.object({
      standardDeduction: perStatus(money),
      brackets: perStatus(bracketTable),
      ...rules,
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
