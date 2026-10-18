"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  /** Short hint shown under the title while closed. */
  hint?: string;
  icon: ReactNode;
  /** Keeps the section open, for example while a field inside it shows an error. */
  forceOpen?: boolean;
  children: ReactNode;
}

/** Native <details> with a labelled icon row. Opens by itself when it holds an error, so errors are never hidden. */
export function Disclosure({ title, hint, icon, forceOpen = false, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <details className="pd-details" open={open || forceOpen} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <span className="pd-details-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="pd-details-text">
          <span>{title}</span>
          {hint ? <small>{hint}</small> : null}
        </span>
        <ChevronDown className="pd-chev" size={18} strokeWidth={1.5} aria-hidden="true" />
      </summary>
      <div className="form">{children}</div>
    </details>
  );
}
