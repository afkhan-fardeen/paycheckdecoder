import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { QuickCalculator } from "@/components/QuickCalculator";
import { StatePicker } from "@/components/StatePicker";
import { publishableStates } from "@/lib/rates";
import { pageMetadata } from "@/lib/seo";
import { SITE_NAME, NOTICE, absoluteUrl } from "@/lib/site";
import { STATES } from "@/lib/states";

export const metadata = pageMetadata({
  title: `${SITE_NAME}: free paycheck calculators for every state`,
  description:
    "See what you take home after federal tax, Social Security, Medicare and state tax, and where each dollar goes. Free, private, no sign-up.",
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  const codes = publishableStates();
  const states = codes.map((c) => ({ code: c, name: STATES[c].name, slug: STATES[c].slug }));
  return (
    <main className="wrap">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: absoluteUrl("/"),
        }}
      />
      <section className="hero">
        <span className="eyebrow">Free paycheck calculators for US workers</span>
        <h1>Decode your paycheck</h1>
        <p className="lead">
          See what you actually take home after federal tax, Social Security, Medicare and state tax, and
          exactly where each dollar goes.
        </p>
      </section>

      {states.length > 0 ? (
        <QuickCalculator states={states} />
      ) : (
        <p className="pd-answer">State calculators open once their rates have been checked.</p>
      )}

      {codes.length > 0 ? (
        <section className="block" aria-labelledby="pick">
          <div>
            <h2 id="pick">Pick your state</h2>
            <p style={{ color: "var(--ink-muted)", marginTop: 8 }}>
              Each calculator uses that state&apos;s rules and shows where they differ.
            </p>
          </div>
          <StatePicker codes={codes} />
          <p>
            <Link href="/paycheck-calculator">See all state calculators</Link>
          </p>
        </section>
      ) : null}

      <AdSlot variant="leaderboard" />

      <section className="block" aria-labelledby="tools">
        <h2 id="tools">More tools</h2>
        <div className="trio">
          <Link className="pd-card tool" href="/salary">
            <h3>Hourly to salary</h3>
            <p>Turn an hourly wage into yearly, monthly and weekly pay.</p>
          </Link>
          <Link className="pd-card tool" href="/overtime-calculator">
            <h3>Overtime calculator</h3>
            <p>Work out time-and-a-half pay for extra hours, with your estimated net.</p>
          </Link>
          <Link className="pd-card tool" href="/methodology">
            <h3>How we calculate</h3>
            <p>Every rate, formula and source, and how we keep them current.</p>
          </Link>
        </div>
      </section>

      <section className="block" aria-labelledby="why">
        <h2 id="why">Why trust the numbers</h2>
        <div className="trio">
          <div>
            <h3>Official rules</h3>
            <p>
              Federal rules from IRS publications and each state&apos;s revenue department, with the source
              linked on every page.
            </p>
          </div>
          <div>
            <h3>Checked and dated</h3>
            <p>Every rate has a verification date, shown next to your result.</p>
          </div>
          <div>
            <h3>Private by design</h3>
            <p>The math runs in your browser. We do not store your pay.</p>
          </div>
        </div>
      </section>
      <div className="pd-stamp">{NOTICE}</div>
    </main>
  );
}
