import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerBlock } from "@/components/AnswerBlock";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContentColumns } from "@/components/ContentColumns";
import { Faq } from "@/components/Faq";
import { HourlyConverter } from "@/components/HourlyConverter";
import { convertHourly, formatCents, formatWhole } from "@/engine";
import { publishableStates } from "@/lib/rates";
import { SALARY_WAGES, nearbyWages, salarySlug, wageFromSlug } from "@/lib/salary";
import { pageMetadata } from "@/lib/seo";
import { NOTICE } from "@/lib/site";
import { STATES } from "@/lib/states";

export const dynamicParams = false;

export function generateStaticParams() {
  return SALARY_WAGES.map((w) => ({ slug: salarySlug(w) }));
}

const convert = (wage: number) => convertHourly({ wage, hoursPerWeek: 40, weeksPerYear: 52 });

export async function generateMetadata({ params }: PageProps<"/salary/[slug]">): Promise<Metadata> {
  const wage = wageFromSlug((await params).slug);
  if (wage === null) return {};
  const c = convert(wage);
  return pageMetadata({
    title: `$${wage} an hour is how much a year?`,
    description: `$${wage} an hour at 40 hours a week is ${formatWhole(c.yearly)} a year before tax, ${formatCents(c.monthly)} a month and ${formatCents(c.weekly)} a week. See your take-home pay by state.`,
    path: `/salary/${salarySlug(wage)}`,
  });
}

export default async function SalaryPage({ params }: PageProps<"/salary/[slug]">) {
  const wage = wageFromSlug((await params).slug);
  if (wage === null) notFound();
  const c = convert(wage);
  const codes = publishableStates();
  const faqs = [
    {
      q: "How do you convert hourly pay to a yearly salary?",
      a: `Multiply the hourly wage by the hours you work each week and by 52 weeks. For $${wage} an hour at 40 hours a week that is $${wage} × 40 × 52 = ${formatWhole(c.yearly)}.`,
    },
    {
      q: `Is $${wage} an hour before or after tax?`,
      a: `Before tax. ${formatWhole(c.yearly)} is gross pay. Your take-home pay is lower after federal income tax, Social Security, Medicare and any state tax.`,
    },
    {
      q: "What if I work fewer than 40 hours or take unpaid weeks off?",
      a: "Change the hours per week or weeks per year in the converter above and the result updates.",
    },
  ];
  return (
    <main className="wrap">
      <header className="block" style={{ gap: 12 }}>
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Hourly to salary", href: "/salary" },
            { name: `$${wage} an hour`, href: `/salary/${salarySlug(wage)}` },
          ]}
        />
        <h1>${wage} an hour is how much a year?</h1>
        <AnswerBlock caption="Pick your state below to see what you take home.">
          <b>
            ${wage} an hour at 40 hours a week is {formatWhole(c.yearly)} a year
          </b>{" "}
          before tax, or {formatCents(c.monthly)} a month and {formatCents(c.weekly)} a week.
        </AnswerBlock>
      </header>

      <HourlyConverter initialWage={wage} />

      <section className="callout">
        <h2 style={{ fontSize: 20, lineHeight: "26px" }}>What do you take home?</h2>
        <p style={{ marginTop: 8, color: "var(--ink-muted)", maxWidth: 560 }}>
          Gross pay is not what lands in your account. Pick your state to see your estimated take-home after
          federal tax, Social Security, Medicare and state tax.
        </p>
        <div className="chip-row" style={{ marginTop: 16 }}>
          {codes.map((code) => (
            <Link key={code} className="chip" href={`/paycheck-calculator/${STATES[code].slug}`}>
              {STATES[code].name}
            </Link>
          ))}
          <Link className="chip" href="/paycheck-calculator">
            All states
          </Link>
        </div>
      </section>

      <ContentColumns>
        <section className="pd-card">
          <div className="table-scroll">
            <table className="pd-table">
              <caption>Nearby hourly wages at 40 hours a week</caption>
              <thead>
                <tr>
                  <th scope="col" className="pd-n">
                    Hourly
                  </th>
                  <th scope="col" className="pd-n">
                    Yearly
                  </th>
                  <th scope="col" className="pd-n">
                    Monthly
                  </th>
                  <th scope="col" className="pd-n">
                    Weekly
                  </th>
                </tr>
              </thead>
              <tbody>
                {nearbyWages(wage).map((w) => {
                  const r = convert(w);
                  return (
                    <tr key={w} className={w === wage ? "is-total" : undefined}>
                      <td className="pd-n">
                        {w === wage ? `$${w}.00` : <Link href={`/salary/${salarySlug(w)}`}>${w}.00</Link>}
                      </td>
                      <td className="pd-n">{formatWhole(r.yearly)}</td>
                      <td className="pd-n">{formatCents(r.monthly)}</td>
                      <td className="pd-n">{formatCents(r.weekly)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <Faq items={faqs} />
        <div className="pd-stamp">
          <b>Gross figures only.</b> Take-home depends on your state and Form W-4. {NOTICE}
        </div>
      </ContentColumns>
    </main>
  );
}
