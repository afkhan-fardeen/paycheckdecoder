import { describe, expect, it } from "vitest";
import { STATE_CODES } from "./rates";
import { STATES } from "./states";
import { buildUsMap, STATE_FIPS } from "./us-map";

describe("buildUsMap", () => {
  const map = buildUsMap(STATE_CODES);

  it("returns one path per available state, in the order asked for", () => {
    expect(map.states.map((s) => s.code)).toEqual(STATE_CODES);
    for (const s of map.states) {
      expect(s.d.startsWith("M")).toBe(true);
      expect(s.d.length).toBeGreaterThan(100);
    }
  });

  it("atlas names agree with our state names, so a FIPS typo cannot slip through", () => {
    for (const s of map.states) expect(s.name).toBe(STATES[s.code].name);
  });

  it("centres fall inside the 975 x 610 map", () => {
    for (const s of map.states) {
      expect(s.center[0]).toBeGreaterThan(0);
      expect(s.center[0]).toBeLessThan(975);
      expect(s.center[1]).toBeGreaterThan(0);
      expect(s.center[1]).toBeLessThan(610);
    }
  });

  it("draws the other states and the borders, and stays small enough to inline", () => {
    expect(map.viewBox).toBe("0 0 975 610");
    expect(map.background.length).toBeGreaterThan(10_000);
    expect(map.borders.length).toBeGreaterThan(5_000);
    const total = map.background.length + map.borders.length + map.states.reduce((n, s) => n + s.d.length, 0);
    expect(total).toBeLessThan(100_000);
  });

  it("has a FIPS entry for every state we publish", () => {
    expect(Object.keys(STATE_FIPS).sort()).toEqual([...STATE_CODES].sort());
  });

  it("an unavailable state is not drawn as interactive", () => {
    const only = buildUsMap(["TX"]);
    expect(only.states).toHaveLength(1);
    expect(only.background.length).toBeGreaterThan(map.background.length);
  });
});
