/**
 * Browser smoke test against a running build (uses the system Chrome, no browser download).
 *   npm run build && npm start &   then   npm run smoke
 * BASE_URL defaults to http://localhost:3000. CHROME_PATH overrides the browser location.
 */
import { chromium } from "playwright-core";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const chrome = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
  if (!ok) failures++;
}

const browser = await chromium.launch({ executablePath: chrome, headless: true });
try {
  for (const [label, viewport] of [
    ["desktop", { width: 1280, height: 900 }],
    ["mobile 390", { width: 390, height: 844 }],
  ] as const) {
    const page = await browser.newPage({ viewport });
    const problems: string[] = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(String(e)));

    await page.goto(`${base}/paycheck-calculator/texas`, { waitUntil: "networkidle" });
    check(`${label}: no console or hydration errors`, problems.length === 0, problems.join(" | "));
    check(
      `${label}: no horizontal scroll`,
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    );
    check(
      `${label}: default net`,
      (await page.locator(".pd-result-figure").first().innerText()) === "$1,690.85",
    );

    // Change salary, press Calculate.
    await page.fill("#amount", "75,000");
    await page.getByRole("button", { name: "Calculate" }).click();
    const net = await page.locator(".pd-result-figure").first().innerText();
    // 75,000 - 16,100 = 58,900: 1,240 + 4,560 + 22% * 8,500 = 1,870 -> 7,670 / 26 = 294.96
    // SS 4,650 / 26 = 178.85, Medicare 1,087.5 / 26 = 41.83 (rounded), gross 2,884.62
    check(`${label}: recalculates on Calculate`, net !== "$1,690.85" && /^\$2,\d{3}\.\d{2}$/.test(net), net);

    // Hourly switch shows hours field.
    await page.getByRole("radio", { name: "Hourly" }).click();
    check(`${label}: hourly shows hours field`, await page.locator("#hours").isVisible());

    // Validation.
    await page.fill("#amount", "abc");
    check(`${label}: shows error text`, (await page.locator("#amount-err").innerText()).startsWith("Error:"));
    await page.getByRole("button", { name: "Reset" }).click();
    check(
      `${label}: reset restores default`,
      (await page.locator(".pd-result-figure").first().innerText()) === "$1,690.85",
    );

    // Keyboard: arrow key moves a radio group.
    await page.getByRole("radio", { name: "Single" }).focus();
    await page.keyboard.press("ArrowRight");
    check(
      `${label}: arrow key selects next option`,
      (await page.getByRole("radio", { name: "Married" }).getAttribute("aria-checked")) === "true",
    );
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(String(e)));
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  for (const path of ["/", "/salary/25-an-hour-is-how-much-a-year", "/overtime-calculator", "/methodology"]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    check(
      `mobile ${path}: no errors, no horizontal scroll`,
      problems.length === 0 &&
        (await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)),
      problems.join(" | "),
    );
  }
  await page.goto(`${base}/salary/25-an-hour-is-how-much-a-year`, { waitUntil: "networkidle" });
  check("converter default", (await page.locator(".pd-result-figure").first().innerText()) === "$52,000");
  await page.goto(`${base}/overtime-calculator`, { waitUntil: "networkidle" });
  // $22 x 40 = 880 + 8 h x 33 = 264 -> 1,144.00
  check(
    "overtime default gross",
    (await page.locator(".pd-result-figure").first().innerText()) === "$1,144.00",
  );
} finally {
  await browser.close();
}
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
