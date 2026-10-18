import { ALLOW_UNVERIFIED, STATE_CODES, hasSignOff } from "@/lib/rates";

/**
 * Shown on preview builds only while some state is published without a sign-off.
 * Once every rate file is signed, there is nothing to warn about. Never shown in production.
 */
export function PreviewBanner() {
  if (!ALLOW_UNVERIFIED || STATE_CODES.every(hasSignOff)) return null;
  return (
    <div className="preview-banner" role="note">
      Preview build: includes states whose rates have not been signed off. Not for public release.
    </div>
  );
}
