import type { ReactNode } from "react";
import { ADS_ENABLED } from "@/lib/site";
import { AdSlot } from "./AdSlot";

/** Main column plus the desktop ad rail. With ads off, the rail and its column are not rendered. */
export function ContentColumns({ children }: { children: ReactNode }) {
  return (
    <div className={ADS_ENABLED ? "cols" : "cols no-rail"}>
      <div className="main">{children}</div>
      {ADS_ENABLED ? (
        <div className="rail">
          <AdSlot variant="rail" />
        </div>
      ) : null}
    </div>
  );
}
