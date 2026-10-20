import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StateExplorer } from "@/components/StateExplorer";
import { formatWhole } from "@/engine";
import { compareStates } from "@/lib/compare";
import { publishableStates } from "@/lib/rates";
import { pageMetadata } from "@/lib/seo";
import { TAX_YEAR } from "@/lib/site";

export const metadata = pageMetadata({
  title: `State paycheck calculators ${TAX_YEAR}`,
  description: `Pick your state to estimate take-home pay after federal tax, Social Security, Medicare and state tax for ${TAX_YEAR}.`,
  path: "/paycheck-calculator",
});

const REFERENCE_SALARY = 65_000;

export default function StateIndexPage() {
  const codes = publishableStates();
  const rows = compareStates(codes, REFERENCE_SALARY, "single");
  return (
    <main className="wrap">
      <header className="page-head">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "State calculators", href: "/paycheck-calculator" },
          ]}
        />
        <h1>State paycheck calculators</h1>
        <p className="lead">
          Choose your state. Each calculator uses that state&apos;s withholding rules and shows its sources
          and the date its rates were last verified.
        </p>
      </header>
      {rows.length > 0 ? (
        <StateExplorer rows={rows} salaryLabel={formatWhole(REFERENCE_SALARY * 100)} />
      ) : (
        <p className="pd-answer">State calculators open once their rates have been checked.</p>
      )}
      <p className="muted-note">
        More states are added a few at a time. Each one is published only after its tax rates have been
        checked against the state&apos;s official source.
      </p>
    </main>
  );
}
