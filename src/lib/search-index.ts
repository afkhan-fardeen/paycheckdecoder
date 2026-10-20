import { publishableStates } from "./rates";
import { SALARY_WAGES, salarySlug } from "./salary";
import { STATES } from "./states";

export type SearchKind = "State" | "Tool" | "Hourly wage" | "Page";

export interface SearchItem {
  title: string;
  description: string;
  href: string;
  kind: SearchKind;
  /** Extra words that should find this item: abbreviations, synonyms. */
  keywords: string[];
}

/** Everything the search box can open. Built from the same data the pages use, so it never lists a page that does not exist. */
export function buildSearchIndex(): SearchItem[] {
  const states: SearchItem[] = publishableStates().map((code) => ({
    title: `${STATES[code].name} paycheck calculator`,
    description: STATES[code].tagline,
    href: `/paycheck-calculator/${STATES[code].slug}`,
    kind: "State",
    keywords: [code, STATES[code].name, "take home", "net pay", "tax", "state"],
  }));
  const tools: SearchItem[] = [
    {
      title: "All state calculators",
      description: "Pick a state to estimate take-home pay",
      href: "/paycheck-calculator",
      kind: "Tool",
      keywords: ["states", "paycheck", "take home", "net pay", "calculator"],
    },
    {
      title: "Hourly to salary calculator",
      description: "Convert an hourly wage to yearly, monthly and weekly pay",
      href: "/salary",
      kind: "Tool",
      keywords: ["hourly", "wage", "annual", "yearly", "convert", "per hour"],
    },
    {
      title: "Overtime calculator",
      description: "Time-and-a-half and double-time pay for a week",
      href: "/overtime-calculator",
      kind: "Tool",
      keywords: ["overtime", "time and a half", "double time", "extra hours"],
    },
  ];
  const wages: SearchItem[] = SALARY_WAGES.map((w) => ({
    title: `$${w} an hour is how much a year?`,
    description: "Hourly to salary conversion",
    href: `/salary/${salarySlug(w)}`,
    kind: "Hourly wage",
    keywords: [`${w}`, "hourly", "salary", "per hour", "annual"],
  }));
  const pages: SearchItem[] = [
    {
      title: "Methodology and sources",
      description: "How every number is calculated, with sources",
      href: "/methodology",
      kind: "Page",
      keywords: ["how", "sources", "rates", "irs", "accuracy"],
    },
    {
      title: "About Paycheck Decoder",
      description: "Who we are and how we work",
      href: "/about",
      kind: "Page",
      keywords: ["company", "team"],
    },
    {
      title: "Contact",
      description: "Report an error or ask a question",
      href: "/contact",
      kind: "Page",
      keywords: ["email", "support", "report", "error"],
    },
    {
      title: "Disclaimer",
      description: "Results are estimates, not advice",
      href: "/disclaimer",
      kind: "Page",
      keywords: ["legal", "advice"],
    },
    {
      title: "Privacy policy",
      description: "What we collect and what we do not",
      href: "/privacy",
      kind: "Page",
      keywords: ["legal", "cookies", "data"],
    },
    {
      title: "Terms of use",
      description: "Terms for using the site",
      href: "/terms",
      kind: "Page",
      keywords: ["legal"],
    },
  ];
  return [...states, ...tools, ...wages, ...pages];
}

const norm = (s: string) => s.toLowerCase().replace(/[$,]/g, "").replace(/\s+/g, " ").trim();

function scoreItem(item: SearchItem, tokens: string[]): number {
  const title = norm(item.title);
  const titleWords = title.split(" ");
  const desc = norm(item.description);
  const keys = item.keywords.map(norm);
  let total = 0;
  for (const t of tokens) {
    let s = 0;
    if (title.startsWith(t)) s = 100;
    else if (titleWords.some((w) => w.startsWith(t))) s = 70;
    else if (keys.some((k) => k === t)) s = 60;
    else if (keys.some((k) => k.startsWith(t))) s = 45;
    else if (title.includes(t)) s = 30;
    else if (desc.includes(t) || keys.some((k) => k.includes(t))) s = 15;
    if (s === 0) return 0; // every word must match something
    total += s;
  }
  return total;
}

/** Ranked matches for a query. All words must match. An empty query returns the popular list. */
export function searchItems(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const tokens = norm(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return popularItems(items, limit);
  return items
    .map((item, i) => ({ item, i, score: scoreItem(item, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((r) => r.item);
}

/** What shows before the visitor types: tools first, then the first few states. */
export function popularItems(items: SearchItem[], limit = 8): SearchItem[] {
  const tools = items.filter((i) => i.kind === "Tool");
  const states = items.filter((i) => i.kind === "State");
  return [...states.slice(0, Math.max(0, limit - tools.length)), ...tools].slice(0, limit);
}
