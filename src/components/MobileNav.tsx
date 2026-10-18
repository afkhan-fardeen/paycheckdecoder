"use client";

import { BookOpenCheck, Calculator, Clock, Info, Menu, Timer, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/paycheck-calculator", label: "State calculators", Icon: Calculator },
  { href: "/salary", label: "Hourly to salary", Icon: Clock },
  { href: "/overtime-calculator", label: "Overtime", Icon: Timer },
  { href: "/methodology", label: "Methodology", Icon: BookOpenCheck },
  { href: "/about", label: "About", Icon: Info },
];

/** Menu button and dropdown for narrow screens. Desktop uses the inline links in SiteHeader. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
    <div className="mobile-nav" ref={root}>
      <button
        type="button"
        className="menu-btn"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <X size={20} strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
        )}
        <span>{open ? "Close" : "Menu"}</span>
      </button>
      {open ? (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Main">
          {LINKS.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
