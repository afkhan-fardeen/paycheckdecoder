import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap">
      <h1>Page not found</h1>
      <p className="lead">
        That page does not exist. Try a state calculator or the hourly-to-salary converter.
      </p>
      <div className="chip-row">
        <Link className="chip" href="/">
          Home
        </Link>
        <Link className="chip" href="/paycheck-calculator">
          State calculators
        </Link>
        <Link className="chip" href="/salary">
          Hourly to salary
        </Link>
      </div>
    </main>
  );
}
