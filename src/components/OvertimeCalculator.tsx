"use client";

import { useState } from "react";
import {
  breakdownSlices,
  calculateOvertime,
  calculatePaycheck,
  formatCents,
  formatPercent,
  validateOvertime,
  type FilingStatus,
} from "@/engine";
import { FILING_LABEL } from "@/lib/labels";
import { parseNumber } from "@/lib/parse";
import { federalRates, getStateRates, type StateCode } from "@/lib/rates";
import { BreakdownBar } from "./BreakdownBar";
import { Field } from "./Field";
import { Segmented } from "./Segmented";

interface Props {
  /** States whose rates are signed off. Empty hides the take-home estimate. */
  states: { code: StateCode; name: string }[];
}

export function OvertimeCalculator({ states }: Props) {
  const [wage, setWage] = useState("22.00");
  const [hours, setHours] = useState("48");
  const [threshold, setThreshold] = useState("40");
  const [multiplier, setMultiplier] = useState<"1.5" | "2">("1.5");
  const [code, setCode] = useState<StateCode | "">(states[0]?.code ?? "");
  const [filing, setFiling] = useState<FilingStatus>("single");

  const input = {
    wage: parseNumber(wage),
    totalHours: parseNumber(hours),
    threshold: parseNumber(threshold),
    multiplier: Number(multiplier),
  };
  const issues = validateOvertime(input);
  const errors = {
    wage:
      Number.isNaN(input.wage) || input.wage < 0 || input.wage > 100_000
        ? "enter a wage between $0 and $100,000."
        : undefined,
    hours:
      Number.isNaN(input.totalHours) || input.totalHours < 0 || input.totalHours > 168
        ? "enter hours between 0 and 168."
        : undefined,
    threshold:
      Number.isNaN(input.threshold) || input.threshold < 0 || input.threshold > 168
        ? "enter an overtime threshold between 0 and 168 hours."
        : undefined,
  };
  const result = issues.length === 0 ? calculateOvertime(input) : null;
  const stateName = states.find((s) => s.code === code)?.name;
  const net =
    result && code
      ? calculatePaycheck(
          { grossPerPeriod: result.grossPay / 100, frequency: "weekly", filingStatus: filing },
          { federal: federalRates, state: getStateRates(code) },
        )
      : null;

  return (
    <section className="calc" aria-label="Overtime calculator">
      <form className="pd-card" noValidate onSubmit={(e) => e.preventDefault()}>
        <h2 style={{ fontSize: 18, lineHeight: "24px", marginBottom: 16 }}>Your week</h2>
        <div className="form">
          <Field
            id="ot-wage"
            label="Hourly wage"
            prefix="$"
            suffix="/ hour"
            value={wage}
            onChange={setWage}
            error={errors.wage}
          />
          <Field
            id="ot-hours"
            label="Hours worked this week"
            value={hours}
            onChange={setHours}
            error={errors.hours}
          />
          <Field
            id="ot-threshold"
            label="Overtime starts after (hours)"
            value={threshold}
            onChange={setThreshold}
            help="The federal rule is 40 hours a week."
            error={errors.threshold}
          />
          <Segmented
            label="Overtime rate"
            value={multiplier}
            onChange={setMultiplier}
            options={[
              { value: "1.5", label: "Time and a half" },
              { value: "2", label: "Double time" },
            ]}
          />
          {states.length > 0 ? (
            <>
              <div className="pd-field">
                <label className="pd-label" htmlFor="ot-state">
                  State
                </label>
                <div className="pd-control">
                  <select id="ot-state" value={code} onChange={(e) => setCode(e.target.value as StateCode)}>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Segmented
                label="Filing status"
                value={filing}
                onChange={setFiling}
                options={(Object.keys(FILING_LABEL) as FilingStatus[]).map((value) => ({
                  value,
                  label: FILING_LABEL[value],
                }))}
              />
            </>
          ) : null}
        </div>
      </form>
      <div className="pd-card panel-result" aria-live="polite">
        {result ? (
          <>
            <div className="pd-result-label">Gross pay this week, before tax</div>
            <div className="pd-result-figure">{formatCents(result.grossPay)}</div>
            <div className="pd-result-unit">
              {result.regularHours} regular hours and {result.overtimeHours} overtime hours at{" "}
              {formatCents(result.overtimeRate)} an hour
            </div>
            <dl className="conv-grid">
              <div className="conv-cell">
                <dt>Regular pay</dt>
                <dd>{formatCents(result.regularPay)}</dd>
              </div>
              <div className="conv-cell">
                <dt>Overtime pay</dt>
                <dd>{formatCents(result.overtimePay)}</dd>
              </div>
            </dl>
            {net ? (
              <div style={{ marginTop: 24 }}>
                <div className="pd-result-label">Estimated take-home pay</div>
                <div className="pd-result-figure" style={{ fontSize: 40, lineHeight: "44px" }}>
                  {formatCents(net.lines.net.perPeriod)}
                </div>
                <div className="pd-result-unit">
                  for this week in {stateName}, {FILING_LABEL[filing].toLowerCase()}. Take-home rate{" "}
                  {formatPercent(net.takeHomeRate)}.
                </div>
                <BreakdownBar slices={breakdownSlices(net)} />
                <p className="pd-sample">
                  Assumes every week looks like this one. Estimate only. Not tax advice.
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <p>Fix the errors on the left to see your pay.</p>
        )}
      </div>
    </section>
  );
}
