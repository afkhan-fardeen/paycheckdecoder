import { describe, expect, it } from "vitest";
import { convertHourly, grossPerPeriodFromSalary, grossPerPeriodFromHourly } from "./hourly";
import { calculateOvertime } from "./overtime";

describe("convertHourly", () => {
  it("$25 an hour, 40 hours, 52 weeks", () => {
    expect(convertHourly({ wage: 25, hoursPerWeek: 40, weeksPerYear: 52 })).toEqual({
      yearly: 5_200_000,
      monthly: 433_333,
      biweekly: 200_000,
      weekly: 100_000,
      daily: 20_000,
    });
  });
  it("rejects hours above 168", () => {
    expect(() => convertHourly({ wage: 25, hoursPerWeek: 200, weeksPerYear: 52 })).toThrow(RangeError);
  });
  it("derives gross per paycheck", () => {
    expect(grossPerPeriodFromHourly({ wage: 25, hoursPerWeek: 40, weeksPerYear: 52 }, "biweekly")).toBe(2000);
    expect(grossPerPeriodFromSalary(52000, "monthly")).toBe(4333.33);
  });
});

describe("calculateOvertime", () => {
  it("$20 an hour, 50 hours, time and a half", () => {
    const r = calculateOvertime({ wage: 20, totalHours: 50 });
    expect(r).toMatchObject({
      regularHours: 40,
      overtimeHours: 10,
      regularPay: 80_000,
      overtimePay: 30_000,
      grossPay: 110_000,
      overtimeRate: 3000,
    });
  });
  it("no overtime at or below the threshold", () => {
    expect(calculateOvertime({ wage: 20, totalHours: 38 }).overtimePay).toBe(0);
  });
  it("supports double time", () => {
    expect(calculateOvertime({ wage: 20, totalHours: 45, multiplier: 2 }).overtimePay).toBe(20_000);
  });
  it("rejects a multiplier below 1", () => {
    expect(() => calculateOvertime({ wage: 20, totalHours: 45, multiplier: 0.5 })).toThrow(RangeError);
  });
});
