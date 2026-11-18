import { expect, test } from "@playwright/test";
import { expectAccessible, openDemo } from "./helpers";

test("landing page leads to the demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/hear what stuck/i);
  await expectAccessible(page);
  await page.getByRole("link", { name: "Open the demo church" }).first().click();
  await expect(page.getByRole("heading", { name: "Your sermons" })).toBeVisible();
});

test("sign-in page is accessible", async ({ page }) => {
  await page.goto("/login");
  await expectAccessible(page);
});

test("demo is clearly labeled and read-only", async ({ page }) => {
  await openDemo(page);
  await expect(page.getByText(/demo church with made-up replies/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Set up Sunday/ })).toHaveCount(0);
  await expectAccessible(page);
});

test("sermon page shows the QR code and the reply link", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("link", { name: /Pressing On/ }).first().click();
  await expect(page.getByRole("img", { name: /QR code/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop taking replies" })).toHaveCount(0);
  await expectAccessible(page);
});

test("report page lists every reply, word for word", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("link", { name: /Not Finished Yet/ }).click();
  await page.getByRole("link", { name: "Read what stuck" }).click();
  await expect(page.getByRole("heading", { name: "Every reply" })).toBeVisible();
  const everyReply = page.getByRole("region", { name: "Every reply" });
  await expect(everyReply.getByText("God isn't finished with me yet. I needed that.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide" })).toHaveCount(0);
  await expectAccessible(page);
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
});
