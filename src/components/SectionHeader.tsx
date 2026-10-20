import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  id?: string;
  description?: ReactNode;
  action?: { href: string; label: string };
}

export function SectionHeader({ eyebrow, title, id, description, action }: Props) {
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={id}>{title}</h2>
        {description ? <p className="section-desc">{description}</p> : null}
      </div>
      {action ? (
        <Link className="section-action" href={action.href}>
          {action.label}
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
