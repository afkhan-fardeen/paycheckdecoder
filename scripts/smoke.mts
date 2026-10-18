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

  // v1.1 states: values are hand-computed from each state's official method (see src/engine/state.test.ts).
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(String(e)));
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    const legend = async () => (await page.locator(".pd-legend").first().innerText()).replace(/\s+/g, " ");

    await page.goto(`${base}/paycheck-calculator/illinois`, { waitUntil: "networkidle" });
    check(
      "illinois: state legend $99.00",
      (await legend()).includes("State and local tax $99.00"),
      await legend(),
    );
    check(
      "illinois: allowance field is inside a collapsed section",
      !(await page.locator("#stateAllowances").isVisible()),
    );
    await page.getByText("Deductions and extras").click();
    check(
      "illinois: allowance field shown after opening",
      await page.locator("#stateAllowances").isVisible(),
    );
    await page.fill("#stateAllowances", "2");
    await page.getByRole("button", { name: "Calculate" }).click();
    // 52,000 - 2 * 2,925 = 46,150 * 4.95% = 2,284.425 / 26 = 87.86
    check("illinois: allowances lower withholding", (await legend()).includes("$87.86"), await legend());

    await page.goto(`${base}/paycheck-calculator/georgia`, { waitUntil: "networkidle" });
    check(
      "georgia: state legend $71.01",
      (await legend()).includes("State and local tax $71.01"),
      await legend(),
    );

    await page.goto(`${base}/paycheck-calculator/north-carolina`, { waitUntil: "networkidle" });
    check(
      "north carolina: whole-dollar state line",
      (await legend()).includes("State and local tax $") &&
        /State and local tax \$\d+\.00 /.test(await legend()),
      await legend(),
    );

    await page.goto(`${base}/paycheck-calculator/ohio`, { waitUntil: "networkidle" });
    check(
      "ohio: state legend $45.87",
      (await legend()).includes("State and local tax $45.87"),
      await legend(),
    );

    await page.goto(`${base}/paycheck-calculator/washington`, { waitUntil: "networkidle" });
    check("washington: no allowance field", (await page.locator("#stateAllowances").count()) === 0);
    check(
      "washington: programs row in table",
      (await page.locator("table.pd-table").first().innerText()).includes("State payroll programs"),
    );
    check(
      "washington: programs in legend $27.74",
      (await legend()).includes("State and local tax $27.74"),
      await legend(),
    );

    await page.goto(`${base}/paycheck-calculator/texas`, { waitUntil: "networkidle" });
    check("texas: still no state tax", !(await legend()).includes("State and local tax"));
    check("new states: no console errors", problems.length === 0, problems.join(" | "));
    await page.close();
  }

  // Phone layout: menu, touch targets, overflow at small widths, scroll to result.
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(String(e)));
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    await page.goto(`${base}/paycheck-calculator/texas`, { waitUntil: "networkidle" });

    check(
      "phone: inline nav hidden, menu button shown",
      !(await page.locator(".nav-links").isVisible()) && (await page.locator(".menu-btn").isVisible()),
    );
    await page.locator(".menu-btn").click();
    check(
      "phone: menu opens with links",
      await page.locator("#mobile-menu").getByRole("link", { name: "Overtime" }).isVisible(),
    );
    await page.keyboard.press("Escape");
    check("phone: Escape closes menu", !(await page.locator("#mobile-menu").isVisible()));
    await page.locator(".menu-btn").click();
    await page.locator("#mobile-menu").getByRole("link", { name: "Overtime" }).click();
    await page.waitForURL("**/overtime-calculator");
    check("phone: menu link navigates and closes", !(await page.locator("#mobile-menu").isVisible()));
    await page.goto(`${base}/paycheck-calculator/texas`, { waitUntil: "networkidle" });

    const small = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        ".pd-seg button, .pd-btn, .menu-btn, .pd-control, .pd-details > summary, .chip",
      )) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height < 43.5)
          bad.push(`${el.className || el.tagName} ${Math.round(r.height)}px`);
      }
      return bad;
    });
    check("phone: touch targets at least 44px", small.length === 0, small.join(", "));

    const widths = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.pd-seg[data-n="3"] button')].map((b) =>
        Math.round(b.getBoundingClientRect().width),
      ),
    );
    check(
      "phone: 3-option group is an even grid",
      widths.length === 3 && Math.max(...widths) - Math.min(...widths) <= 1,
      widths.join(","),
    );

    const resultTop = async () =>
      page.evaluate(() => document.getElementById("result")!.getBoundingClientRect().top);
    check(
      "phone: result starts below the fold before Calculate",
      (await resultTop()) > 700,
      String(await resultTop()),
    );
    await page.getByRole("button", { name: "Calculate" }).click();
    await page.waitForTimeout(900);
    check(
      "phone: Calculate scrolls the result into view",
      (await resultTop()) < 200 && (await resultTop()) > -50,
      String(await resultTop()),
    );

    check("phone: no console errors", problems.length === 0, problems.join(" | "));
    await ctx.close();

    for (const width of [320, 360]) {
      const p2 = await browser.newPage({ viewport: { width, height: 700 } });
      for (const path of [
        "/",
        "/paycheck-calculator/washington",
        "/paycheck-calculator/north-carolina",
        "/overtime-calculator",
        "/salary/25-an-hour-is-how-much-a-year",
        "/methodology",
      ]) {
        await p2.goto(`${base}${path}`, { waitUntil: "networkidle" });
        const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(`${width}px ${path}: no horizontal scroll`, over <= 0, `overflow ${over}px`);
      }
      await p2.close();
    }
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
