"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { breakdownSlices, formatCents, formatPercent, formatWhole, type FilingStatus } from "@/engine";
import { DEFAULT_FORM, computeEstimate } from "@/lib/estimate";
import { FILING_LABEL } from "@/lib/labels";
import type { StateCode } from "@/lib/rates";
import { BreakdownBar } from "./BreakdownBar";
import { Field } from "./Field";
import { Segmented } from "./Segmented";

interface Props {
  states: { code: StateCode; name: string; slug: string }[];
}

/** Hero calculator: one card, inputs on top and the live result underneath. The full calculator lives on each state page. */
export function QuickCalculator({ states }: Props) {
  const [salary, setSalary] = useState("65,000");
  const [code, setCode] = useState<StateCode>(states[0].code);
  const [filing, setFiling] = useState<FilingStatus>("single");

  const est = computeEstimate({ ...DEFAULT_FORM, amount: salary, filingStatus: filing }, code);
  const state = states.find((s) => s.code === code)!;
  const result = est.result;

  return (
    <div className="quick card-surface">
      <form noValidate onSubmit={(e) => e.preventDefault()} className="quick-form">
        <h2 className="quick-title">Estimate your take-home pay</h2>
        <div className="quick-fields">
          <Field
            id="q-salary"
            label="Salary per year"
            prefix="$"
            value={salary}
            onChange={setSalary}
            error={est.errors.amount}
          />
          <div className="pd-field">
            <label className="pd-label" htmlFor="q-state">
              State
            </label>
            <div className="pd-control">
              <select id="q-state" value={code} onChange={(e) => setCode(e.target.value as StateCode)}>
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
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
      </form>

      <div className="quick-result" aria-live="polite">
        {result ? (
          <>
            <div className="quick-figure-row">
              <div>
                <div className="pd-result-label">Estimated take-home pay</div>
                <div className="pd-result-figure">{formatWhole(result.lines.net.annual)}</div>
                <div className="pd-result-unit">
                  a year in {state.name}, {FILING_LABEL[filing].toLowerCase()}
                </div>
              </div>
              <dl className="quick-mini">
                <div>
                  <dt>Every two weeks</dt>
                  <dd className="pd-num">{formatCents(result.lines.net.perPeriod)}</dd>
                </div>
                <div>
                  <dt>Take-home rate</dt>
                  <dd className="pd-num">{formatPercent(result.takeHomeRate)}</dd>
                </div>
              </dl>
            </div>
            <BreakdownBar slices={breakdownSlices(result)} />
          </>
        ) : (
          <p>Fix the error in the form to see your estimate.</p>
        )}
      </div>

      <div className="quick-foot">
        <Link className="pd-btn pd-btn-primary" href={`/paycheck-calculator/${state.slug}`}>
          Open the full {state.name} calculator
          <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
        </Link>
        <p>Estimate only. Not tax advice.</p>
      </div>
    </div>
  );
}
