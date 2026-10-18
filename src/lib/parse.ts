/** Parses what a visitor typed into a money or number field. Blank gives `blank`, junk gives NaN. */
export function parseNumber(raw: string, blank = NaN): number {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (cleaned === "") return blank;
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === ".") return NaN;
  return Number(cleaned);
}
