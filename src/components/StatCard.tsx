import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  Icon?: LucideIcon;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        {Icon ? <Icon size={16} strokeWidth={1.5} aria-hidden="true" /> : null}
        {label}
      </div>
      <div className="stat-value pd-num">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}
