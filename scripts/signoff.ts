/**
 * Records a human sign-off on rate files. Run it only after you have compared the file's
 * numbers with the official source and the golden tests pass.
 *   npm run signoff -- federal tx fl --by "Your Name"
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const byIndex = args.indexOf("--by");
const by = byIndex >= 0 ? args[byIndex + 1] : undefined;
const keys = args.filter((a, i) => !a.startsWith("--") && i !== byIndex + 1);

if (!by || keys.length === 0) {
  console.error('Usage: npm run signoff -- <federal|tx|fl|tn|nv ...> --by "Your Name"');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
for (const key of keys) {
  const file = join(import.meta.dirname, "..", "src", "data", "rates", `${key.toLowerCase()}-2026.json`);
  if (!existsSync(file)) {
    console.error(`No rate file for "${key}": expected ${file}`);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(file, "utf8"));
  data.retrievedOn ??= today;
  data.verifiedBy = by;
  data.verifiedOn = today;
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Signed off ${key} as ${by} on ${today}`);
}
console.log("Now run: npx prettier --write src/data/rates && npm run check:rates -- --require-signoff");
