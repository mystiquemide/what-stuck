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
  // The demo reports are rebuilt by the real model after a fresh seed, so they may still be on their way.
  if (await page.locator("#care").count()) {
    await expect(page.getByText(/care team marks this once someone has followed up/)).toBeVisible();
  }
  await expectAccessible(page);
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
});

test("church settings show where members go next, read-only in the demo", async ({ page }) => {
  await openDemo(page);
  await page.goto("/app/settings");
  await expect(page.getByRole("heading", { name: "Church settings" })).toBeVisible();
  await expect(page.getByLabel(/Prayer or care form link/)).toHaveValue("/sample-form/care");
  await expect(page.getByLabel(/Prayer or care form link/)).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save settings" })).toHaveCount(0);
  await expectAccessible(page);
});

test("sermon page previews the real Wednesday email", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("link", { name: /Pressing On/ }).first().click();
  await page.getByText("Preview the Wednesday email").click();
  const email = page.frameLocator('iframe[title="Preview of the Wednesday email"]');
  await expect(email.getByText("Hope Street Church · Pressing On")).toBeVisible();
  await expect(email.getByText(/From Philippians 3:12-14/)).toBeVisible();
});

test("sermon page has a bulletin kit while taking replies", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("link", { name: /Pressing On/ }).first().click();
  await expect(page.getByText("For your digital bulletin")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy an announcement" })).toBeVisible();

  await expectAccessible(page);
});
