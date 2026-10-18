import { ADSENSE_CLIENT, ADS_ENABLED } from "@/lib/site";

type Variant = "rail" | "rect" | "leaderboard";

const HEIGHT: Record<Variant, number> = { rail: 600, rect: 250, leaderboard: 90 };

/**
 * Reserved-height ad slot labelled "ADVERTISEMENT". Renders nothing until ads are enabled, so
 * the launch site carries no empty boxes. Keep slots 48px from any input or button
 * and never between an input and its result (see docs/ads.md in context.md).
 */
export function AdSlot({ variant, slot }: { variant: Variant; slot?: string }) {
  if (!ADS_ENABLED) return null;
  const height = HEIGHT[variant];
  return (
    <aside className="pd-ad" aria-label="Advertisement" style={{ minHeight: height + 40 }}>
      <span className="pd-ad-label">ADVERTISEMENT</span>
      {ADSENSE_CLIENT && slot ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: height }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className={`pd-ad-box is-${variant === "leaderboard" ? "lb" : variant}`}>Reserved ad space</div>
      )}
    </aside>
  );
}
