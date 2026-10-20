import { describe, expect, it } from "vitest";
import { buildSearchIndex, popularItems, searchItems } from "./search-index";

const index = buildSearchIndex();
const top = (q: string) => searchItems(index, q, 5).map((i) => i.title);

describe("search index", () => {
  it("lists every state, tool, hourly wage and trust page with a real href", () => {
    expect(index.filter((i) => i.kind === "State").length).toBeGreaterThanOrEqual(1);
    expect(index.filter((i) => i.kind === "Hourly wage")).toHaveLength(25);
    for (const item of index) expect(item.href.startsWith("/")).toBe(true);
    expect(new Set(index.map((i) => i.href)).size).toBe(index.length);
  });

  it("finds a state by name, abbreviation and partial name", () => {
    expect(top("texas")[0]).toBe("Texas paycheck calculator");
    expect(top("TX")[0]).toBe("Texas paycheck calculator");
    expect(top("north car")[0]).toBe("North Carolina paycheck calculator");
  });

  it("finds hourly wages by number, with or without a dollar sign", () => {
    expect(top("25")).toContain("$25 an hour is how much a year?");
    expect(top("$25")[0]).toBe("$25 an hour is how much a year?");
  });

  it("finds tools by synonym", () => {
    expect(top("time and a half")[0]).toBe("Overtime calculator");
    expect(top("convert hourly")[0]).toBe("Hourly to salary calculator");
    expect(top("sources")[0]).toBe("Methodology and sources");
  });

  it("requires every word to match, and returns nothing for gibberish", () => {
    expect(top("texas banana")).toHaveLength(0);
    expect(top("zzzzqqq")).toHaveLength(0);
  });

  it("an empty query returns the popular list within the limit", () => {
    const r = searchItems(index, "   ", 6);
    expect(r.length).toBeLessThanOrEqual(6);
    expect(r).toEqual(popularItems(index, 6));
    expect(r.some((i) => i.kind === "Tool")).toBe(true);
  });
});
