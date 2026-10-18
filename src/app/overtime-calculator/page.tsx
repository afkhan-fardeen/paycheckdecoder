import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContentColumns } from "@/components/ContentColumns";
import { Faq } from "@/components/Faq";
import { OvertimeCalculator } from "@/components/OvertimeCalculator";
import { publishableStates } from "@/lib/rates";
import { pageMetadata } from "@/lib/seo";
import { NOTICE } from "@/lib/site";
import { STATES } from "@/lib/states";

export const metadata = pageMetadata({
  title: "Overtime calculator",
  description:
    "Calculate time-and-a-half or double-time pay for a week with overtime, then see your estimated take-home pay.",
  path: "/overtime-calculator",
});

const FAQS = [
  {
    q: "How is overtime pay calculated?",
    a: "Hours over the weekly threshold, usually 40, are paid at a multiple of your regular wage, most often 1.5 times (time and a half). Regular hours are paid at your normal rate.",
  },
  {
    q: "Does my state have different overtime rules?",
    a: "Some states add rules, such as daily overtime. This calculator uses a weekly threshold you can change, so set it to match your employer's policy.",
  },
  {
    q: "Is overtime taxed at a higher rate?",
    a: "Overtime is taxed like other wages. It can feel heavier because the extra pay lifts your income into higher brackets, but there is no special overtime tax rate.",
  },
];

export default function OvertimePage() {
  const states = publishableStates().map((code) => ({ code, name: STATES[code].name }));
  return (
    <main className="wrap">
      <header className="block" style={{ gap: 12 }}>
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Overtime calculator", href: "/overtime-calculator" },
          ]}
        />
        <h1>Overtime calculator</h1>
        <p className="lead">
          Enter your wage and hours to see regular pay, overtime pay and your estimated take-home for the
          week.
        </p>
      </header>
      <OvertimeCalculator states={states} />
      <ContentColumns>
        <Faq items={FAQS} />
        <div className="pd-stamp">{NOTICE}</div>
      </ContentColumns>
    </main>
  );
}
