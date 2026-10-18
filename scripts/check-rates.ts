/**
 * Validates every rate file against its schema and reports sign-off status.
 *   npm run check:rates                      fail on invalid files
 *   npm run check:rates -- --require-signoff also fail if any file is unsigned (production gate)
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { federalRatesSchema, stateRatesSchema } from "../src/lib/rates-schema";

const dir = join(import.meta.dirname, "..", "src", "data", "rates");
const requireSignoff = process.argv.includes("--require-signoff");
let failed = false;

for (const file of readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort()) {
  const raw = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const schema = raw.type === "federal" ? federalRatesSchema : stateRatesSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    failed = true;
    console.error(`INVALID  ${file}`);
    for (const issue of parsed.error.issues)
      console.error(`         ${issue.path.join(".")}: ${issue.message}`);
    continue;
  }
  const d = parsed.data;
  const signed = Boolean(d.verifiedBy && d.verifiedOn);
  if (requireSignoff && !signed) failed = true;
  console.log(
    `${signed ? "signed  " : "UNSIGNED"} ${file.padEnd(20)} ${signed ? `${d.verifiedBy} on ${d.verifiedOn}` : "no human sign-off"}`,
  );
}

if (failed) process.exit(1);
