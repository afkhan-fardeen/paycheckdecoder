import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Paycheck Decoder",
  description:
    "Paycheck Decoder is a free US take-home pay calculator that shows every tax line and its source.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <ProsePage title="About Paycheck Decoder" path="/about">
      <p>
        Paycheck Decoder helps US workers see what lands in their bank account and why. Pick your state, enter
        your pay, and see every tax and deduction line by line.
      </p>
      <p>
        We build one state at a time. A state goes live only after its tax rates have been checked against the
        official source and its calculations pass tests built from official examples. Every result shows the
        date its rates were verified and links to the sources.
      </p>
      <p>
        The site is free and supported by advertising. Your pay figures stay in your browser. See the{" "}
        <Link href="/methodology">methodology</Link> for how the numbers are calculated and the{" "}
        <Link href="/privacy">privacy policy</Link> for what we collect.
      </p>
      <p>
        Paycheck Decoder gives estimates, not tax advice. Read the <Link href="/disclaimer">disclaimer</Link>.
      </p>
    </ProsePage>
  );
}
