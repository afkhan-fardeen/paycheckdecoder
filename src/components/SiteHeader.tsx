import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-nav">
      <Link className="brand" href="/">
        <i aria-hidden="true" />
        {SITE_NAME}
      </Link>
      <nav className="nav-links" aria-label="Main">
        <Link href="/paycheck-calculator">State calculators</Link>
        <Link className="hide-sm" href="/salary">
          Hourly to salary
        </Link>
        <Link className="hide-sm" href="/overtime-calculator">
          Overtime
        </Link>
        <Link className="hide-sm" href="/methodology">
          Methodology
        </Link>
      </nav>
    </header>
  );
}
