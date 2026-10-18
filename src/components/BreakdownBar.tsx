import { formatCents, formatPercent, type Slice, type SliceKey } from "@/engine";

const CLASS: Record<SliceKey, string> = {
  net: "is-net",
  federal: "is-federal",
  social: "is-social",
  medicare: "is-medicare",
  state: "is-state",
  deductions: "is-deductions",
};

/** The signature graphic: plain HTML and CSS, with every slice named in the legend. */
export function BreakdownBar({ slices }: { slices: Slice[] }) {
  const visible = slices.filter((s) => s.perPeriod > 0);
  return (
    <>
      <div className="pd-bar" aria-hidden="true">
        {visible.map((s) => (
          <span key={s.key} className={CLASS[s.key]} style={{ width: `${(s.share * 100).toFixed(2)}%` }} />
        ))}
      </div>
      <ul className="pd-legend pd-num">
        {visible.map((s) => (
          <li key={s.key}>
            <i className={`pd-key ${CLASS[s.key]}`} aria-hidden="true" />
            <span>{s.label}</span>
            <span className="pd-amt">{formatCents(s.perPeriod)}</span>
            <span className="pd-share">{formatPercent(s.share)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
