import { ALLOW_UNVERIFIED } from "@/lib/rates";

/** Shown on every page of preview builds that publish unsigned rate data. Never in production. */
export function PreviewBanner() {
  if (!ALLOW_UNVERIFIED) return null;
  return (
    <div className="preview-banner" role="note">
      Preview build: includes states whose rates have not been signed off. Not for public release.
    </div>
  );
}
