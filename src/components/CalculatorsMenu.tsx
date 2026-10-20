"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  states: { name: string; slug: string; tagline: string }[];
}

/** Header dropdown listing every published state. Click to open; Escape, outside click or choosing a link closes it. */
export function CalculatorsMenu({ states }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    const onClick = (e: MouseEvent) =>
      root.current && !root.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div className="nav-menu" ref={root}>
      <button
        type="button"
        className="nav-link"
        aria-expanded={open}
        aria-controls="calc-menu"
        onClick={() => setOpen((o) => !o)}
      >
        Calculators
        <ChevronDown className="pd-chev" size={16} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {open ? (
        <div id="calc-menu" className="nav-panel">
          <p className="nav-panel-label">Paycheck calculators by state</p>
          <ul className="nav-panel-grid">
            {states.map((s) => (
              <li key={s.slug}>
                <Link href={`/paycheck-calculator/${s.slug}`} onClick={() => setOpen(false)}>
                  <span>{s.name}</span>
                  <small>{s.tagline}</small>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="nav-panel-all" href="/paycheck-calculator" onClick={() => setOpen(false)}>
            View all state calculators
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
