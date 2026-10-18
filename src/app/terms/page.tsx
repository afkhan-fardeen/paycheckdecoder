import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of use",
  description: "Terms for using Paycheck Decoder calculators and content.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <ProsePage title="Terms of use" path="/terms" updated="October 18, 2026">
      <p>
        <b>Draft for review.</b> Have these terms reviewed by a lawyer before launch.
      </p>
      <p>
        By using Paycheck Decoder you agree to these terms. The site and its calculators are provided as is,
        for general information only. See the <Link href="/disclaimer">disclaimer</Link>: results are
        estimates and not advice.
      </p>
      <ul>
        <li>Do not use the site to create documents that imitate pay stubs or proof of income.</li>
        <li>Do not scrape, overload or attempt to disrupt the site.</li>
        <li>
          We may change or remove content and rates at any time, and we are not liable for decisions made from
          estimates.
        </li>
        <li>
          Site content is owned by Paycheck Decoder. You may link to pages, and quote short excerpts with
          attribution.
        </li>
      </ul>
    </ProsePage>
  );
}
