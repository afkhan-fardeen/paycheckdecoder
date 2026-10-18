import { ChevronDown } from "lucide-react";
import { JsonLd } from "./JsonLd";

export interface FaqItem {
  q: string;
  a: string;
}

/** Native <details> elements, mirrored in FAQPage markup. The first item starts open. */
export function Faq({
  items,
  heading = "Frequently asked questions",
}: {
  items: FaqItem[];
  heading?: string;
}) {
  return (
    <section className="faq block" style={{ gap: 0 }} aria-labelledby="faq-h">
      <h2 id="faq-h" style={{ marginBottom: 8 }}>
        {heading}
      </h2>
      {items.map((item, i) => (
        <details key={item.q} open={i === 0}>
          <summary>
            <span>{item.q}</span>
            <ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" />
          </summary>
          <p>{item.a}</p>
        </details>
      ))}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
    </section>
  );
}
