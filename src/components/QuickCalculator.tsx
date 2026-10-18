"use client";

import Link from "next/link";
import { useState } from "react";
import { breakdownSlices, formatCents, formatWhole, type FilingStatus } from "@/engine";
import { DEFAULT_FORM, computeEstimate } from "@/lib/estimate";
import { FILING_LABEL } from "@/lib/labels";
import type { StateCode } from "@/lib/rates";
import { BreakdownBar } from "./BreakdownBar";
import { Field } from "./Field";
import { Segmented } from "./Segmented";

interface Props {
  states: { code: StateCode; name: string; slug: string }[];
}

/** Home page calculator: salary, state and filing status. The full calculator lives on each state page. */
export function QuickCalculator({ states }: Props) {
  const [salary, setSalary] = useState("52,000");
  const [code, setCode] = useState<StateCode>(states[0].code);
  const [filing, setFiling] = useState<FilingStatus>("single");

  const est = computeEstimate({ ...DEFAULT_FORM, amount: salary, filingStatus: filing }, code);
  const state = states.find((s) => s.code === code)!;
  const result = est.result;

  return (
    <section className="calc" aria-label="Quick calculator">
      <form className="pd-card" noValidate onSubmit={(e) => e.preventDefault()}>
        <h2 style={{ fontSize: 18, lineHeight: "24px", marginBottom: 16 }}>Your pay</h2>
        <div className="form">
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
          <Segmented
            label="Filing status"
            value={filing}
            onChange={setFiling}
            options={(Object.keys(FILING_LABEL) as FilingStatus[]).map((value) => ({
              value,
              label: FILING_LABEL[value],
            }))}
          />
        </div>
        <div className="actions" style={{ marginTop: 20 }}>
          <Link
            className="pd-btn pd-btn-primary"
            href={`/paycheck-calculator/${state.slug}`}
            style={{ textDecoration: "none" }}
          >
            Open the {state.name} calculator
          </Link>
        </div>
      </form>
      <div className="pd-card panel-result" aria-live="polite">
        {result ? (
          <>
            <div className="pd-result-label">Estimated take-home pay</div>
            <div className="pd-result-figure">{formatWhole(result.lines.net.annual)}</div>
            <div className="pd-result-unit">
              per year in {state.name}, {FILING_LABEL[filing].toLowerCase()} (about{" "}
              {formatCents(result.lines.net.perPeriod)} every two weeks)
            </div>
            <div style={{ marginTop: 24 }}>
              <BreakdownBar slices={breakdownSlices(result)} />
            </div>
            <p className="pd-sample">Estimate only. Not tax advice.</p>
          </>
        ) : (
          <p>Fix the error on the left to see your estimate.</p>
        )}
      </div>
    </section>
  );
}
