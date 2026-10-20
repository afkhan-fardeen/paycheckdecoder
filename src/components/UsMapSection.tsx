import { publishableStates } from "@/lib/rates";
import { buildUsMap } from "@/lib/us-map";
import { StatesMap } from "./StatesMap";

/** Builds the map geometry on the server so the atlas data never reaches the browser. */
export function UsMapSection() {
  const codes = publishableStates();
  if (codes.length === 0) return null;
  return <StatesMap geometry={buildUsMap(codes)} />;
}
