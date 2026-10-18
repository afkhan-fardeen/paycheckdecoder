import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { convertHourly, formatWhole } from "@/engine";
import { SALARY_WAGES, salarySlug } from "@/lib/salary";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Hourly to salary calculator",
  description:
    "Convert an hourly wage to yearly, monthly, weekly and daily pay, then see what you take home in your state.",
  path: "/salary",
});

export default function SalaryIndexPage() {
  return (
    <main className="wrap">
      <header className="block" style={{ gap: 12 }}>
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Hourly to salary", href: "/salary" },
          ]}
        />
        <h1>Hourly to salary calculator</h1>
        <p className="lead">
          Pick an hourly wage to see what it comes to in a year at 40 hours a week, then check your take-home
          pay in your state.
        </p>
      </header>
      <ul className="pd-states" style={{ margin: 0 }}>
        {SALARY_WAGES.map((w) => (
          <li key={w}>
            <Link className="pd-state" href={`/salary/${salarySlug(w)}`}>
              ${w} an hour
              <small>
                {formatWhole(convertHourly({ wage: w, hoursPerWeek: 40, weeksPerYear: 52 }).yearly)} a year
              </small>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
