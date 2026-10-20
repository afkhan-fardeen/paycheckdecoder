"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { formatPercent, formatWhole } from "@/engine";
import { CURVE_MAX, CURVE_MIN, CURVE_STEP, type CurvePoint } from "@/lib/compare";

/**
 * Two drawings of the same chart. SVG text scales with the drawing, so a phone gets a narrower one
 * (about 1:1 with its pixels) instead of a shrunken desktop drawing with unreadable labels.
 */
const WIDE = {
  W: 720,
  H: 320,
  M: { l: 58, r: 78, t: 16, b: 38 },
  xTicks: [20_000, 60_000, 100_000, 140_000, 180_000],
};
const NARROW = { W: 360, H: 300, M: { l: 48, r: 74, t: 14, b: 34 }, xTicks: [20_000, 100_000, 180_000] };
const NARROW_QUERY = "(max-width: 640px)";
const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia(NARROW_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const Y_TICKS = [0, 50_000, 100_000, 150_000, 200_000];
const k = (v: number) => (v === 0 ? "$0" : `$${v / 1000}k`);
const usd = (dollars: number) => formatWhole(dollars * 100);

interface Props {
  points: CurvePoint[];
  stateName: string;
  /** Salary highlighted first. */
  initial?: number;
}

/**
 * Take-home against salary for one state. Drag the slider (or the chart) to read any salary.
 * The slider is a real range input, so keyboard and touch work with no custom code.
 */
export function TakeHomeChart({ points, stateName, initial = 50_000 }: Props) {
  const [salary, setSalary] = useState(initial);
  const id = useId();
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
  const { W, H, M, xTicks } = narrow ? NARROW : WIDE;
  const sx = (v: number) => M.l + ((v - CURVE_MIN) / (CURVE_MAX - CURVE_MIN)) * (W - M.l - M.r);
  const sy = (v: number) => H - M.b - (v / CURVE_MAX) * (H - M.t - M.b);
  const net = points.map((p) => `${sx(p.salary).toFixed(1)},${sy(p.net).toFixed(1)}`);
  const gross = points.map((p) => `${sx(p.salary).toFixed(1)},${sy(p.salary).toFixed(1)}`);
  const gap = [...gross, ...[...net].reverse()].join(" ");
  const cur = points.find((p) => p.salary === salary) ?? points[0];

  function fromPointer(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const raw = CURVE_MIN + ((x - M.l) / (W - M.l - M.r)) * (CURVE_MAX - CURVE_MIN);
    const snapped = Math.round(raw / CURVE_STEP) * CURVE_STEP;
    setSalary(Math.min(CURVE_MAX, Math.max(CURVE_MIN, snapped)));
  }

  return (
    <figure className="chart card-surface">
      <figcaption className="chart-head">
        <span className="chart-title">Take-home pay by salary in {stateName}</span>
        <span className="chart-sub">Single filer, paid every two weeks, no deductions</span>
      </figcaption>

      <dl className="chart-readout" aria-live="polite">
        <div>
          <dt>Salary</dt>
          <dd className="pd-num">{usd(cur.salary)}</dd>
        </div>
        <div>
          <dt>Take-home</dt>
          <dd className="pd-num is-net">{usd(cur.net)}</dd>
        </div>
        <div>
          <dt>Taxes</dt>
          <dd className="pd-num">{usd(cur.taxes)}</dd>
        </div>
        <div>
          <dt>Take-home rate</dt>
          <dd className="pd-num">{formatPercent(cur.rate)}</dd>
        </div>
      </dl>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        role="img"
        aria-label={`Line chart of annual take-home pay against salary in ${stateName}, from ${usd(points[0].salary)} to ${usd(points.at(-1)!.salary)}. Use the slider below to read a value.`}
        onPointerMove={fromPointer}
        onPointerDown={fromPointer}
      >
        {Y_TICKS.map((v) => (
          <g key={v}>
            <line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} className="chart-grid" />
            <text x={M.l - 10} y={sy(v) + 4} textAnchor="end" className="chart-tick">
              {k(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={v} x={sx(v)} y={H - 12} textAnchor="middle" className="chart-tick">
            {k(v)}
          </text>
        ))}
        <polygon points={gap} className="chart-gap" />
        <polyline points={gross.join(" ")} className="chart-gross" fill="none" />
        <polyline points={net.join(" ")} className="chart-net" fill="none" />
        <text x={sx(CURVE_MAX) + 8} y={sy(CURVE_MAX) + 4} className="chart-label">
          Gross pay
        </text>
        <text x={sx(CURVE_MAX) + 8} y={sy(points.at(-1)!.net) + 4} className="chart-label is-net">
          Take-home
        </text>
        <line x1={sx(cur.salary)} x2={sx(cur.salary)} y1={M.t} y2={H - M.b} className="chart-cursor" />
        <circle cx={sx(cur.salary)} cy={sy(cur.salary)} r={4.5} className="chart-dot is-gross" />
        <circle cx={sx(cur.salary)} cy={sy(cur.net)} r={5.5} className="chart-dot is-net" />
      </svg>

      <div className="chart-slider">
        <label htmlFor={`${id}-range`}>Salary</label>
        <input
          id={`${id}-range`}
          type="range"
          min={CURVE_MIN}
          max={CURVE_MAX}
          step={CURVE_STEP}
          value={salary}
          onChange={(e) => setSalary(Number(e.target.value))}
          aria-valuetext={`${usd(cur.salary)} salary, ${usd(cur.net)} take-home`}
        />
      </div>

      <details className="chart-data">
        <summary>View the data as a table</summary>
        <div className="table-scroll">
          <table className="pd-table">
            <caption className="sr-only">Take-home pay by salary in {stateName}</caption>
            <thead>
              <tr>
                <th scope="col">Salary</th>
                <th scope="col" className="pd-n">
                  Take-home
                </th>
                <th scope="col" className="pd-n">
                  Taxes
                </th>
                <th scope="col" className="pd-n">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {points
                .filter((p) => p.salary % 20_000 === 0 || p.salary === CURVE_MIN)
                .map((p) => (
                  <tr key={p.salary}>
                    <th scope="row">{usd(p.salary)}</th>
                    <td className="pd-n">{usd(p.net)}</td>
                    <td className="pd-n">{usd(p.taxes)}</td>
                    <td className="pd-n">{formatPercent(p.rate)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
