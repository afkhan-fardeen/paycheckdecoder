import {
  BadgeCheck,
  BookOpenCheck,
  CalendarCheck,
  Calculator,
  ChartColumn,
  ClipboardList,
  Clock,
  FileText,
  Globe,
  Lock,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { Faq } from "@/components/Faq";
import { IconChip } from "@/components/IconChip";
import { JsonLd } from "@/components/JsonLd";
import { QuickCalculator } from "@/components/QuickCalculator";
import { SearchButton } from "@/components/SearchButton";
import { SectionHeader } from "@/components/SectionHeader";
import { StateCard } from "@/components/StateCard";
import { UsMapSection } from "@/components/UsMapSection";
import { StateComparison } from "@/components/StateComparison";
import { StatCard } from "@/components/StatCard";
import { convertHourly, formatCents, formatWhole } from "@/engine";
import { compareStates } from "@/lib/compare";
import { federalRates, getStateRates, lastVerifiedOn, publishableStates } from "@/lib/rates";
import { salarySlug } from "@/lib/salary";
import { pageMetadata } from "@/lib/seo";
import { SITE_NAME, TAX_YEAR, absoluteUrl, formatLongDate } from "@/lib/site";
import { STATES } from "@/lib/states";

export const metadata = pageMetadata({
  title: `${SITE_NAME}: free paycheck calculators for every state`,
  description:
    "See what you take home after federal tax, Social Security, Medicare and state tax, and where each dollar goes. Free, private, no sign-up.",
  path: "/",
  absoluteTitle: true,
});

const CARD_SALARY = 65_000;
/** Cards on the home page; the full list lives on /paycheck-calculator. */
const FEATURED_STATES = 12;
const WAGES = [15, 20, 25, 30, 35, 40];

const FAQS = [
  {
    q: "How accurate are these paycheck estimates?",
    a: "They follow the IRS and each state's own employer withholding methods, with every rate tied to a source and a verification date. They are still estimates: your employer's payroll system, your Form W-4 choices and benefits can move the result by a few dollars per paycheck.",
  },
  {
    q: "Do you store my pay or personal details?",
    a: "No. The calculations run in your browser. The amounts you enter are not sent to our servers and there are no accounts.",
  },
  {
    q: "Why does take-home pay differ between states?",
    a: "Federal tax, Social Security and Medicare are the same everywhere. States add their own income tax, and a few add payroll programs, so the same salary leaves a different amount in your pocket depending on where you work.",
  },
  {
    q: "Where do the tax rates come from?",
    a: "From the IRS, the Social Security Administration and each state's revenue department. The methodology page lists every source, and each state page shows the date its rates were last verified.",
  },
];

export default function HomePage() {
  const codes = publishableStates();
  const states = codes.map((c) => ({ code: c, name: STATES[c].name, slug: STATES[c].slug }));
  const rows = compareStates(codes.slice(0, FEATURED_STATES), CARD_SALARY, "single");
  const verified = codes
    .map((c) => lastVerifiedOn(c))
    .filter((d): d is string => Boolean(d))
    .sort()[0];
  const sources = new Map<string, string>();
  for (const s of federalRates.sources) sources.set(s.url, s.name);
  for (const c of codes) for (const s of getStateRates(c).sources) sources.set(s.url, s.name);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: absoluteUrl("/"),
        }}
      />

      {/* Hero */}
      <section className="hero-band">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="pill">
              <CalendarCheck size={14} strokeWidth={1.5} aria-hidden="true" />
              {TAX_YEAR} tax year{verified ? ` · rates verified ${formatLongDate(verified)}` : ""}
            </p>
            <h1>Know exactly what you&apos;ll take home</h1>
            <p className="lead">
              Federal tax, Social Security, Medicare and state tax, calculated from official sources and shown
              line by line. Free, private, and no sign-up.
            </p>
            <SearchButton variant="hero" placeholder="Search states, tools, wages" />
            <div className="chip-row hero-chips">
              {states.slice(0, 4).map((s) => (
                <Link key={s.code} className="chip" href={`/paycheck-calculator/${s.slug}`}>
                  {s.name}
                </Link>
              ))}
              <Link className="chip" href="/salary">
                Hourly to salary
              </Link>
              <Link className="chip" href="/overtime-calculator">
                Overtime
              </Link>
            </div>
            <ul className="hero-points">
              <li>
                <BadgeCheck size={18} strokeWidth={1.5} aria-hidden="true" /> Official sources, linked on
                every page
              </li>
              <li>
                <Lock size={18} strokeWidth={1.5} aria-hidden="true" /> Runs in your browser, nothing stored
              </li>
            </ul>
          </div>
          <div className="hero-card">
            {states.length > 0 ? (
              <QuickCalculator states={states} />
            ) : (
              <p className="pd-answer">State calculators open once their rates have been checked.</p>
            )}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="strip" aria-label="At a glance">
        <div className="container stat-grid">
          <StatCard
            Icon={Globe}
            label="States covered"
            value={codes.length}
            hint="and more added each month"
          />
          <StatCard
            Icon={CalendarCheck}
            label="Tax year"
            value={TAX_YEAR}
            hint="current federal and state rules"
          />
          <StatCard
            Icon={FileText}
            label="Official sources"
            value={sources.size}
            hint="IRS, SSA and state agencies"
          />
          <StatCard Icon={Lock} label="Pay data stored" value="None" hint="calculated in your browser" />
        </div>
      </section>

      {/* Map */}
      {codes.length > 0 ? (
        <section className="section" aria-labelledby="map-h">
          <div className="container">
            <SectionHeader
              eyebrow="Explore"
              id="map-h"
              title="Pick your state on the map"
              description="Colored states have a calculator. Hover to preview what you keep, then click to open it. On a phone, use the state menu. The rest are coming soon."
              action={{ href: "/paycheck-calculator", label: "Or browse as a list" }}
            />
            <UsMapSection />
          </div>
        </section>
      ) : null}

      {/* Comparison chart */}
      {codes.length > 1 ? (
        <section className="section" aria-labelledby="compare-h">
          <div className="container">
            <SectionHeader
              eyebrow="Compare"
              id="compare-h"
              title="Where does your salary go further?"
              description="The same salary, taxed in each state. Pick a salary and filing status to see how federal tax, Social Security, Medicare and state tax change what you keep."
              action={{ href: "/paycheck-calculator", label: "All state calculators" }}
            />
            <StateComparison codes={codes} />
          </div>
        </section>
      ) : null}

      {/* States */}
      {codes.length > 0 ? (
        <section className="section band" aria-labelledby="states-h">
          <div className="container">
            <SectionHeader
              eyebrow="Calculators"
              id="states-h"
              title="Choose your state"
              description={`${codes.length > FEATURED_STATES ? "The most searched states. " : ""}Take-home pay on ${formatWhole(CARD_SALARY * 100)}, single, paid every two weeks. Open a state for the full calculator.`}
              action={{
                href: "/paycheck-calculator",
                label: codes.length > FEATURED_STATES ? `All ${codes.length} states` : "Browse and filter",
              }}
            />
            <div className="card-grid wide">
              {rows.map((r) => (
                <StateCard key={r.code} row={r} salaryLabel={formatWhole(CARD_SALARY * 100)} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="container">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Tools */}
      <section className="section" aria-labelledby="tools-h">
        <div className="container">
          <SectionHeader eyebrow="Tools" id="tools-h" title="More ways to work out your pay" />
          <div className="card-grid cols-3">
            <Link className="tool-card" href="/salary">
              <IconChip Icon={Clock} />
              <h3>Hourly to salary</h3>
              <p>Turn an hourly wage into yearly, monthly and weekly pay, then see what you take home.</p>
            </Link>
            <Link className="tool-card" href="/overtime-calculator">
              <IconChip Icon={Timer} />
              <h3>Overtime calculator</h3>
              <p>Time-and-a-half or double-time for a week, with your estimated net pay.</p>
            </Link>
            <Link className="tool-card" href="/methodology">
              <IconChip Icon={BookOpenCheck} />
              <h3>Methodology</h3>
              <p>Every formula, rate and source behind the numbers, and how we keep them current.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section band" aria-labelledby="how-h">
        <div className="container">
          <SectionHeader eyebrow="How it works" id="how-h" title="From salary to take-home in three steps" />
          <ol className="steps">
            <li>
              <span className="step-num" aria-hidden="true">
                1
              </span>
              <IconChip Icon={ClipboardList} />
              <h3>Enter your pay</h3>
              <p>Salary or hourly wage, how often you are paid, your filing status and any deductions.</p>
            </li>
            <li>
              <span className="step-num" aria-hidden="true">
                2
              </span>
              <IconChip Icon={Calculator} />
              <h3>We apply the official rules</h3>
              <p>
                IRS withholding, Social Security, Medicare and your state&apos;s own method, from sourced rate
                data.
              </p>
            </li>
            <li>
              <span className="step-num" aria-hidden="true">
                3
              </span>
              <IconChip Icon={ChartColumn} tone="net" />
              <h3>See where every dollar goes</h3>
              <p>A line-by-line breakdown, per paycheck and per year, with the sources beside the number.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* Popular hourly wages */}
      <section className="section" aria-labelledby="wages-h">
        <div className="container">
          <SectionHeader
            eyebrow="Hourly to salary"
            id="wages-h"
            title="Popular hourly wages"
            description="Before tax, at 40 hours a week for 52 weeks."
            action={{ href: "/salary", label: "All wages" }}
          />
          <div className="card-surface table-card">
            <div className="table-scroll">
              <table className="pd-table">
                <caption className="sr-only">
                  Hourly wages converted to yearly, monthly and weekly pay
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Hourly wage</th>
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
                  {WAGES.map((w) => {
                    const c = convertHourly({ wage: w, hoursPerWeek: 40, weeksPerYear: 52 });
                    return (
                      <tr key={w}>
                        <th scope="row">
                          <Link href={`/salary/${salarySlug(w)}`}>${w} an hour</Link>
                        </th>
                        <td className="pd-n">{formatWhole(c.yearly)}</td>
                        <td className="pd-n">{formatCents(c.monthly)}</td>
                        <td className="pd-n">{formatCents(c.weekly)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Sources + trust */}
      <section className="section band" aria-labelledby="trust-h">
        <div className="container">
          <SectionHeader
            eyebrow="Trust"
            id="trust-h"
            title="Built on official sources"
            description="Every rate in a calculator is read from the agency that publishes it, checked by a person, and dated. We never publish a rate change automatically."
            action={{ href: "/methodology", label: "Read the methodology" }}
          />
          <ul className="source-grid">
            {[...sources].map(([url, name]) => (
              <li key={url}>
                <a href={url} rel="noopener noreferrer" target="_blank">
                  <FileText size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    {name}
                    <small>{new URL(url).hostname.replace(/^www\./, "")}</small>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container narrow">
          <Faq items={FAQS} heading="Common questions" />
        </div>
      </section>
    </main>
  );
}
