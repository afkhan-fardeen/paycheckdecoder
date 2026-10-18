export const SITE_NAME = "Paycheck Decoder";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://paycheckdecoder.com").replace(
  /\/$/,
  "",
);
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@paycheckdecoder.com";
export const TAX_YEAR = 2026;

/**
 * Only the production deployment is indexable. Preview and local builds are
 * blocked in robots.txt and with a noindex meta tag.
 */
export const INDEXABLE = process.env.VERCEL_ENV === "production" || process.env.NEXT_PUBLIC_INDEXABLE === "1";

/** Ads are off until AdSense approves the site and NEXT_PUBLIC_ADS_ENABLED=1 is set. */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "1";
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const NOTICE = "Estimate only. Your employer's payroll system may differ. Not tax advice.";
