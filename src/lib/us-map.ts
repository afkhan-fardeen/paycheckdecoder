import { geoPath } from "d3-geo";
import type { GeometryCollection, Topology } from "topojson-specification";
import { feature, mesh } from "topojson-client";
import atlas from "us-atlas/states-albers-10m.json";
import type { StateCode } from "./rates";
import { US_STATES, type UsStateCode } from "./us-states";

/** US Census FIPS codes, which is how the atlas identifies each state. */
export const STATE_FIPS = Object.fromEntries(US_STATES.map((s) => [s.code, s.fips])) as Record<
  UsStateCode,
  string
>;

export interface MapState {
  code: StateCode;
  name: string;
  /** SVG path data. */
  d: string;
  /** Centre of the state in map units, for anchoring labels. */
  center: [number, number];
}

export interface UsMapGeometry {
  viewBox: string;
  /** Every state that is not an available calculator, as one path. */
  background: string;
  /** Interior state borders, as one path. */
  borders: string;
  states: MapState[];
}

const topology = atlas as unknown as Topology;
const states = topology.objects.states as GeometryCollection<{ name: string }>;

/**
 * Builds map geometry on the server. The atlas is already projected (Albers USA with Alaska and Hawaii
 * as insets, fitted to 975 x 610), so no projection runs here and none of this data ships to the browser:
 * only the resulting path strings do.
 */
export function buildUsMap(available: StateCode[]): UsMapGeometry {
  const path = geoPath().digits(0);
  const features = feature(topology, states).features;
  const wanted = new Map(available.map((code) => [STATE_FIPS[code], code]));

  const mapStates: MapState[] = [];
  const rest: string[] = [];
  for (const f of features) {
    const d = path(f) ?? "";
    const code = wanted.get(String(f.id));
    if (code) {
      const [cx, cy] = path.centroid(f);
      mapStates.push({ code, name: String((f.properties as { name: string }).name), d, center: [cx, cy] });
    } else {
      rest.push(d);
    }
  }
  // Keep the caller's order so the DOM (and keyboard focus) order is predictable.
  mapStates.sort((a, b) => available.indexOf(a.code) - available.indexOf(b.code));

  return {
    viewBox: "0 0 975 610",
    background: rest.join(""),
    borders: path(mesh(topology, states, (a, b) => a !== b)) ?? "",
    states: mapStates,
  };
}
