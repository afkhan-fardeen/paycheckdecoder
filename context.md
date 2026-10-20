# Paycheck Decoder: project context

Read this first. It replaces opening the PRD, design system and design canvas. Last updated 2026-10-19.

## 1. What this is

paycheckdecoder.com: a free US take-home-pay site. State paycheck calculators, an hourly-to-salary converter and an overtime calculator. Revenue is display ads (AdSense first), partner offers later. Owner: Fardeen. Publisher is based in Bahrain (AdSense payee and US tax setup needs an accountant).

Why this niche (Ahrefs, US, checked 2026-10-18): about 400k monthly searches across state paycheck terms, KD 0-15 on main state terms, small sites (DR 24-29) already rank. State calculators get about 1.2 clicks per search; hourly-to-annual queries only about 0.2, so converters are funnels into state calculators, not income pages. Revenue scenarios (assumptions, not a forecast): about $420 / $1,270 / $3,200 a month at maturity (12-24 months).

**Biggest risk: a wrong tax number.** Accuracy controls come before page count.

## 2. Source documents (already read, summarized here)

| Doc             | Link                                      | Holds                                                     |
| --------------- | ----------------------------------------- | --------------------------------------------------------- |
| PRD             | owner's document (link kept by the owner) | Scope, releases, SEO, ads, legal, KPIs, publishing plan   |
| Design system   | owner's document (link kept by the owner) | Tokens, README brand book, 9 component previews           |
| Design previews | owner's document (link kept by the owner) | 4 artboards: home, Texas desktop, converter, Texas mobile |

Their CSS is ported into `src/styles/` (tokens.css, components.css, site.css). The previews' dollar figures were sample layout values and are **wrong** (they show $1,721.00 for $2,000 biweekly Texas; the engine gives $1,690.85). Never copy numbers from the previews.

## 3. Status (2026-10-18)

Built and passing: Next.js app, calculation engine, rate files for federal + 9 states (TX, FL, TN, NV from v1; WA, IL, NC, OH, GA from v1.1), all page types, trust pages, sitemap/robots/llms.txt, JSON-LD, CI, 51 unit tests, 33 browser smoke checks (desktop and 390px). Build is fully static (50 pages in preview mode).

**Not launched.** Nothing is deployed and no domain is bought. All work is pushed to https://github.com/afkhan-fardeen/paycheckdecoder.git (`main`). Commits are authored as the repo owner; the two earliest commits carry a co-author trailer that the owner chose to leave. Do not add co-author trailers to new commits.

**All ten rate files (federal + 9 states) were signed off on 2026-10-18** as "Fardeen", on the owner's instruction, after the numbers were compared with the official sources in each file (see section 6). A production build now generates all 9 state pages. The gate still exists: any new or changed rate file without a sign-off is hidden from production. Local/preview builds set `NEXT_PUBLIC_ALLOW_UNVERIFIED=1`.

## 4. Stack and decisions

- Next.js 16.4 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4, `geist` font package, zod 4 (rate-file schemas), vitest, tsx, playwright-core (system Chrome smoke test).
- **Next 16 has breaking changes.** Docs ship in `node_modules/next/dist/docs/`; `AGENTS.md` says to read them before writing Next code. `params`/`searchParams` are Promises; use the global `PageProps<'/route'>` / `LayoutProps<'/'>` helpers (run `npx next typegen` if types are missing).
- Everything is statically generated; every calculation runs in the visitor's browser (no backend, pay inputs never leave the device).
- `next.config.ts` must keep the `turbopack.rules` `*.css` -> `@tailwindcss/turbopack` entry, or Tailwind silently stops working. `cacheComponents` and `partialPrefetching` (scaffold defaults) were removed on purpose.
- Scripts that use top-level await must be `.mts` (package is CommonJS).
- **Light theme only in v1.** The PRD mentions light and dark; the design system defers dark. Tokens are structured for a future theme. Open conflict: confirm with Fardeen.
- Hosting plan: Vercel. The Hobby plan is described as non-commercial: plan on a paid plan and verify current terms before enabling ads.
- Budget rule: no spend beyond hosting and domain before the month-6 kill gate.

## 5. Tax engine (`src/engine/`)

Pure TypeScript, no I/O. Money is **integer cents** everywhere; format only at the edge (`formatCents`, `formatWhole`, `formatPercent` in `money.ts`).

`calculatePaycheck(input, {federal, state})` method:

1. Annualize gross per paycheck by periods (weekly 52, biweekly 26, semimonthly 24, monthly 12).
2. Income-tax wages = gross - 401(k) - health/HSA. FICA wages = gross - health/HSA.
3. Federal = brackets(income-tax wages + W-4 4a - W-4 4b - standard deduction) - W-4 step 3 credits, floored at 0, divided by periods, plus 4c extra withholding. Equivalent to the Pub 15-T percentage method for a post-2020 W-4 with step 2 **unchecked**.
4. Social Security 6.2% up to wage base (cap spread evenly across paychecks); Medicare 1.45%; Additional Medicare 0.9% above $200,000 (spread evenly).
5. State income tax by the method in the state's rate file (`src/engine/state.ts`): `none`; `flat` = (annual income-tax wages - standard deduction - allowances x allowance amount) x rate, optionally rounded to the whole dollar per paycheck (NC); `tiered` = TW = wages - exemptions x amount, then tier base + (TW - tier floor) x rate (Ohio). Allowances/exemptions/dependents come from `stateAllowances` (IL-W-4 line 1, NC-4, Ohio IT 4, Georgia G-4), default 0, and the field only appears for states that use it (`allowanceLabel` in `src/lib/states.ts`). Employee-paid state programs (`programs` in the rate file: Washington PFML and WA Cares) apply to **gross** wages, with an optional annual wage cap and employee share, in the `statePrograms` line. Local = user-entered percent of income-tax wages.
6. Each line rounded to the cent per paycheck; `annual = perPeriod * periods` so columns add up. Net = gross minus all lines. Throws `RangeError` on invalid input or if deductions exceed pay; `validateInput` returns field messages shown after "Error:".

Other modules: `hourly.ts` (hourly -> yearly/monthly/biweekly/weekly/daily, 8-hour day), `overtime.ts` (threshold 40, multiplier 1.5 or 2), `breakdown.ts` (the six bar slices: net, federal, social, medicare incl. additional, state+local, deductions).

**Not modelled** (also listed on /methodology): W-4 step 2 multiple-jobs checkbox, supplemental/bonus wage rates, mid-year cap cut-off, garnishments, Illinois IL-W-4 line 2 allowances ($1,000 each), Georgia two-earner married deduction, Washington program exemptions and workers' compensation employee share, Ohio's pre-Aug-2026 withholding tables.

Tests (`*.test.ts`): federal golden cases worked by hand from the IRS tables (arithmetic is in the comments), bracket continuity and Rev. Proc. base amounts, 500-case invariant test (lines sum to gross), validation, rate-schema tests; `state.test.ts` reproduces the **official worked examples** from Georgia (two), North Carolina and Illinois (formula check) plus hand-computed Ohio and Washington cases. Federal tests verify arithmetic, not the IRS: official Pub 15-T worked examples must still be added at sign-off.

### Verified 2026 federal facts

Read from IRS Rev. Proc. 2025-32 (https://www.irs.gov/pub/irs-drop/rp-25-32.pdf) on 2026-10-18, sections 4.01 and 4.14:

- Standard deduction: single $16,100, married filing jointly $32,200, head of household $24,150.
- Brackets (10/12/22/24/32/35/37%), upper limits. Single: 12,400 / 50,400 / 105,700 / 201,775 / 256,225 / 640,600. MFJ: 24,800 / 100,800 / 211,400 / 403,550 / 512,450 / 768,700. HoH: 17,700 / 67,450 / 105,700 / 201,750 / 256,200 / 640,600. Base amounts in the Rev. Proc. tables are asserted in tests.

### Verified 2026 state facts (read from official documents 2026-10-18, still unsigned)

- **Illinois** (Booklet IL-700-T, R-12/25): 4.95% flat, $2,925 per line-1 allowance, no standard deduction. Official example $800 weekly with 2 line-1 + 2 line-2 allowances = $32.13.
- **North Carolina** (2026 NC-30, annualized method): withholding rate 4.09% (3.99% + 0.1%), standard deduction $12,750 single/married and $19,125 head of household, $2,500 per allowance, rounded to the whole dollar. Official example: $450 weekly, 2 allowances = $4.
- **Georgia** (2026 Employer's Tax Guide, revised June 2026, pp. 51-52): 4.99% flat (was 5.19%; employers could switch from 2026-05-11), standard deduction $30,000 married filing jointly / $15,000 otherwise, $5,000 per dependent. Official example: $2,000 semi-monthly, married, 1 dependent = $27.03.
- **Ohio** (Optional Computer Formula Rev. 07/26, effective Aug 1 2026; the PDF text layer is broken so it was read from the rendered page): TW = pay x periods - $650 x exemptions; up to $26,050 x 1.6%; $26,050-$100,000: $416.80 + 2.99% of excess; over $100,000: $2,627.91 + 3.4% of excess. No official worked example.
- **Washington** (paidleave.wa.gov, wacaresfund.wa.gov): PFML total 1.13% of gross wages, employees pay 71.43%, capped at $184,500; WA Cares 0.58% of gross wages, no cap, employee-paid. "No personal income tax" is from general knowledge, not read from dor.wa.gov.

### Closed on 2026-10-18 before sign-off

- Social Security wage base $184,500: SSA (via search results quoting ssa.gov; its pages block automated fetch) and the WA Paid Leave page.
- Additional Medicare 0.9% over $200,000, no filing-status difference: IRS Topic 751.
- Pub 15-T (2026) percentage method read: single and married schedules and the $8,600 / $12,900 adjustments match the engine's standard-deduction method exactly; asserted in a test.
- "No state income tax on wages" for TX (Comptroller), FL (Department of Revenue FAQ), NV (Department of Taxation), TN (Department of Revenue; Hall tax repealed 2021) and WA (Department of Revenue). Note: WA adds a 9.9% tax on income over $1,000,000 from 2028 (SB 6346), which does not affect wages in 2026.

**Still not independently verified**: the Pub 15-T head of household schedule (rests on Rev. Proc. 2025-32 only); every sentence in `src/lib/states.ts` (editorial: employer-paid programs, "no local income tax" claims, Ohio municipal and school district taxes); W-4 dependent credit amounts; whether WA PFML wages exclude Section 125 premiums and the under-50-employee rule; Washington workers' compensation employee share (not researched); whether allowance defaults of 0 are sensible; a second reviewer for the Ohio figures, which were read from a rendered PDF page.

## 6. Rate data and the sign-off gate

- Files: `src/data/rates/<jurisdiction>-<year>.json` (`federal-2026.json` and state files `tx fl tn nv wa il nc oh ga`). Fields: jurisdiction, taxYear, effectiveFrom/To, type, method, parameters, sources[{name,url}], retrievedOn, verifiedBy, verifiedOn, notes. Schemas: `src/lib/rates-schema.ts` (zod; a malformed file fails the build). State files are a discriminated union on `method` (`none`, `flat`, `tiered`) plus an optional `programs` array. A new method needs an engine implementation, a `describeStateRules` branch (`src/lib/state-methods.ts`) and golden tests from the state's official examples first. Loader: `src/lib/rates.ts`.
- **Sign-off status: all files signed** (`verifiedBy: "Fardeen"`, `verifiedOn: 2026-10-18`). Everything below about `null` values describes the state before that and is kept for the record.
- Before sign-off all files had `verifiedBy: null`. TX/FL/TN/NV have `retrievedOn: null` (entered from general knowledge, not read from the agency page); WA/IL/NC/OH/GA have `retrievedOn: 2026-10-18` because their numbers were read from the official documents listed in each file's `sources` and `notes`.
- Page text with numbers (rules list, answer sentence, table notes, methodology state section) is generated from the rate files by `src/lib/state-methods.ts`, so hand-written copy in `states.ts` deliberately contains no rates.
- `isPublishable(code)` = federal AND state file signed off, or `NEXT_PUBLIC_ALLOW_UNVERIFIED=1`. Production leaves the flag unset, so unsigned states are not generated, not listed in the sitemap/llms.txt/pickers, and the overtime/home calculators hide the state-dependent parts.
- The on-page "Rates verified {date}" is `min(federal.verifiedOn, state.verifiedOn)`. Unsigned pages show "Preview: rates not signed off yet".
- Sign-off = a person compares the file and the state's editorial text (`src/lib/states.ts`) with official sources, tests pass, then `npm run signoff -- federal tx fl tn nv --by "Name"`, then `npm run check:rates:prod` (fails if anything is unsigned). Details: `docs/runbook.md`.
- Update process target: weekly scheduled check of IRS/SSA/state pages that opens a PR when something differs (**not built yet**), human review, tests green, redeploy. Rate changes are never auto-published. January is a full update sprint. Rates change mid-year (CA SDI 0.9% in 2023 to 1.3% in 2026; Ohio tables changed Oct 1 2025 and Aug 1 2026), so files carry effectiveFrom/To.

## 7. Routes and page anatomy

| Route                                                      | File                                           | Notes                                                                                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                                                        | `src/app/page.tsx`                             | Hero with search and combined calculator, stat strip, state-comparison chart, state cards, tools, how it works, popular wages, sources band, FAQ |
| `/paycheck-calculator`                                     | `.../page.tsx`                                 | State index                                                                                                                                      |
| `/paycheck-calculator/[state]`                             | `.../[state]/page.tsx`                         | Core earner. `dynamicParams=false`, params from `publishableStates()`                                                                            |
| `/salary`, `/salary/[n]-an-hour-is-how-much-a-year`        | `src/app/salary/`                              | 25 wages in `src/lib/salary.ts`; slug parsed by `wageFromSlug` (Next cannot do partial-segment params)                                           |
| `/overtime-calculator`                                     | `src/app/overtime-calculator/`                 | Weekly gross plus optional net                                                                                                                   |
| `/methodology /about /contact /privacy /terms /disclaimer` | `src/app/<name>/`                              | Methodology is rendered from the rate data so it cannot drift. Privacy and Terms are **drafts needing a lawyer**                                 |
| `/sitemap.xml /robots.txt /llms.txt`                       | `sitemap.ts`, `robots.ts`, `llms.txt/route.ts` | robots disallows everything unless `INDEXABLE`                                                                                                   |

State page order (server-rendered, numbers in initial HTML): breadcrumbs (+BreadcrumbList), one H1, AnswerBlock (two sentences from the engine for the $52,000 single biweekly example), Calculator (inputs, result, breakdown bar, VerifiedStamp), breakdown table, "How {state} payroll tax works" (structure, programs, local note, reviewer/date), take-home table at $30k/$52k/$75k/$100k/$150k, FAQ (4 state-specific questions + FAQPage JSON-LD), related links. JSON-LD: WebApplication, BreadcrumbList, FAQPage. Unique title/description/canonical per page.

Calculator behavior (`src/components/Calculator.tsx`, logic in `src/lib/estimate.ts`): result updates on Calculate or 500 ms after typing stops (live region `aria-live="polite"`); Reset restores defaults; errors are inline with "Error:" and `aria-describedby`. Inputs: pay type, amount, hours (hourly), frequency, filing status, 401(k), health/HSA, after-tax, local rate %, and an Advanced W-4 section (steps 3, 4a, 4b, 4c). Segmented controls are radio groups with arrow-key support.

## 8. Design system rules (ported from the Paycheck Decoder design system)

- Never hardcode hex; use tokens in `src/styles/tokens.css` (also mapped into Tailwind via `@theme inline` in `globals.css`). Component classes (`pd-*`) are in `components.css`; page layout in `site.css`.
- Look: white cards (`surface-200`) on soft grey (`surface-100`), `ink` text, Geist thin and tight, almost no decoration. Headings weight 500 with negative tracking; take-home figure weight 300 at 56px with tabular numerals (`pd-num`).
- `net` green (#047857) is reserved for money the user keeps (take-home figure, net slice). `link` blue for links only. Errors use `danger` plus the word "Error".
- Breakdown colors: federal blue, Social Security orange, Medicare gold, state teal, deductions slate, net green; always labeled in words. The bar is plain HTML/CSS, no chart library; `BreakdownTable` is the accessible/crawlable twin.
- Spacing `space-1..8` (4,8,12,16,24,32,48,72), radii 6/10/16/pill, `shadow-sm` on cards, `shadow-md` only on the result panel. No gradients, glows, photos or illustrations. Touch targets >= 44px. Focus ring 3px `focus` with 2px offset, never removed. Contrast: text 4.5:1, meaningful marks 3:1 (WCAG 2.1 AA).
- Motion: 120ms transitions, disabled under `prefers-reduced-motion`.
- **Icons:** Lucide (the design system's icon set), 1.5px stroke, decorative (`aria-hidden`) and always beside a text label. Used through the `lucide-react` package so SVGs are bundled into the pages (no runtime CDN fetch: avoids an external dependency, layout shift and a CSP hole). Places: header menu, Calculate/Reset/Open buttons, FAQ and disclosure chevrons, breadcrumb and state-card chevrons, home tool and trust chips (`IconChip`), error and verification stamps.
- **Mobile (<= 640px):** inline nav collapses to a Menu button (`MobileNav`: Escape and outside-click close, 48px rows); option groups become even grids (`data-n` on `.pd-seg`: 2, 3 or 4 options); optional inputs live in labelled collapsible sections (`Disclosure`: 401(k), health, after-tax, state allowance, local rate; W-4 details) that open themselves if a field inside has an error; buttons share the row; the breakdown table hides the Share column; Calculate scrolls the result into view (below 900px, honours reduced motion); safe-area insets respected. Checked at 320, 360 and 390px in `scripts/smoke.mts`; touch targets are asserted >= 44px.
- Copy: plain "you", sentence case, no exclamation marks/emoji/hype. Put "estimate" beside every computed figure; never "exact", "official" or "guaranteed". Cents on per-paycheck amounts ($1,721.00), whole dollars on annual headlines ($44,746), percentages at most one decimal. Frequencies: Weekly, Every two weeks, Twice a month, Monthly. Notice: "Estimate only. Your employer's payroll system may differ. Not tax advice." Never imitate an employer document (no pay date, check number, employee ID).
- Components live in `src/components/`. Client: Calculator, QuickCalculator, HourlyConverter, OvertimeCalculator, StateComparison, TakeHomeChart, StatesMap, StateExplorer, SearchPalette, SearchButton, CalculatorsMenu, MobileNav, Disclosure, Field, Segmented. Server: UsMapSection, BreakdownBar, BreakdownTable, AnswerBlock, VerifiedStamp, Faq, StateCard, StateRail, StatCard, SectionHeader, IconChip, Breadcrumbs, AdSlot, ContentColumns, ProsePage, JsonLd, SiteHeader, SiteFooter, PreviewBanner.

### Enterprise UI layer (added 2026-10-20, `src/styles/enterprise.css`)

This extends the original design system (same tokens, Geist, light theme, Lucide icons) with a fuller site shell. The design-system README's "almost no decoration" rule still holds: no gradients, no illustrations, no chart library.

- **Grid and layout:** `.container` (max 1200px, 24px gutters, 16px on phones), 12-column `.hero-grid`, `.section` / `.band` alternating sections, `.card-grid` (`.wide` = 3 across, `.cols-3`), `.cols` main column plus right rail. Any multi-column grid with a wide gap must collapse to one column on phones (a 12-column grid with 48px gaps is 528px wide: that was a real overflow bug).
- **Header:** sticky, brand, `CalculatorsMenu` dropdown (all published states), links, search bar with a shortcut hint; phones get a search icon and the Menu button. Footer: trust row, brand blurb, five link columns (Calculators, Tools, Official sources, Company, legal), base line.
- **Search** (`src/lib/search-index.ts`, `SearchPalette`): Ctrl/Cmd+K or "/" opens a native `<dialog>` palette; arrows move, Enter opens, Esc closes. The index is built from the same data as the pages (published states, tools, 25 hourly wages, trust pages) so it can never link to a missing page; every word must match; scoring favours title prefix, then keywords. The dialog element is the source of truth for open/closed (no `open` state: React 19 lint forbids setting state in effects). Known Chrome quirk handled: a closed dialog can keep focus on its input, so the "/" shortcut ignores key events whose target is inside a closed palette.
- **Charts** (real engine numbers, no invented data; `src/lib/compare.ts`): `StateComparison` (home) is a stacked-bar comparison of one salary across all states with salary and filing toggles, using the same slice colours as the breakdown bar. `TakeHomeChart` (state page) is an SVG take-home-versus-salary line chart with a range slider, a readout and a data table; it uses a narrower drawing on phones because SVG text scales with the drawing. Both have text equivalents.
- **State page:** key-facts cards, calculator, breakdown table, rules, chart, salary table, FAQ, plus a right rail (`StateRail`: on-this-page links, comparison with other states, sources). The rail is also where the ad unit goes once ads are enabled.
- **States index:** `StateExplorer` with text filter and a how-the-state-taxes-wages filter (no income tax, flat, graduated).
- **US map** (`StatesMap`, `UsMapSection`, `src/lib/us-map.ts`, `src/styles/map.css`; libraries `d3-geo`, `topojson-client`, `us-atlas`): the geometry is built on the server from the pre-projected `states-albers-10m` atlas (Albers USA, Alaska and Hawaii inset, 975 x 610) and inlined as SVG paths (about 90KB); the atlas and d3 never reach the browser. Published states are real links (`a.map-state`, keyboard focusable, descriptive aria-labels); every other state is one inert background path ("coming soon"). Colour by take-home (five-step ramp, darker = more kept, recalculated from the engine for $40k to $150k) or by how the state taxes pay (none, flat, graduated). Hover or focus previews a state in the side panel and tooltip; on touch the first tap previews (and outlines) and the second opens, so small fingers do not misfire. Adding a state to the map needs its FIPS code in `STATE_FIPS` (a test checks the atlas names match `STATES`). Used on the home page and the states index. Tiny eastern states will need a zoom or inset when they are added.
- **Tests:** `search-index.test.ts`, `compare.test.ts`, and smoke checks for search, dropdown, chart toggles, slider, filters, footer, phone menu, palette fit, 44px targets, and no horizontal scroll at 320/360px.

## 9. Ads and monetization

- Phase 1 Google AdSense once 30+ real pages are indexed; phase 2 premium network when traffic qualifies (verify minimums); phase 3 affiliate/lead partners (check licensing and disclosure rules per product first).
- `AdSlot` renders **nothing** unless `NEXT_PUBLIC_ADS_ENABLED=1`; with `NEXT_PUBLIC_ADSENSE_CLIENT` and a `slot` id it renders an `<ins>`; the AdSense script is loaded in `layout.tsx` only when both are set. `ContentColumns` drops the rail column when ads are off.
- Rules: every slot labeled "ADVERTISEMENT" with reserved height (CLS <= 0.1); no ad within 48px of an input/button or between inputs and the result, never inside the AnswerBlock; desktop one sticky 300px rail unit; mobile one unit under the result and one between sections; max three visible; no pop-ups, interstitials, sticky bottom bars or auto-refresh. Re-check current AdSense policies before final layout. The result-page slot placement on mobile still has to be added when ads go live.
- AdSense basics: own policy-compliant content, publisher 18+, HTML access, custom domain, privacy/about/contact pages, HTTPS, `ads.txt` (not created yet; needs the publisher id), review takes days to weeks. Consent tool for EEA/UK: undecided.

## 10. Environment variables

See `.env.example` (copy to `.env.local`). `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ALLOW_UNVERIFIED` (never in production), `NEXT_PUBLIC_INDEXABLE` (self-hosted prod only; on Vercel indexing is automatic when `VERCEL_ENV=production`), `NEXT_PUBLIC_ADS_ENABLED`, `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_CONTACT_EMAIL`. Preview and local builds send `noindex` and a `Disallow: /` robots.txt. Security headers (nosniff, X-Frame-Options DENY, referrer policy, permissions policy) are set in `next.config.ts`; no CSP yet (AdSense makes it non-trivial).

## 11. Commands

`npm run dev` / `build` / `start`; `npm run check` (typecheck + lint + tests); `npm test`; `npm run check:rates` (schema + sign-off status); `npm run check:rates:prod` (fails if anything unsigned); `npm run signoff -- federal tx --by "Name"`; `npm run smoke` (browser checks against a running server, `BASE_URL=http://localhost:3111`); `npx next typegen`.

CI (`.github/workflows/ci.yml`): check:rates, typecheck, lint, test, build with unsigned rates allowed. It runs on GitHub Actions for every push to `main` and pull request. **Gotcha fixed 2026-10-19:** the first three runs failed at typecheck because `PageProps`/`LayoutProps` are generated into `.next/` by Next, which a fresh checkout lacks; the `typecheck` script now runs `next typegen` first. To reproduce a clean checkout locally: `rm -rf .next next-env.d.ts tsconfig.tsbuildinfo`, then run the steps in order. Check run status without logging in at `https://api.github.com/repos/afkhan-fardeen/paycheckdecoder/actions/runs` (the repo is public).

## 12. KPIs and kill gate

Kill or pivot if fewer than about 5k organic visits a month across 50+ indexed pages at month 6. Weekly: indexed vs submitted, impressions/clicks/position per state page (Search Console, Ahrefs rank tracking), calculator completions per visit (privacy-conscious analytics, tool not chosen), calculation errors reported. Monthly: pageviews per visit, ad RPM. Core Web Vitals on mobile: LCP <= 2.5s, CLS <= 0.1, INP <= 200ms.

## 13. Roadmap (from the PRD)

- v1 (about 95k searches: TX 46k, FL 32.7k, TN 11.2k, NV 5.1k): federal engine, TX/FL/TN/NV, top 20-30 converter pages, overtime, trust pages. **Code done; awaiting sign-off and deployment.**
- v1.1: WA, IL, NC, OH (user-entered local rate), GA. **Code done 2026-10-18** (flat and tiered methods, state allowances, WA programs, official-example tests); awaiting sign-off like v1. Search volume for these states is not yet totaled in Ahrefs.
- v1.2: 8-10 states a month (CA, NJ, PA, MI, VA, CO ...).
- v2: bonus/supplemental pay, pre-tax options, state comparison tool, data-study pages.
- Milestones: M0 setup (week 1), M1 engine (weeks 1-3), M2 launch 30+ pages (weeks 3-5), M3 AdSense application (weeks 5-8), M4 25+ states (months 2-5), M5 gate (month 6), M6 scale (months 7-12). Non-goals for v1: accounts, saved data, payroll, filing, tax advice, pay-stub generator, local-tax databases, non-US countries.

## 14. Open items

Human decisions: who approves rate changes (owner or named reviewer); analytics tool and consent setup; AdSense payee and tax setup (accountant); UK/Canada after year one; dark mode vs light only; contact mailbox (`hello@paycheckdecoder.com` is a placeholder, not created).

Before launch (see `docs/runbook.md`): have a second person re-check the signed files, especially Ohio and the editorial text; trademark check for "Paycheck Decoder" (USPTO + web, not done); buy domain (checked 2026-10-18 on Vercel: $11.25 first year and renewal, not purchased); lawyer review of Privacy/Terms/Disclaimer; sign off rate files; verify SS wage base and add Pub 15-T worked examples as golden tests; Vercel plan terms for an ad-supported site; confirm top 25 converter wages in Ahrefs (the list is a guess); favicon exists (`src/app/icon.svg`) but there is **no social/OG image yet**; add `ads.txt`; Google Search Console (DNS) and Bing Webmaster; Lighthouse/axe pass on real devices.

Engineering backlog: weekly rate-source monitor and PR bot; weekly summary (unindexed pages, pages losing position, rate files due); W-4 step 2 and supplemental wages; mobile ad placement; JSON-LD `llms.txt` pointers to a rates page; run smoke test in CI; "Guides" pages (`/guides/[state]-payroll-taxes`, v1.1+); Ahrefs volume beyond top 100 rows and per-state SERP competitors (not verified).

## 15. Conventions

- Do not invent tax numbers. Every rate comes from a rate file with a source; if you cannot read the source, leave `retrievedOn`/`verifiedBy` null and say so.
- Money in cents; engine stays pure and framework-free; rates are passed in, never imported by the engine.
- Match the design system and copy rules above; update this file when a decision or number changes.
- Do not commit, push, deploy, buy a domain or sign off rate files without Fardeen asking.

## 16. 50-state expansion (2026-10-20, uncommitted, all new states unsigned)

- 32 states have rate files: the 9 signed originals plus 23 new ones (AK AR AZ CA CO IA KY MA MD ME MI MN MO ND NE NH NY OK PA SD VA WI WY), all `verifiedBy: null`, so production hides them until signed. Register a new file with `npm run gen:rates` (rebuilds `src/data/rates/index.ts`), add a `SPECS` entry in `src/lib/states.ts`, and add official-example tests in `src/engine/states-batch1.test.ts`.
- Engine rules added (declarative, in the rate file `parameters`): brackets method, allowance tiers, low-income exemption, phase-outs, allowance credits, FICA deduction cap, retirement add-back, annual rounding, `localTaxBase`.
- Still to research from official sources: AL CT DE HI KS LA MS MT NJ NM OR RI VT WV. Excluded for now: ID, IN, UT (agency sites unreachable), SC (2026 tables pending). Oregon needs a federal-tax subtraction rule in the engine.
- Search demand per state: `src/data/search-demand.json` (Ahrefs, 2026-10-20). `STATE_CODES` and cards are ordered by it.
- Map: `StatesMap` has a Map/Tiles toggle (`src/lib/us-tiles.ts`, 11x8 grid; toggle hidden at <=640px) and a "Jump to a state" select. Home shows the 12 most searched states and a chart of 10 rows with "Show all"; the header menu lists 12, the footer 8; the state index has a sort (most searched, A to Z, take-home).
- Smoke test derives the expected state count from `/sitemap.xml`, so it no longer hard-codes 9.
