import type { MetadataRoute } from "next";
import { publishableStates } from "@/lib/rates";
import { SALARY_WAGES, salarySlug } from "@/lib/salary";
import { absoluteUrl } from "@/lib/site";
import { STATES } from "@/lib/states";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = [
    "/",
    "/paycheck-calculator",
    "/salary",
    "/overtime-calculator",
    "/methodology",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/disclaimer",
  ];
  return [
    ...fixed.map((p) => ({ url: absoluteUrl(p) })),
    ...publishableStates().map((c) => ({ url: absoluteUrl(`/paycheck-calculator/${STATES[c].slug}`) })),
    ...SALARY_WAGES.map((w) => ({ url: absoluteUrl(`/salary/${salarySlug(w)}`) })),
  ];
}
