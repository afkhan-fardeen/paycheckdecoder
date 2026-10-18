import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Report a calculation error, a wrong rate or a problem with Paycheck Decoder.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <ProsePage title="Contact" path="/contact">
      <p>
        Found a number that looks wrong, or a state whose rules changed? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <p>
        Please include the page address, the numbers you entered, and the figure you expected with its source.
        Corrections are checked against the official source before rates change.
      </p>
      <p>
        We cannot give tax advice or review your personal return. For that, speak to a licensed tax
        professional.
      </p>
    </ProsePage>
  );
}
