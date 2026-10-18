import federalJson from "@/data/rates/federal-2026.json";
import flJson from "@/data/rates/fl-2026.json";
import nvJson from "@/data/rates/nv-2026.json";
import tnJson from "@/data/rates/tn-2026.json";
import txJson from "@/data/rates/tx-2026.json";
import gaJson from "@/data/rates/ga-2026.json";
import ilJson from "@/data/rates/il-2026.json";
import ncJson from "@/data/rates/nc-2026.json";
import ohJson from "@/data/rates/oh-2026.json";
import waJson from "@/data/rates/wa-2026.json";
import { federalRatesSchema, stateRatesSchema, type RateFile, type StateRates } from "./rates-schema";

/** Parsed at import time, so malformed rate files fail the build instead of reaching a page. */
export const federalRates = federalRatesSchema.parse(federalJson);

const stateFiles = {
  TX: stateRatesSchema.parse(txJson),
  FL: stateRatesSchema.parse(flJson),
  TN: stateRatesSchema.parse(tnJson),
  NV: stateRatesSchema.parse(nvJson),
  WA: stateRatesSchema.parse(waJson),
  IL: stateRatesSchema.parse(ilJson),
  NC: stateRatesSchema.parse(ncJson),
  OH: stateRatesSchema.parse(ohJson),
  GA: stateRatesSchema.parse(gaJson),
} as const;

export type StateCode = keyof typeof stateFiles;
export const STATE_CODES = Object.keys(stateFiles) as StateCode[];

export function getStateRates(code: StateCode): StateRates {
  return stateFiles[code];
}

export function isVerified(file: RateFile): boolean {
  return Boolean(file.verifiedBy && file.verifiedOn);
}

/**
 * Preview and local builds set NEXT_PUBLIC_ALLOW_UNVERIFIED=1 so unverified data can be
 * reviewed. Production must leave it unset: a state whose rate files lack a human
 * sign-off is then not generated at all.
 */
export const ALLOW_UNVERIFIED = process.env.NEXT_PUBLIC_ALLOW_UNVERIFIED === "1";

/** True once federal and state rate files both carry a sign-off. */
export function hasSignOff(code: StateCode): boolean {
  return isVerified(federalRates) && isVerified(stateFiles[code]);
}

export function isPublishable(code: StateCode): boolean {
  return ALLOW_UNVERIFIED || hasSignOff(code);
}

export function publishableStates(): StateCode[] {
  return STATE_CODES.filter(isPublishable);
}

/** The older of the two sign-off dates, or null when either file is unsigned. */
export function lastVerifiedOn(code: StateCode): string | null {
  const a = federalRates.verifiedOn;
  const b = stateFiles[code].verifiedOn;
  if (!a || !b) return null;
  return a < b ? a : b;
}

export function sourcesFor(code: StateCode) {
  return [...federalRates.sources, ...stateFiles[code].sources];
}
