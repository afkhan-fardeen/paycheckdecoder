import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { STATES } from "@/lib/states";
import type { StateCode } from "@/lib/rates";

export function StatePicker({ codes }: { codes: StateCode[] }) {
  return (
    <ul className="pd-states" style={{ margin: 0 }}>
      {codes.map((code) => {
        const s = STATES[code];
        return (
          <li key={code}>
            <Link className="pd-state" href={`/paycheck-calculator/${s.slug}`}>
              <span>
                {s.name}
                <small>{s.tagline}</small>
              </span>
              <ChevronRight className="chev" size={18} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
