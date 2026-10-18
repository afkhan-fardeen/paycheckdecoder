"use client";

import { useState } from "react";
import { convertHourly, formatCents, formatWhole, validateHourly } from "@/engine";
import { parseNumber } from "@/lib/parse";
import { Field } from "./Field";

export function HourlyConverter({ initialWage }: { initialWage: number }) {
  const [wage, setWage] = useState(initialWage.toFixed(2));
  const [hours, setHours] = useState("40");
  const [weeks, setWeeks] = useState("52");

  const input = {
    wage: parseNumber(wage),
    hoursPerWeek: parseNumber(hours),
    weeksPerYear: parseNumber(weeks),
  };
  const errors = {
    wage:
      Number.isNaN(input.wage) || input.wage < 0 || input.wage > 100_000
        ? "enter a wage between $0 and $100,000."
        : undefined,
    hours:
      Number.isNaN(input.hoursPerWeek) || input.hoursPerWeek < 0 || input.hoursPerWeek > 168
        ? "enter hours between 0 and 168."
        : undefined,
    weeks:
      Number.isNaN(input.weeksPerYear) || input.weeksPerYear < 0 || input.weeksPerYear > 52
        ? "enter weeks between 0 and 52."
        : undefined,
  };
  const valid = !errors.wage && !errors.hours && !errors.weeks && validateHourly(input).length === 0;
  const result = valid ? convertHourly(input) : null;

  return (
    <section className="calc" aria-label="Converter">
      <form className="pd-card" noValidate onSubmit={(e) => e.preventDefault()}>
        <h2 style={{ fontSize: 18, lineHeight: "24px", marginBottom: 16 }}>Your wage</h2>
        <div className="form">
          <Field
            id="wage"
            label="Hourly wage"
            prefix="$"
            suffix="/ hour"
            value={wage}
            onChange={setWage}
            error={errors.wage}
          />
          <div className="form two">
            <Field id="hpw" label="Hours per week" value={hours} onChange={setHours} error={errors.hours} />
            <Field id="wpy" label="Weeks per year" value={weeks} onChange={setWeeks} error={errors.weeks} />
          </div>
        </div>
      </form>
      <div className="pd-card panel-result" aria-live="polite">
        {result ? (
          <>
            <div className="pd-result-label">Estimated yearly pay before tax</div>
            <div className="pd-result-figure">{formatWhole(result.yearly)}</div>
            <div className="pd-result-unit">
              {formatCents(Math.round(input.wage * 100))} × {input.hoursPerWeek} hours × {input.weeksPerYear}{" "}
              weeks
            </div>
            <dl className="conv-grid">
              <div className="conv-cell">
                <dt>Monthly</dt>
                <dd>{formatCents(result.monthly)}</dd>
              </div>
              <div className="conv-cell">
                <dt>Every two weeks</dt>
                <dd>{formatCents(result.biweekly)}</dd>
              </div>
              <div className="conv-cell">
                <dt>Weekly</dt>
                <dd>{formatCents(result.weekly)}</dd>
              </div>
              <div className="conv-cell">
                <dt>Daily (8 hours)</dt>
                <dd>{formatCents(result.daily)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p>Fix the errors on the left to see your yearly pay.</p>
        )}
      </div>
    </section>
  );
}
