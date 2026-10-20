import demand from "@/data/search-demand.json";
import federalJson from "@/data/rates/federal-2026.json";
import { stateRateFiles } from "@/data/rates";
import { federalRatesSchema, stateRatesSchema, type RateFile, type StateRates } from "./rates-schema";

/** Parsed at import time, so malformed rate files fail the build instead of reaching a page. */
export const federalRates = federalRatesSchema.parse(federalJson);

export type StateCode = keyof typeof stateRateFiles;

const volume = demand.volume as Record<string, number>;

/** Every state with a rate file, most searched first (Ahrefs "X paycheck calculator" volume), then A to Z. */
export const STATE_CODES = (Object.keys(stateRateFiles) as StateCode[]).sort(
  (a, b) => (volume[b] ?? 0) - (volume[a] ?? 0) || a.localeCompare(b),
);

const stateFiles = Object.fromEntries(
  STATE_CODES.map((code) => [code, stateRatesSchema.parse(stateRateFiles[code])]),
) as Record<StateCode, StateRates>;

export function getStateRates(code: StateCode): StateRates {
  return stateFiles[code];
}

/** Monthly US searches for "<state> paycheck calculator", from src/data/search-demand.json. */
export function searchVolume(code: StateCode): number {
  return volume[code] ?? 0;
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
