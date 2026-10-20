import type { ReactNode } from "react";
import { ADS_ENABLED } from "@/lib/site";
import { AdSlot } from "./AdSlot";

/**
 * Main column plus an optional right rail (desktop) that stacks below on narrow screens.
 * The rail holds `rail` content and, once ads are enabled, the ad unit. With neither, the column is not rendered.
 */
export function ContentColumns({ children, rail }: { children: ReactNode; rail?: ReactNode }) {
  const hasRail = Boolean(rail) || ADS_ENABLED;
  return (
    <div className={hasRail ? "cols" : "cols no-rail"}>
      <div className="main">{children}</div>
      {hasRail ? (
        <aside className="rail" aria-label="Related information">
          {rail}
          {ADS_ENABLED ? <AdSlot variant="rail" /> : null}
        </aside>
      ) : null}
    </div>
  );
}
