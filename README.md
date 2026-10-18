# Paycheck Decoder

Free US take-home pay calculators (paycheckdecoder.com). Next.js 16, TypeScript, Tailwind v4. Every calculation runs in the browser.

**Read [context.md](context.md) first.** It holds the product scope, design rules, tax-engine method, decisions and open items.

## Quick start

```bash
npm install
cp .env.example .env.local   # allows unsigned rates locally
npm run dev                  # http://localhost:3000
npm run check                # typecheck + lint + tests
```

Browser smoke test: `npm run build && npx next start -p 3111`, then `BASE_URL=http://localhost:3111 npm run smoke`.

## Layout

```
src/engine/      pure tax engine (cents), hourly, overtime, breakdown, tests
src/data/rates/  versioned rate files, one per jurisdiction and year
src/lib/         rate loader and schema, state content, form logic, SEO helpers
src/components/  UI (design-system components)
src/styles/      tokens.css, components.css, site.css (ported from the design system)
src/app/         routes
scripts/         check-rates, signoff, smoke
docs/runbook.md  sign-off, deploy and launch checklist
```

States publish to production only after a person signs off their rate files. See `docs/runbook.md`.
