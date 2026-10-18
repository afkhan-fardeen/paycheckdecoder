import type { LucideIcon } from "lucide-react";

/** Small rounded square holding a decorative icon. The text beside it carries the meaning. */
export function IconChip({ Icon, tone = "neutral" }: { Icon: LucideIcon; tone?: "neutral" | "net" }) {
  return (
    <span className={`icon-chip${tone === "net" ? " is-net" : ""}`} aria-hidden="true">
      <Icon size={20} strokeWidth={1.5} />
    </span>
  );
}
