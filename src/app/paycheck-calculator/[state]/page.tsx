import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerBlock } from "@/components/AnswerBlock";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Calculator } from "@/components/Calculator";
import { ContentColumns } from "@/components/ContentColumns";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { StateRail } from "@/components/StateRail";
import { StatCard } from "@/components/StatCard";
import { TakeHomeChart } from "@/components/TakeHomeChart";
import { CalendarCheck, Landmark, PiggyBank, Wallet } from "lucide-react";
import { formatCents, formatPercent, formatWhole } from "@/engine";
import { compareStates, takeHomeCurve } from "@/lib/compare";
import { examplePaycheck, EXAMPLE_SALARY } from "@/lib/example";
import {
  getStateRates,
  hasSignOff,
  isPublishable,
  lastVerifiedOn,
  publishableStates,
  federalRates,
  type StateCode,
} from "@/lib/rates";
import { pageMetadata } from "@/lib/seo";
import { describeStateRules, stateAnswerNote, stateTaxType, taxPhrase } from "@/lib/state-methods";
import { TAX_YEAR, absoluteUrl, formatLongDate } from "@/lib/site";
import { STATES, stateBySlug } from "@/lib/states";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishableStates().map((code) => ({ state: STATES[code].slug }));
}

function load(slug: string) {
  const info = stateBySlug(slug);
  if (!info || !isPublishable(info.code)) return null;
  return info;
}

export async function generateMetadata({
  params,
}: PageProps<"/paycheck-calculator/[state]">): Promise<Metadata> {
  const { state } = await params;
  const info = load(state);
  if (!info) return {};
  const r = examplePaycheck(info.code);
  return pageMetadata({
    title: `${info.name} Paycheck Calculator ${TAX_YEAR}`,
    description: `Estimate your ${info.name} take-home pay for ${TAX_YEAR}. A ${formatWhole(EXAMPLE_SALARY * 100)} salary nets about ${formatWhole(r.lines.net.annual)} a year after federal and state withholding, Social Security and Medicare.`,
    path: `/paycheck-calculator/${info.slug}`,
  });
}

const EXAMPLE_SALARIES = [30_000, 52_000, 75_000, 100_000, 150_000];

export default async function StatePage({ params }: PageProps<"/paycheck-calculator/[state]">) {
  const { state } = await params;
  const info = load(state);
  if (!info) notFound();
  const code: StateCode = info.code;
  const path = `/paycheck-calculator/${info.slug}`;
  const example = examplePaycheck(code);
  const stateRates = getStateRates(code);
  const verifiedOn = lastVerifiedOn(code);
  const signed = hasSignOff(code);
  const reviewer = getStateRates(code).verifiedBy ?? federalRates.verifiedBy;
  const related = info.related.filter(isPublishable);

  return (
    <main className="wrap">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${info.name} Paycheck Calculator`,
          url: absoluteUrl(path),
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <header className="block" style={{ gap: 12 }}>
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "State calculators", href: "/paycheck-calculator" },
            { name: info.name, href: path },
          ]}
        />
        <h1>{info.name} paycheck calculator</h1>
        <AnswerBlock
          caption={
            signed && verifiedOn
              ? `Rates verified ${formatLongDate(verifiedOn)}.`
              : "Preview: rates not signed off yet."
          }
        >
          <b>
            At a {formatWhole(EXAMPLE_SALARY * 100)} salary in {info.name}
          </b>
          , filing single, you take home about <b>{formatWhole(example.lines.net.annual)} a year</b>, or{" "}
          <b>{formatCents(example.lines.net.perPeriod)} every two weeks</b>, after{" "}
          {taxPhrase(info.name, stateRates)}. {stateAnswerNote(info.name, stateRates)}
        </AnswerBlock>
      </header>

      <section className="stat-grid compact" aria-label={`${info.name} at a glance`}>
        <StatCard
          Icon={Wallet}
          label={`Take-home on ${formatWhole(EXAMPLE_SALARY * 100)}`}
          value={formatWhole(example.lines.net.annual)}
          hint={`${formatCents(example.lines.net.perPeriod)} every two weeks`}
        />
        <StatCard
          Icon={PiggyBank}
          label="Take-home rate"
          value={formatPercent(example.takeHomeRate)}
          hint="of gross pay, single filer"
        />
        <StatCard
          Icon={Landmark}
          label="State income tax"
          value={stateTaxType(stateRates).label}
          hint={stateAnswerNote(info.name, stateRates)}
        />
        <StatCard
          Icon={CalendarCheck}
          label="Rates verified"
          value={signed && verifiedOn ? formatLongDate(verifiedOn) : "Preview"}
          hint={`${TAX_YEAR} tax year`}
        />
      </section>

      <Calculator code={code} stateName={info.name} allowanceLabel={info.allowanceLabel} />

      <ContentColumns
        rail={
          <StateRail
            code={code}
            stateName={info.name}
            nearby={compareStates(
              publishableStates().filter((c) => c !== code),
              EXAMPLE_SALARY,
              "single",
            ).slice(0, 5)}
            salaryLabel={formatWhole(EXAMPLE_SALARY * 100)}
            verifiedOn={verifiedOn}
            signed={signed}
            sections={[
              { href: "#how-it-works", label: `How ${info.name} payroll tax works` },
              { href: "#curve-h", label: "Take-home by salary" },
              { href: "#examples", label: "Common salaries" },
              { href: "#faq-h", label: "Frequently asked questions" },
            ]}
          />
        }
      >
        <article className="block" id="how-it-works" style={{ gap: 12 }}>
          <h2>How {info.name} payroll tax works</h2>
          <p style={{ color: "var(--ink-muted)", maxWidth: 640 }}>{info.structure}</p>
          <h3>{info.name} withholding rules used in this calculator</h3>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: 8, maxWidth: 640 }}>
            {describeStateRules(stateRates).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: 8, maxWidth: 640 }}>
            {info.programs.map((p) => (
              <li key={p.name}>
                <b>{p.name}.</b> {p.text}
              </li>
            ))}
          </ul>
          <p style={{ color: "var(--ink-muted)", maxWidth: 640 }}>{info.localNote}</p>
          <p style={{ color: "var(--ink-muted)", maxWidth: 640 }}>
            Each line, its rate and its source are listed on the{" "}
            <Link href="/methodology">methodology page</Link>.
          </p>
          <div className="meta">
            <span>{signed ? `Reviewed by ${reviewer}` : "Not yet reviewed (preview)"}</span>
            {verifiedOn && signed ? <span>Last updated {formatLongDate(verifiedOn)}</span> : null}
            <Link href="/methodology">Methodology and sources</Link>
          </div>
        </article>

        <section className="block" aria-labelledby="curve-h" style={{ gap: 12 }}>
          <h2 id="curve-h">How your take-home changes with salary</h2>
          <TakeHomeChart points={takeHomeCurve(code)} stateName={info.name} initial={50_000} />
        </section>

        <section className="block" aria-labelledby="examples" style={{ gap: 12 }}>
          <h2 id="examples">Take-home pay in {info.name} at common salaries</h2>
          <div className="pd-card">
            <div className="table-scroll">
              <table className="pd-table">
                <caption>Single filer, paid every two weeks, no deductions, {TAX_YEAR} rates</caption>
                <thead>
                  <tr>
                    <th scope="col">Salary</th>
                    <th scope="col" className="pd-n">
                      Take-home per year
                    </th>
                    <th scope="col" className="pd-n">
                      Per paycheck
                    </th>
                    <th scope="col" className="pd-n">
                      Take-home rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLE_SALARIES.map((salary) => {
                    const r = examplePaycheck(code, salary);
                    return (
                      <tr key={salary}>
                        <th scope="row">{formatWhole(salary * 100)}</th>
                        <td className="pd-n">{formatWhole(r.lines.net.annual)}</td>
                        <td className="pd-n">{formatCents(r.lines.net.perPeriod)}</td>
                        <td className="pd-n">{formatPercent(r.takeHomeRate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <Faq items={info.faqs} />

        <section className="block" aria-labelledby="rel">
          <h2 id="rel" style={{ fontSize: 18, lineHeight: "24px" }}>
            Related calculators
          </h2>
          <div className="chip-row">
            {related.map((c) => (
              <Link key={c} className="chip" href={`/paycheck-calculator/${STATES[c].slug}`}>
                {STATES[c].name}
              </Link>
            ))}
            <Link className="chip" href="/salary/25-an-hour-is-how-much-a-year">
              Hourly to salary
            </Link>
            <Link className="chip" href="/overtime-calculator">
              Overtime
            </Link>
          </div>
        </section>
      </ContentColumns>
    </main>
  );
}
