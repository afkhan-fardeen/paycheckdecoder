import { describe, expect, it } from "vitest";
import { DEFAULT_FORM, computeEstimate } from "./estimate";

describe("computeEstimate", () => {
  it("default form: $52,000 single, Texas, biweekly", () => {
    const { result, errors } = computeEstimate(DEFAULT_FORM, "TX");
    expect(errors).toEqual({});
    expect(result?.lines.gross.perPeriod).toBe(200000);
    expect(result?.lines.net.perPeriod).toBe(169085);
  });

  it("hourly pay converts through the yearly total", () => {
    const { result } = computeEstimate(
      { ...DEFAULT_FORM, payType: "hourly", amount: "25", hours: "40" },
      "TX",
    );
    expect(result?.lines.gross.perPeriod).toBe(200000);
  });

  it("accepts $ and commas, treats blank optionals as zero", () => {
    const { result } = computeEstimate({ ...DEFAULT_FORM, amount: "$52,000.00", preTax401k: "" }, "FL");
    expect(result?.lines.preTax401k.perPeriod).toBe(0);
  });

  it("reports field errors instead of throwing", () => {
    expect(computeEstimate({ ...DEFAULT_FORM, amount: "abc" }, "TX").errors.amount).toMatch(/salary/);
    expect(computeEstimate({ ...DEFAULT_FORM, payType: "hourly", hours: "200" }, "TX").errors.hours).toBe(
      "enter hours between 0 and 168.",
    );
    expect(computeEstimate({ ...DEFAULT_FORM, localRate: "40" }, "TX").errors.localRate).toBeTruthy();
    expect(computeEstimate({ ...DEFAULT_FORM, preTax401k: "99999" }, "TX").errors.preTax401k).toBeTruthy();
  });

  it("reports when deductions exceed pay", () => {
    const { errors, result } = computeEstimate({ ...DEFAULT_FORM, postTax: "5000" }, "TX");
    expect(result).toBeUndefined();
    expect(errors.form).toBeTruthy();
  });
});
