import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fail on any serious or critical WCAG 2.2 AA issue. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`),
  ).toEqual([]);
}

/** Open the demo church and return the public reply link of its open sermon. */
export async function openDemo(page: Page) {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "Your sermons" })).toBeVisible();
  const href = await page.getByRole("link", { name: "Open the reply page" }).getAttribute("href");
  if (!href) throw new Error("Demo has no open sermon");
  return href;
}
