# Runbook

## Sign off rates (required before a state publishes)

1. Open the state's rate file in `src/data/rates/` and its text in `src/lib/states.ts`.
2. Compare every number and sentence with the official source listed in `sources`. Set `retrievedOn` to the day you read it.
3. Add golden tests from the official worksheet or example (Pub 15-T for federal, the state's withholding guide for states). `npm test` must pass.
4. Record the sign-off: `npm run signoff -- federal tx fl tn nv --by "Your Name"`, then `npx prettier --write src/data/rates`.
5. `npm run check:rates:prod` must exit 0. Commit the rate files in a pull request.

Federal items still to confirm: Social Security wage base ($184,500, SSA), Additional Medicare threshold ($200,000), and the Pub 15-T tables against the engine.

## Update rates mid-year

Add a new file or new effectiveFrom/effectiveTo range, update tests, repeat sign-off. Never edit a signed file's numbers without re-signing. Every January: federal tables, wage base and all live states.

## Deploy (Vercel)

1. Check trademark conflicts for "Paycheck Decoder", then buy paycheckdecoder.com (confirm price at checkout, auto-renew on).
2. Create a GitHub repository, push, import into Vercel. Production deploys from `main`; every pull request gets a preview URL.
3. Production env: `NEXT_PUBLIC_SITE_URL=https://paycheckdecoder.com`. **Do not set `NEXT_PUBLIC_ALLOW_UNVERIFIED`.** Preview env: set it to `1`.
4. Add the domain to the project, point DNS as Vercel instructs, pick apex or www as primary and redirect the other.
5. Vercel's free Hobby plan is described as non-commercial: use a paid plan for an ad-supported site and verify current terms.

## Pre-launch checklist

- [ ] Rate files signed off, `npm run check:rates:prod` green
- [ ] Privacy, Terms, Disclaimer reviewed by a lawyer; contact mailbox exists
- [ ] Sitemap and robots.txt correct on production; canonical tags; 404 page; social image added
- [ ] Preview/staging blocked from indexing (automatic unless `VERCEL_ENV=production`)
- [ ] Mobile speed and accessibility checks passed on real devices (LCP 2.5s, CLS 0.1, INP 200ms; WCAG 2.1 AA)
- [ ] Google Search Console verified by DNS, sitemap submitted; Bing Webmaster Tools
- [ ] Analytics and consent decided and configured
- [ ] Once 30+ real pages are indexed: apply to AdSense, publish `ads.txt`, then set `NEXT_PUBLIC_ADS_ENABLED=1` and the client id

## After launch

Weekly: indexing and rankings, pages not indexed, rate files due for review. Month 6: kill-or-continue gate (under about 5k organic visits across 50+ indexed pages).
