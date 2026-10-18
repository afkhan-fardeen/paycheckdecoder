"use client";

import { useEffect, useMemo, useState } from "react";
import { breakdownSlices, formatCents, formatPercent, formatWhole } from "@/engine";
import { DEFAULT_FORM, computeEstimate, type FormState } from "@/lib/estimate";
import { FILING_LABEL, FREQUENCY_LABEL, FREQUENCY_PER } from "@/lib/labels";
import { getStateRates, type StateCode } from "@/lib/rates";
import { stateTableNote } from "@/lib/state-methods";
import { BreakdownBar } from "./BreakdownBar";
import { BreakdownTable } from "./BreakdownTable";
import { Field } from "./Field";
import { Segmented } from "./Segmented";
import { VerifiedStamp } from "./VerifiedStamp";

const APPLY_DELAY_MS = 500;

interface Props {
  code: StateCode;
  stateName: string;
  /** Label for the state allowance field. Omitted when the state has none. */
  allowanceLabel?: string;
}

export function Calculator({ code, stateName, allowanceLabel }: Props) {
  const stateRates = getStateRates(code);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [applied, setApplied] = useState<FormState>(DEFAULT_FORM);

  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  // The result updates on Calculate, or shortly after the visitor stops typing.
  useEffect(() => {
    if (form === applied) return;
    const t = setTimeout(() => setApplied(form), APPLY_DELAY_MS);
    return () => clearTimeout(t);
  }, [form, applied]);

  const live = useMemo(() => computeEstimate(form, code), [form, code]);
  const shown = useMemo(() => computeEstimate(applied, code), [applied, code]);
  const { result } = shown;
  const errors = live.errors;
  const hourly = form.payType === "hourly";

  return (
    <>
      <section className="calc" aria-label="Calculator">
        <form
          className="pd-card"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(form);
          }}
        >
          <h2 style={{ fontSize: 18, lineHeight: "24px", marginBottom: 16 }}>Your pay</h2>
          <div className="form">
            <Segmented
              label="Pay type"
              value={form.payType}
              onChange={set("payType")}
              options={[
                { value: "salary", label: "Salary" },
                { value: "hourly", label: "Hourly" },
              ]}
            />
            <Field
              id="amount"
              label={hourly ? "Hourly wage" : "Salary per year"}
              prefix="$"
              suffix={hourly ? "/ hour" : undefined}
              value={form.amount}
              onChange={set("amount")}
              error={errors.amount}
            />
            {hourly ? (
              <Field
                id="hours"
                label="Hours per week"
                value={form.hours}
                onChange={set("hours")}
                error={errors.hours}
              />
            ) : null}
            <Segmented
              label="Pay frequency"
              value={form.frequency}
              onChange={set("frequency")}
              options={(Object.keys(FREQUENCY_LABEL) as (keyof typeof FREQUENCY_LABEL)[]).map((value) => ({
                value,
                label: FREQUENCY_LABEL[value],
              }))}
            />
            <Segmented
              label="Filing status"
              value={form.filingStatus}
              onChange={set("filingStatus")}
              options={(Object.keys(FILING_LABEL) as (keyof typeof FILING_LABEL)[]).map((value) => ({
                value,
                label: FILING_LABEL[value],
              }))}
            />
            <Field
              id="preTax401k"
              label="Traditional 401(k) per paycheck"
              prefix="$"
              value={form.preTax401k}
              onChange={set("preTax401k")}
              placeholder="0.00"
              error={errors.preTax401k}
            />
            <Field
              id="preTaxHealth"
              label="Health insurance and HSA per paycheck"
              prefix="$"
              value={form.preTaxHealth}
              onChange={set("preTaxHealth")}
              placeholder="0.00"
              help="Premiums taken before tax."
              error={errors.preTaxHealth}
            />
            <Field
              id="postTax"
              label="After-tax deductions per paycheck"
              prefix="$"
              value={form.postTax}
              onChange={set("postTax")}
              placeholder="0.00"
              error={errors.postTax}
            />
            {allowanceLabel ? (
              <Field
                id="stateAllowances"
                label={allowanceLabel}
                value={form.stateAllowances}
                onChange={set("stateAllowances")}
                placeholder="0"
                help="The number on your state form. Leave 0 if unsure."
                error={errors.stateAllowances}
              />
            ) : null}
            <Field
              id="localRate"
              label="Local income tax rate (optional)"
              suffix="%"
              value={form.localRate}
              onChange={set("localRate")}
              placeholder="0"
              help="Only if your city or county taxes wages."
              error={errors.localRate}
            />
            <details className="pd-details">
              <summary>Advanced: Form W-4 details</summary>
              <div className="form">
                <Field
                  id="credits"
                  label="Credits for dependents per year (step 3)"
                  prefix="$"
                  value={form.credits}
                  onChange={set("credits")}
                  placeholder="0"
                  error={errors.credits}
                />
                <Field
                  id="otherIncome"
                  label="Other income per year (step 4a)"
                  prefix="$"
                  value={form.otherIncome}
                  onChange={set("otherIncome")}
                  placeholder="0"
                  error={errors.otherIncome}
                />
                <Field
                  id="deductions"
                  label="Extra deductions per year (step 4b)"
                  prefix="$"
                  value={form.deductions}
                  onChange={set("deductions")}
                  placeholder="0"
                  error={errors.deductions}
                />
                <Field
                  id="extra"
                  label="Extra withholding per paycheck (step 4c)"
                  prefix="$"
                  value={form.extra}
                  onChange={set("extra")}
                  placeholder="0.00"
                  error={errors.extra}
                />
              </div>
            </details>
            {errors.form ? (
              <div className="pd-error" role="alert">
                <b>Error:</b> {errors.form}
              </div>
            ) : null}
          </div>
          <div className="actions">
            <button type="submit" className="pd-btn pd-btn-primary">
              Calculate
            </button>
            <button
              type="button"
              className="pd-btn pd-btn-secondary"
              onClick={() => {
                setForm(DEFAULT_FORM);
                setApplied(DEFAULT_FORM);
              }}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="pd-card panel-result" aria-live="polite">
          {result ? (
            <>
              <div className="pd-result-label">Estimated take-home pay</div>
              <div className="pd-result-figure">{formatCents(result.lines.net.perPeriod)}</div>
              <div className="pd-result-unit">
                {FREQUENCY_PER[applied.frequency]}, {stateName},{" "}
                {FILING_LABEL[applied.filingStatus].toLowerCase()}. About{" "}
                {formatWhole(result.lines.net.annual)} a year.
              </div>
              <dl className="pd-result-stats">
                <div className="pd-stat">
                  <dt>Gross</dt>
                  <dd>{formatCents(result.lines.gross.perPeriod)}</dd>
                </div>
                <div className="pd-stat">
                  <dt>Total taxes</dt>
                  <dd>{formatCents(result.totalTaxes.perPeriod)}</dd>
                </div>
                <div className="pd-stat">
                  <dt>Take-home rate</dt>
                  <dd>{formatPercent(result.takeHomeRate)}</dd>
                </div>
              </dl>
              <BreakdownBar slices={breakdownSlices(result)} />
            </>
          ) : (
            <p>Fix the errors on the left to see your estimate.</p>
          )}
          <div style={{ marginTop: 20 }}>
            <VerifiedStamp code={code} />
          </div>
        </div>
      </section>

      {result ? (
        <section className="pd-card" aria-label="Paycheck breakdown table">
          <BreakdownTable
            result={result}
            stateNote={stateTableNote(stateName, stateRates)}
            programNames={stateRates.programs.map((p) => p.name)}
            frequencyLabel={FREQUENCY_LABEL[applied.frequency].toLowerCase()}
          />
        </section>
      ) : null}
    </>
  );
}
