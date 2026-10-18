import { formatCents, formatPercent, type LineKey, type PaycheckResult } from "@/engine";

interface Props {
  result: PaycheckResult;
  stateName: string;
  frequencyLabel: string;
}

/** The accessible, crawlable version of the breakdown: a real table with caption and headers. */
export function BreakdownTable({ result, stateName, frequencyLabel }: Props) {
  const { lines, periods } = result;
  const gross = lines.gross.perPeriod;
  const share = (cents: number) => (gross === 0 ? "0%" : formatPercent(cents / gross));
  const row = (key: LineKey, label: string, note?: string, always = false, negative = true) => {
    const a = lines[key];
    if (!always && a.perPeriod === 0) return null;
    return (
      <tr key={key}>
        <th scope="row">
          {label}
          {note ? <div className="pd-note">{note}</div> : null}
        </th>
        <td className="pd-n">
          {negative && a.perPeriod > 0 ? "−" : ""}
          {formatCents(a.perPeriod)}
        </td>
        <td className="pd-n">
          {negative && a.annual > 0 ? "−" : ""}
          {formatCents(a.annual)}
        </td>
        <td className="pd-n">{share(a.perPeriod)}</td>
      </tr>
    );
  };
  return (
    <div className="table-scroll">
      <table className="pd-table">
        <caption>
          Paycheck breakdown, {frequencyLabel} ({periods} paychecks a year)
        </caption>
        <thead>
          <tr>
            <th scope="col">Line</th>
            <th scope="col" className="pd-n">
              Per paycheck
            </th>
            <th scope="col" className="pd-n">
              Per year
            </th>
            <th scope="col" className="pd-n">
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {row("gross", "Gross pay", undefined, true, false)}
          {row(
            "preTax401k",
            "Traditional 401(k)",
            "Lowers income-tax wages, not Social Security or Medicare wages",
          )}
          {row("preTaxHealth", "Health insurance and HSA", "Lowers income-tax and FICA wages")}
          {row("federal", "Federal income tax", "Standard deduction and 2026 brackets", true)}
          {row("socialSecurity", "Social Security", "6.2% up to the annual wage base", true)}
          {row("medicare", "Medicare", "1.45% of all wages", true)}
          {row("additionalMedicare", "Additional Medicare", "0.9% of wages over $200,000")}
          {row("state", "State income tax", `${stateName} has no state income tax`, true)}
          {row("local", "Local income tax", "Your rate, applied to income-tax wages")}
          {row("postTax", "After-tax deductions")}
          <tr className="is-total">
            <th scope="row">Estimated take-home pay</th>
            <td className="pd-n">{formatCents(lines.net.perPeriod)}</td>
            <td className="pd-n">{formatCents(lines.net.annual)}</td>
            <td className="pd-n">{share(lines.net.perPeriod)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
