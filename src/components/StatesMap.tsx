"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { formatPercent, formatWhole } from "@/engine";
import { compareStates, type CompareRow } from "@/lib/compare";
import type { UsMapGeometry } from "@/lib/us-map";
import type { StateCode } from "@/lib/rates";
import { Segmented } from "./Segmented";

const SALARIES = [40_000, 60_000, 80_000, 100_000, 150_000];
const BUCKETS = 5;
const TOTAL_STATES = 50;

type Mode = "takehome" | "type";

/** Lowest take-home rate gets bucket 0, highest gets the last bucket. Equal rates share the middle one. */
function bucketFor(rate: number, min: number, max: number) {
  if (max - min < 1e-9) return Math.floor(BUCKETS / 2);
  return Math.min(BUCKETS - 1, Math.floor(((rate - min) / (max - min)) * BUCKETS));
}

interface Props {
  geometry: UsMapGeometry;
}

/**
 * Interactive US map. Available states are real links (keyboard focusable, open in a new tab with a
 * modifier click); the rest are drawn as one inert background path. Colours come from the real engine,
 * recalculated when the salary changes. On touch screens the first tap previews a state and the second opens it.
 */
export function StatesMap({ geometry }: Props) {
  const codes = useMemo(() => geometry.states.map((s) => s.code), [geometry]);
  const [salary, setSalary] = useState(80_000);
  const [mode, setMode] = useState<Mode>("takehome");
  const [hover, setHover] = useState<StateCode | null>(null);
  const [selected, setSelected] = useState<StateCode | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; flip: boolean } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const pointerType = useRef("mouse");

  const rows = useMemo(() => compareStates(codes, salary, "single"), [codes, salary]);
  const byCode = useMemo(() => new Map(rows.map((r) => [r.code, r])), [rows]);
  const rates = rows.map((r) => r.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const best = rows[0];
  const active: CompareRow | undefined =
    (hover && byCode.get(hover)) || (selected && byCode.get(selected)) || best;
  const activeLabel = hover ? "Preview" : selected ? "Selected state" : "Highest take-home";

  function place(e: React.PointerEvent) {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return;
    const x = e.clientX - box.left;
    setTip({ x, y: e.clientY - box.top, flip: x > box.width * 0.62 });
  }

  const classFor = (r: CompareRow) =>
    mode === "takehome" ? `is-b${bucketFor(r.rate, min, max)}` : `is-type-${r.taxTone}`;

  return (
    <div className="map-block">
      <div className="map-controls">
        <Segmented
          label="Salary"
          value={String(salary)}
          onChange={(v) => setSalary(Number(v))}
          options={SALARIES.map((s) => ({ value: String(s), label: `$${s / 1000}k` }))}
        />
        <Segmented
          label="Color by"
          value={mode}
          onChange={setMode}
          options={[
            { value: "takehome", label: "Take-home pay" },
            { value: "type", label: "How the state taxes pay" },
          ]}
        />
      </div>

      <div className="map-layout">
        <div className="map-stage card-surface" ref={wrap}>
          <svg
            viewBox={geometry.viewBox}
            className="map-svg"
            role="group"
            aria-label={`Map of the United States. ${codes.length} states have calculators and are links. The rest are coming soon.`}
          >
            <path d={geometry.background} className="map-bg" />
            {geometry.states.map((s) => {
              const r = byCode.get(s.code);
              if (!r) return null;
              return (
                <Link
                  key={s.code}
                  href={`/paycheck-calculator/${r.slug}`}
                  className={`map-state ${classFor(r)}${selected === s.code ? " is-selected" : ""}`}
                  aria-label={`${r.name}: take-home ${formatWhole(r.net)} a year on ${formatWhole(salary * 100)}, ${formatPercent(r.rate)} of pay. ${r.taxLabel}. Open calculator.`}
                  onPointerDown={(e) => {
                    pointerType.current = e.pointerType;
                  }}
                  onClick={(e) => {
                    // Touch: first tap previews, second tap opens. Mouse and keyboard open straight away.
                    if (pointerType.current === "touch" && selected !== s.code) {
                      e.preventDefault();
                      setSelected(s.code);
                    }
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "touch") setHover(s.code);
                  }}
                  onPointerMove={(e) => e.pointerType !== "touch" && place(e)}
                  onPointerLeave={() => {
                    setHover(null);
                    setTip(null);
                  }}
                  onFocus={() => setHover(s.code)}
                  onBlur={() => setHover(null)}
                >
                  <path d={s.d} />
                </Link>
              );
            })}
            <path d={geometry.borders} className="map-borders" />
            {selected
              ? geometry.states
                  .filter((s) => s.code === selected)
                  .map((s) => <path key={s.code} d={s.d} className="map-outline" />)
              : null}
          </svg>

          {hover && tip && byCode.get(hover) ? (
            <div
              className={`map-tip${tip.flip ? " is-flip" : ""}`}
              style={{ left: tip.x, top: tip.y }}
              aria-hidden="true"
            >
              <b>{byCode.get(hover)!.name}</b>
              <span className="pd-num">
                {formatWhole(byCode.get(hover)!.net)} · {formatPercent(byCode.get(hover)!.rate)}
              </span>
            </div>
          ) : null}

          <div className="map-legend">
            {mode === "takehome" ? (
              <div className="map-scale">
                <span>{formatPercent(min)}</span>
                <span className="map-ramp" aria-hidden="true">
                  {Array.from({ length: BUCKETS }, (_, i) => (
                    <i key={i} className={`is-b${i}`} />
                  ))}
                </span>
                <span>{formatPercent(max)}</span>
                <small>of pay you keep on {formatWhole(salary * 100)}</small>
              </div>
            ) : (
              <ul className="map-types">
                <li>
                  <i className="is-type-none" aria-hidden="true" />
                  No income tax
                </li>
                <li>
                  <i className="is-type-flat" aria-hidden="true" />
                  Flat rate
                </li>
                <li>
                  <i className="is-type-graduated" aria-hidden="true" />
                  Graduated
                </li>
              </ul>
            )}
            <span className="map-soon">
              <i aria-hidden="true" />
              Coming soon
            </span>
          </div>
        </div>

        {active ? (
          <aside className="map-panel card-surface" aria-live="polite" aria-label="State details">
            <p className="eyebrow">{activeLabel}</p>
            <div className="map-panel-head">
              <h3>{active.name}</h3>
              <span className={`tax-badge is-${active.taxTone}`}>{active.taxLabel}</span>
            </div>
            <div className="map-panel-figure pd-num">{formatWhole(active.net)}</div>
            <p className="map-panel-sub">
              take-home a year on {formatWhole(salary * 100)}, single, paid every two weeks
            </p>
            <dl className="map-panel-stats">
              <div>
                <dt>You keep</dt>
                <dd className="pd-num">{formatPercent(active.rate)}</dd>
              </div>
              <div>
                <dt>Taxes a year</dt>
                <dd className="pd-num">{formatWhole(active.annualTaxes)}</dd>
              </div>
              <div>
                <dt>Versus best</dt>
                <dd className="pd-num">
                  {best.net - active.net === 0 ? "Highest" : `−${formatWhole(best.net - active.net)}`}
                </dd>
              </div>
            </dl>
            <Link className="pd-btn pd-btn-primary" href={`/paycheck-calculator/${active.slug}`}>
              Open the {active.name} calculator
              <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <p className="map-panel-note">
              {codes.length} of {TOTAL_STATES} states are live. More are added every month, in order of search
              demand.
            </p>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
