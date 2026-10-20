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

  // Search, navigation, charts and filters (desktop).
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(String(e)));
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    await page.goto(`${base}/`, { waitUntil: "networkidle" });

    // Command palette
    check("search: palette closed at first", !(await page.locator("dialog.palette").isVisible()));
    await page.keyboard.press("Control+k");
    check("search: Ctrl+K opens the palette", await page.locator("dialog.palette").isVisible());
    check(
      "search: input is focused",
      await page.locator(".palette-field input").evaluate((el) => el === document.activeElement),
    );
    check("search: shows popular items before typing", (await page.locator(".palette-list li").count()) >= 4);
    await page.keyboard.type("tex");
    check(
      "search: finds Texas",
      (await page.locator(".palette-list li").first().innerText()).includes("Texas paycheck calculator"),
    );
    await page.keyboard.press("Escape");
    check("search: Escape closes", !(await page.locator("dialog.palette").isVisible()));
    await page.keyboard.press("/");
    check("search: slash opens", await page.locator("dialog.palette").isVisible());
    await page.keyboard.type("overtime");
    await page.keyboard.press("Enter");
    await page.waitForURL("**/overtime-calculator");
    check("search: Enter opens the result", page.url().endsWith("/overtime-calculator"));
    await page
      .getByRole("button", { name: /^Search/ })
      .first()
      .click();
    await page.keyboard.type("zzzzqq");
    check(
      "search: no-result message",
      (await page.locator(".palette-empty").innerText()).includes("No matches"),
    );
    await page.keyboard.press("Escape");
    await page.keyboard.type("25");
    check(
      "search: typing '25' on the page does not open search",
      !(await page.locator("dialog.palette").isVisible()),
    );

    // Header dropdown
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Calculators" }).click();
    check(
      "menu: Calculators dropdown lists states",
      await page
        .locator("#calc-menu")
        .getByRole("link", { name: /Georgia/ })
        .isVisible(),
    );
    await page.keyboard.press("Escape");
    check("menu: Escape closes dropdown", !(await page.locator("#calc-menu").isVisible()));
    await page.getByRole("button", { name: "Calculators" }).click();
    await page
      .locator("#calc-menu")
      .getByRole("link", { name: /Georgia/ })
      .click();
    await page.waitForURL("**/paycheck-calculator/georgia");
    check("menu: dropdown link navigates", page.url().endsWith("/georgia"));

    // Home: hero calculator, comparison chart
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    check(
      "home: hero calculator shows a take-home figure",
      /^\$\d{2},\d{3}$/.test(await page.locator(".quick .pd-result-figure").innerText()),
    );
    const rowsBefore = await page.locator(".cmp-row").count();
    check("home: comparison chart has one row per state", rowsBefore === 9, String(rowsBefore));
    const firstNet = async () => page.locator(".cmp-row").first().locator(".cmp-values b").innerText();
    const before = await firstNet();
    await page.getByRole("radio", { name: "$40k" }).click();
    const after = await firstNet();
    check("home: salary toggle updates the chart", before !== after, `${before} -> ${after}`);
    const nets = await page.locator(".cmp-values b").allInnerTexts();
    const nums = nets.map((t) => Number(t.replace(/[$,]/g, "")));
    check(
      "home: chart is sorted best first",
      nums.every((n, i) => i === 0 || nums[i - 1] >= n),
      nets.join(","),
    );
    check(
      "home: state cards show real take-home figures",
      (await page.locator(".state-card-figure").first().innerText()).startsWith("$"),
    );
    check(
      "home: every state card links to a page that exists",
      await (async () => {
        const hrefs = await page
          .locator(".state-card")
          .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")));
        for (const h of hrefs) {
          const r = await page.request.get(`${base}${h}`);
          if (r.status() !== 200) return false;
        }
        return hrefs.length === 9;
      })(),
    );

    // State page: key facts, chart slider, sidebar
    await page.goto(`${base}/paycheck-calculator/texas`, { waitUntil: "networkidle" });
    check("state: key facts cards", (await page.locator(".stat-grid.compact .stat-card").count()) === 4);
    check("state: sidebar sections", (await page.locator(".rail-card").count()) >= 3);
    const readout = async () => (await page.locator(".chart-readout").innerText()).replace(/\s+/g, " ");
    const r1 = await readout();
    await page.locator(".chart-slider input").fill("120000");
    const r2 = await readout();
    check("state: chart slider updates the readout", r1 !== r2 && r2.includes("$120,000"), r2);
    await page.locator(".chart-data summary").click();
    check("state: chart data table opens", await page.locator(".chart-data table").isVisible());
    await page.locator('.rail-links a[href="#faq-h"]').click();
    await page.waitForTimeout(600);
    check(
      "state: on-this-page link scrolls to the FAQ",
      await page.locator("#faq-h").evaluate((el) => el.getBoundingClientRect().top < 300),
    );

    // States index: filter and search
    await page.goto(`${base}/paycheck-calculator`, { waitUntil: "networkidle" });
    check("index: shows all states", (await page.locator(".state-card").count()) === 9);
    await page.getByRole("radio", { name: "No income tax" }).click();
    check(
      "index: 'No income tax' filter",
      (await page.locator(".state-card").count()) === 5,
      String(await page.locator(".state-card").count()),
    );
    await page.getByRole("radio", { name: "All" }).click();
    await page.fill('input[type="search"]', "ohio");
    check("index: text filter", (await page.locator(".state-card").count()) === 1);
    await page.fill('input[type="search"]', "zzz");
    check("index: empty state message", await page.getByText("No states match").isVisible());

    // Footer
    check("footer: link columns present", (await page.locator(".footer-grid nav").count()) === 4);
    check("footer: trust row present", (await page.locator(".footer-trust li").count()) === 3);
    check("desktop: no console errors across these pages", problems.length === 0, problems.join(" | "));
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
      !(await page.locator(".header-nav").isVisible()) && (await page.locator(".menu-btn").isVisible()),
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
        ".pd-seg button, .pd-btn, .menu-btn, .icon-btn, .pd-control, .pd-details > summary, .chip, .state-card, .search-bar.is-hero",
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

    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Search", exact: true }).click();
    check("phone: search icon opens the palette", await page.locator("dialog.palette").isVisible());
    const box = await page.locator(".palette-panel").boundingBox();
    check(
      "phone: palette fits the screen",
      !!box && box.x >= 0 && box.x + box.width <= 390 && box.height <= 844,
      JSON.stringify(box),
    );
    await page.keyboard.type("wash");
    check(
      "phone: palette search works",
      (await page.locator(".palette-list li").first().innerText()).includes("Washington"),
    );
    await page.keyboard.press("Escape");
    check(
      "phone: hero search opens the palette",
      await (async () => {
        await page.locator(".search-bar.is-hero").click();
        return page.locator("dialog.palette").isVisible();
      })(),
    );
    await page.keyboard.press("Escape");
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
