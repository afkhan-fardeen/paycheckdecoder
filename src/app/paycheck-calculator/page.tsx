import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatePicker } from "@/components/StatePicker";
import { publishableStates } from "@/lib/rates";
import { pageMetadata } from "@/lib/seo";
import { TAX_YEAR } from "@/lib/site";

export const metadata = pageMetadata({
  title: `State paycheck calculators ${TAX_YEAR}`,
  description: `Pick your state to estimate take-home pay after federal tax, Social Security, Medicare and state tax for ${TAX_YEAR}.`,
  path: "/paycheck-calculator",
});

export default function StateIndexPage() {
  const codes = publishableStates();
  return (
    <main className="wrap">
      <header className="block" style={{ gap: 12 }}>
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
      {codes.length > 0 ? (
        <StatePicker codes={codes} />
      ) : (
        <p className="pd-answer">State calculators open once their rates have been checked.</p>
      )}
      <p style={{ color: "var(--ink-muted)", maxWidth: 640 }}>
        More states are added a few at a time. Each one is published only after its tax rates have been
        checked against the state&apos;s official source.
      </p>
    </main>
  );
}
