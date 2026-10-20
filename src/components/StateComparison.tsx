"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPercent, formatWhole, type FilingStatus } from "@/engine";
import { compareStates } from "@/lib/compare";
import type { StateCode } from "@/lib/rates";
import { Segmented } from "./Segmented";

const SALARIES = [40_000, 60_000, 80_000, 100_000, 150_000];
const LEGEND = [
  ["net", "Take-home"],
  ["federal", "Federal income tax"],
  ["social", "Social Security"],
  ["medicare", "Medicare"],
  ["state", "State and local"],
] as const;

/** Stacked bars: where the same salary goes in each state. Real engine numbers, updated live. */
export function StateComparison({ codes }: { codes: StateCode[] }) {
  const [salary, setSalary] = useState(80_000);
  const [filing, setFiling] = useState<FilingStatus>("single");
  const rows = useMemo(() => compareStates(codes, salary, filing), [codes, salary, filing]);
  const best = rows[0];
  const worst = rows[rows.length - 1];
  const gap = best && worst ? best.net - worst.net : 0;

  return (
    <div className="cmp card-surface">
      <div className="cmp-controls">
        <Segmented
          label="Salary"
          value={String(salary)}
          onChange={(v) => setSalary(Number(v))}
          options={SALARIES.map((s) => ({ value: String(s), label: `$${s / 1000}k` }))}
        />
        <Segmented
          label="Filing status"
          value={filing}
          onChange={(v) => setFiling(v === "married" ? "married" : "single")}
          options={[
            { value: "single", label: "Single" },
            { value: "married", label: "Married" },
          ]}
        />
      </div>

      <ul className="cmp-legend" aria-label="Chart key">
        {LEGEND.map(([key, label]) => (
          <li key={key}>
            <i className={`pd-key is-${key}`} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>

      <ol
        className="cmp-list"
        aria-label={`Take-home pay on ${formatWhole(salary * 100)} by state, highest first`}
      >
        {rows.map((r) => (
          <li key={r.code}>
            <Link
              className="cmp-row"
              href={`/paycheck-calculator/${r.slug}`}
              aria-label={`${r.name}: take-home ${formatWhole(r.net)} a year, ${formatPercent(r.rate)} of pay`}
            >
              <span className="cmp-name">{r.name}</span>
              <span className="pd-bar cmp-bar" aria-hidden="true">
                {r.slices
                  .filter((s) => s.perPeriod > 0 && s.key !== "deductions")
                  .map((s) => (
                    <span
                      key={s.key}
                      className={`is-${s.key}`}
                      style={{ width: `${(s.share * 100).toFixed(2)}%` }}
                    />
                  ))}
              </span>
              <span className="cmp-values pd-num">
                <b>{formatWhole(r.net)}</b>
                <small>{formatPercent(r.rate)}</small>
              </span>
              <ChevronRight className="chev" size={16} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>

      {best && worst && gap > 0 ? (
        <p className="cmp-note" role="status">
          On {formatWhole(salary * 100)}, {best.name} keeps {formatWhole(gap)} a year more than {worst.name}.
          Single or married, paid every two weeks, no deductions.
        </p>
      ) : null}
    </div>
  );
}
