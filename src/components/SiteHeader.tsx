import Link from "next/link";
import { publishableStates } from "@/lib/rates";
import { SITE_NAME } from "@/lib/site";
import { STATES } from "@/lib/states";
import { CalculatorsMenu } from "./CalculatorsMenu";
import { MobileNav } from "./MobileNav";
import { SearchButton } from "./SearchButton";

export function SiteHeader() {
  const states = publishableStates()
    .slice(0, 12)
    .map((c) => ({
      name: STATES[c].name,
      slug: STATES[c].slug,
      tagline: STATES[c].tagline,
    }));
  return (
    <header className="site-header">
      <div className="container header-in">
        <Link className="brand" href="/">
          <i aria-hidden="true" />
          {SITE_NAME}
        </Link>
        <nav className="header-nav" aria-label="Main">
          <CalculatorsMenu states={states} />
          <Link className="nav-link" href="/salary">
            Hourly to salary
          </Link>
          <Link className="nav-link" href="/overtime-calculator">
            Overtime
          </Link>
          <Link className="nav-link" href="/methodology">
            Methodology
          </Link>
        </nav>
        <div className="header-actions">
          <div className="only-desktop">
            <SearchButton variant="bar" placeholder="Search" />
          </div>
          <div className="only-mobile">
            <SearchButton variant="icon" />
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
