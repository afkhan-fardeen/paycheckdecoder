import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Disclaimer",
  description: "Paycheck Decoder results are estimates and not tax, legal or financial advice.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <ProsePage title="Disclaimer" path="/disclaimer" updated="October 18, 2026">
      <p>
        Paycheck Decoder provides estimates for general information. Results are not tax, legal, payroll or
        financial advice, and they are not an official calculation of any amount you owe or will be paid.
      </p>
      <p>
        Your employer&apos;s payroll system, your Form W-4, your benefits, local taxes and other circumstances
        can make your actual paycheck differ from an estimate. Tax rules change, and although we check rates
        against official sources, we cannot guarantee that every figure is current or error free.
      </p>
      <p>
        Do not use results from this site as proof of income. Consult a licensed tax professional about your
        own situation.
      </p>
    </ProsePage>
  );
}
