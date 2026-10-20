"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { CompareRow } from "@/lib/compare";
import type { TaxTypeTone } from "@/lib/state-methods";
import { StateCard } from "./StateCard";

const FILTERS: { value: "all" | TaxTypeTone; label: string }[] = [
  { value: "all", label: "All" },
  { value: "none", label: "No income tax" },
  { value: "flat", label: "Flat rate" },
  { value: "graduated", label: "Graduated" },
];

/** Searchable, filterable grid of state cards for the state index page. */
export function StateExplorer({ rows, salaryLabel }: { rows: CompareRow[]; salaryLabel: string }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | TaxTypeTone>("all");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "all" || r.taxTone === filter) &&
        (!needle || r.name.toLowerCase().includes(needle) || r.code.toLowerCase() === needle),
    );
  }, [rows, q, filter]);

  return (
    <div className="explorer">
      <div className="explorer-bar">
        <label className="field-search">
          <span className="sr-only">Filter states</span>
          <Search size={18} strokeWidth={1.5} aria-hidden="true" />
          <input
            type="search"
            placeholder="Filter states"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
          />
        </label>
        <div
          className="pd-seg filter-seg"
          data-n={FILTERS.length}
          role="radiogroup"
          aria-label="Filter by how the state taxes wages"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <p className="explorer-count" role="status">
        Showing {shown.length} of {rows.length} states
      </p>
      {shown.length > 0 ? (
        <div className="card-grid wide">
          {shown.map((r) => (
            <StateCard key={r.code} row={r} salaryLabel={salaryLabel} />
          ))}
        </div>
      ) : (
        <p className="pd-answer">No states match. Clear the filter to see all of them.</p>
      )}
    </div>
  );
}
