import { publishableStates } from "@/lib/rates";
import { SITE_NAME, TAX_YEAR, absoluteUrl } from "@/lib/site";
import { STATES } from "@/lib/states";

export const dynamic = "force-static";

export function GET() {
  const states = publishableStates()
    .map(
      (c) =>
        `- [${STATES[c].name} paycheck calculator](${absoluteUrl(`/paycheck-calculator/${STATES[c].slug}`)})`,
    )
    .join("\n");
  const body = `# ${SITE_NAME}

> Free US take-home pay calculators for ${TAX_YEAR}. Estimates only, not tax advice. Calculations run in the browser from versioned rate files, each with an official source and a verification date.

## Method and sources
- [Methodology and sources](${absoluteUrl("/methodology")})

## Calculators
${states || "- State calculators open after their rates are verified."}
- [Hourly to salary](${absoluteUrl("/salary")})
- [Overtime calculator](${absoluteUrl("/overtime-calculator")})
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
