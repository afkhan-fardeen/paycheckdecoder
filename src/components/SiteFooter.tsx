import { BadgeCheck, Lock, Link2 } from "lucide-react";
import Link from "next/link";
import { federalRates, lastVerifiedOn, publishableStates } from "@/lib/rates";
import { SITE_NAME, TAX_YEAR, formatLongDate } from "@/lib/site";
import { STATES } from "@/lib/states";

export function SiteFooter() {
  const codes = publishableStates();
  const verified = codes.map((c) => lastVerifiedOn(c)).filter((d): d is string => Boolean(d));
  const oldest = verified.length ? verified.sort()[0] : null;
  return (
    <footer className="site-footer">
      <div className="container">
        <ul className="footer-trust">
          <li>
            <BadgeCheck size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <b>Checked and dated</b>
              <small>
                {oldest
                  ? `Rates verified ${formatLongDate(oldest)}`
                  : "Rates are checked before they publish"}
              </small>
            </span>
          </li>
          <li>
            <Link2 size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <b>Sources linked</b>
              <small>Every rate points to its official source</small>
            </span>
          </li>
          <li>
            <Lock size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <b>Private by design</b>
              <small>Your pay never leaves your browser</small>
            </span>
          </li>
        </ul>

        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand" href="/">
              <i aria-hidden="true" />
              {SITE_NAME}
            </Link>
            <p>
              Free {TAX_YEAR} take-home pay calculators for US workers. Pick your state, see every tax line,
              and know where the numbers come from.
            </p>
          </div>
          <nav aria-label="Calculators">
            <h2>Calculators</h2>
            <ul>
              {codes.slice(0, 8).map((c) => (
                <li key={c}>
                  <Link href={`/paycheck-calculator/${STATES[c].slug}`}>{STATES[c].name}</Link>
                </li>
              ))}
              <li>
                <Link href="/paycheck-calculator">All states</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Tools">
            <h2>Tools</h2>
            <ul>
              <li>
                <Link href="/salary">Hourly to salary</Link>
              </li>
              <li>
                <Link href="/overtime-calculator">Overtime calculator</Link>
              </li>
              <li>
                <Link href="/methodology">Methodology</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Sources">
            <h2>Official sources</h2>
            <ul>
              {federalRates.sources.slice(0, 4).map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener noreferrer" target="_blank">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Company">
            <h2>Company</h2>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/disclaimer">Disclaimer</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-base">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. Estimates only. Your employer&apos;s payroll system may
            differ. Not tax advice.
          </p>
          <p>Tax year {TAX_YEAR}</p>
        </div>
      </div>
    </footer>
  );
}
