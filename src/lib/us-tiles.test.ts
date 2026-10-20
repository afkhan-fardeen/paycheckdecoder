import { describe, expect, it } from "vitest";
import { TILE_COLUMNS, TILE_LAYOUT, TILE_ROWS } from "./us-tiles";
import { US_STATES } from "./us-states";

describe("tile-grid layout", () => {
  it("places every one of the 50 states exactly once", () => {
    expect(Object.keys(TILE_LAYOUT).sort()).toEqual(US_STATES.map((s) => s.code).sort());
  });

  it("never puts two states in the same cell, and stays inside the grid", () => {
    const seen = new Set<string>();
    for (const [col, row] of Object.values(TILE_LAYOUT)) {
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(TILE_COLUMNS);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(TILE_ROWS);
      const key = `${col},${row}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("keeps neighbours roughly where they are on the map", () => {
    const at = (c: keyof typeof TILE_LAYOUT) => TILE_LAYOUT[c];
    expect(at("CA")[0]).toBeLessThan(at("NY")[0]); // west of east
    expect(at("WA")[1]).toBeLessThan(at("TX")[1]); // north of south
    expect(at("FL")[0]).toBeGreaterThan(at("TX")[0]);
    expect(at("ME")[0]).toBeGreaterThan(at("WA")[0]);
  });
});
