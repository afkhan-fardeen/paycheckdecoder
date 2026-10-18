import { describe, expect, it } from "vitest";
import { federalRates, getStateRates, hasSignOff, STATE_CODES } from "./rates";
import { federalRatesSchema } from "./rates-schema";

describe("rate files", () => {
  it("parse against the schema", () => {
    expect(federalRates.taxYear).toBe(2026);
    for (const code of STATE_CODES) {
      expect(getStateRates(code).jurisdiction).toBe(code);
    }
  });

  it("rejects unordered brackets", () => {
    const bad = structuredClone(federalRates);
    bad.parameters.brackets.single[1].upTo = 100;
    expect(federalRatesSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a last bracket with a ceiling", () => {
    const bad = structuredClone(federalRates);
    bad.parameters.brackets.single.at(-1)!.upTo = 999999;
    expect(federalRatesSchema.safeParse(bad).success).toBe(false);
  });

  it("only treats a file as signed off when verifier and date are both set", () => {
    for (const code of STATE_CODES) {
      const signed = Boolean(
        federalRates.verifiedBy &&
        federalRates.verifiedOn &&
        getStateRates(code).verifiedBy &&
        getStateRates(code).verifiedOn,
      );
      expect(hasSignOff(code)).toBe(signed);
    }
  });
});
