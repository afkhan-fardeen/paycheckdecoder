import { ExternalLink, ListTree, Scale, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatWhole } from "@/engine";
import type { CompareRow } from "@/lib/compare";
import { sourcesFor, type StateCode } from "@/lib/rates";
import { formatLongDate } from "@/lib/site";

interface Props {
  code: StateCode;
  stateName: string;
  /** Other states to compare with, best take-home first. */
  nearby: CompareRow[];
  salaryLabel: string;
  verifiedOn: string | null;
  signed: boolean;
  sections: { href: string; label: string }[];
}

/** Right-hand column of a state page: where to jump, how it compares, and where the numbers come from. */
export function StateRail({ code, stateName, nearby, salaryLabel, verifiedOn, signed, sections }: Props) {
  return (
    <>
      <nav className="rail-card" aria-label="On this page">
        <h2 className="rail-title">
          <ListTree size={16} strokeWidth={1.5} aria-hidden="true" />
          On this page
        </h2>
        <ul className="rail-links">
          {sections.map((s) => (
            <li key={s.href}>
              <a href={s.href}>{s.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      {nearby.length > 0 ? (
        <section className="rail-card" aria-labelledby="rail-compare">
          <h2 className="rail-title" id="rail-compare">
            <Scale size={16} strokeWidth={1.5} aria-hidden="true" />
            Compare with other states
          </h2>
          <p className="rail-note">Take-home a year on {salaryLabel}, single.</p>
          <ul className="rail-list">
            {nearby.map((r) => (
              <li key={r.code}>
                <Link href={`/paycheck-calculator/${r.slug}`}>
                  <span>{r.name}</span>
                  <b className="pd-num">{formatWhole(r.net)}</b>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="rail-more" href="/paycheck-calculator">
            See all states
          </Link>
        </section>
      ) : null}

      <section className="rail-card" aria-labelledby="rail-sources">
        <h2 className="rail-title" id="rail-sources">
          <ShieldCheck size={16} strokeWidth={1.5} aria-hidden="true" />
          Sources for {stateName}
        </h2>
        <p className="rail-note">
          {signed && verifiedOn
            ? `Rates verified ${formatLongDate(verifiedOn)}.`
            : "Rates not signed off yet."}
        </p>
        <ul className="rail-list sources">
          {sourcesFor(code).map((s) => (
            <li key={s.url}>
              <a href={s.url} rel="noopener noreferrer" target="_blank">
                <span>{s.name}</span>
                <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
