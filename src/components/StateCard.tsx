import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatPercent, formatWhole } from "@/engine";
import type { CompareRow } from "@/lib/compare";

/** A state with its real take-home figure at the reference salary. */
export function StateCard({ row, salaryLabel }: { row: CompareRow; salaryLabel: string }) {
  return (
    <Link className="state-card" href={`/paycheck-calculator/${row.slug}`}>
      <span className="state-card-top">
        <span className="state-card-name">{row.name}</span>
        <span className={`tax-badge is-${row.taxTone}`}>{row.taxLabel}</span>
      </span>
      <span className="state-card-figure pd-num">{formatWhole(row.net)}</span>
      <span className="state-card-meta">
        take-home a year on {salaryLabel} · {formatPercent(row.rate)} of pay
      </span>
      <ChevronRight className="chev" size={18} strokeWidth={1.5} aria-hidden="true" />
    </Link>
  );
}
