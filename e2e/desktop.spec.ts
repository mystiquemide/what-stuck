import { expect, test } from "@playwright/test";
import { expectAccessible } from "./helpers";

test("landing page reads well on a laptop", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Try the demo church" })).toBeVisible();
  await expectAccessible(page);
});
