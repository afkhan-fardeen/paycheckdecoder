import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy policy",
  description: "What Paycheck Decoder collects, what it does not, and how advertising affects your privacy.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy policy" path="/privacy" updated="October 18, 2026">
      <p>
        <b>Draft for review.</b> This policy must be reviewed against the analytics and advertising tools
        actually in use before launch.
      </p>
      <h2>Your pay figures</h2>
      <p>
        Calculations run in your browser. The amounts you enter are not sent to our servers and we do not
        create accounts or save your pay.
      </p>
      <h2>What we do collect</h2>
      <ul>
        <li>
          Standard server logs kept by our hosting provider, such as IP address, page requested and browser
          type, used for security and reliability.
        </li>
        <li>
          Aggregate visit statistics, if and when we enable analytics. We will update this page with the tool
          and what it records.
        </li>
      </ul>
      <h2>Advertising</h2>
      <p>
        We plan to show ads from Google AdSense and other ad partners. When ads are shown, those partners may
        use cookies or similar technologies to serve and measure ads, including ads based on your visits to
        this and other sites. You can learn how Google uses data from sites that use its services at{" "}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          rel="noopener noreferrer"
          target="_blank"
        >
          policies.google.com/technologies/partner-sites
        </a>{" "}
        and manage ad personalization in Google&apos;s ad settings. Visitors in the EEA, UK and Switzerland
        will be asked for consent where required.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about privacy: <Link href="/contact">Contact us</Link>.
      </p>
    </ProsePage>
  );
}
