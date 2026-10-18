import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { formatWhole } from "@/engine";
import { federalRates, getStateRates, isVerified, publishableStates } from "@/lib/rates";
import { describeStateRules } from "@/lib/state-methods";
import { STATES } from "@/lib/states";
import { pageMetadata } from "@/lib/seo";
import { TAX_YEAR, formatLongDate } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Methodology and sources",
  description: `How Paycheck Decoder estimates take-home pay: the ${TAX_YEAR} federal brackets, FICA rules, rounding, sources and how rates are kept current.`,
  path: "/methodology",
});

const STATUS = { single: "Single", married: "Married filing jointly", head: "Head of household" } as const;

export default function MethodologyPage() {
  const p = federalRates.parameters;
  const dollars = (n: number) => formatWhole(n * 100);
  return (
    <ProsePage title="Methodology and sources" path="/methodology">
      <p>
        Paycheck Decoder estimates your take-home pay by annualizing one paycheck, applying the {TAX_YEAR}{" "}
        federal rules and your state&apos;s rules, then dividing back to a single paycheck. Everything runs in
        your browser.
      </p>

      <h2>Steps</h2>
      <ol>
        <li>Gross pay per paycheck is multiplied by the number of paychecks a year (52, 26, 24 or 12).</li>
        <li>
          Health insurance and HSA payroll contributions are removed from both income-tax wages and Social
          Security and Medicare wages.
        </li>
        <li>A traditional 401(k) contribution is removed from income-tax wages only.</li>
        <li>
          Federal income tax: income-tax wages, plus other income and minus extra deductions from Form W-4,
          minus the standard deduction, taxed with the {TAX_YEAR} brackets, minus W-4 credits, plus any extra
          withholding. This matches the IRS Publication 15-T percentage method for a current Form W-4 with
          step 2 unchecked.
        </li>
        <li>
          Social Security is {p.socialSecurity.rate * 100}% of wages up to{" "}
          {dollars(p.socialSecurity.wageBase)} a year.
        </li>
        <li>
          Medicare is {(p.medicare.rate * 100).toFixed(2)}% of all wages, plus{" "}
          {p.medicare.additionalRate * 100}% on wages over {dollars(p.medicare.additionalThreshold)}.
        </li>
        <li>
          State income tax follows the state&apos;s official withholding method. States without a wage income
          tax add nothing.
        </li>
        <li>
          Every line is rounded to the cent per paycheck, and the yearly column is that amount times the
          paychecks a year, so columns add up.
        </li>
      </ol>

      <h2>{TAX_YEAR} federal standard deduction</h2>
      <ul>
        {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((k) => (
          <li key={k}>
            {STATUS[k]}: {dollars(p.standardDeduction[k])}
          </li>
        ))}
      </ul>

      <h2>{TAX_YEAR} federal brackets</h2>
      {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((k) => (
        <div key={k}>
          <h3>{STATUS[k]}</h3>
          <ul>
            {p.brackets[k].map((b, i, all) => (
              <li key={i}>
                {b.rate * 100}% on taxable income{" "}
                {b.upTo === null ? `over ${dollars(all[i - 1].upTo!)}` : `up to ${dollars(b.upTo)}`}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h2>State withholding rules</h2>
      <p>
        Each state calculator follows that state&apos;s own employer withholding method, with its source
        linked on the state page. The rules below are read from the same data files the calculators use.
      </p>
      {publishableStates().map((code) => (
        <div key={code}>
          <h3>{STATES[code].name}</h3>
          <ul>
            {describeStateRules(getStateRates(code)).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ))}

      <h2>What is not included</h2>
      <ul>
        <li>The Form W-4 step 2 checkbox for multiple jobs, and supplemental wage rates for bonuses.</li>
        <li>Local taxes, unless you enter your own rate.</li>
        <li>
          State-specific extras such as Illinois line 2 allowances, Washington program exemptions, and
          two-earner filing rules on Georgia Form G-4.
        </li>
        <li>
          Wages that cross the Social Security wage base part-way through the year. We spread the cap evenly
          across paychecks.
        </li>
        <li>
          Garnishments, benefits that change by pay period, and your employer&apos;s own payroll rounding.
        </li>
      </ul>

      <h2>Sources</h2>
      <ul>
        {federalRates.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} rel="noopener noreferrer" target="_blank">
              {s.name}
            </a>
          </li>
        ))}
      </ul>

      <h2>How rates are kept current</h2>
      <p>
        Rates live in versioned data files, one per jurisdiction and tax year, each with its source, the date
        it was retrieved, and who verified it. A rate change is checked by a person against the official
        source and must pass automated tests before the site updates. Rates are never published automatically.
        The date you see next to a result is the date a person last signed off those rates.
      </p>
      <p>
        {isVerified(federalRates) && federalRates.verifiedOn
          ? `Federal rates last verified ${formatLongDate(federalRates.verifiedOn)}.`
          : "Federal rates are awaiting their first sign-off."}{" "}
        Questions or corrections? <Link href="/contact">Contact us</Link>.
      </p>
    </ProsePage>
  );
}
