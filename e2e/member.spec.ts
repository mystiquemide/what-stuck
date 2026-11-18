import { expect, test } from "@playwright/test";
import { expectAccessible, openDemo } from "./helpers";

test.describe("member reply", () => {
  let replyPath: string;
  test.beforeEach(async ({ page }) => {
    replyPath = await openDemo(page);
    await page.context().clearCookies();
  });

  test("answers in one screen and sees their words back", async ({ page }) => {
    await page.goto(replyPath);
    await expect(page.getByRole("heading", { name: "What will stick with you?" })).toBeVisible();
    await expectAccessible(page);

    await page.getByLabel("What will stick with you?").fill("Grace, not grit.");
    await page.getByLabel(/Send my words back/).check();
    await page.getByLabel("Your email").fill("member@example.com");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
    await expect(page.getByText("Grace, not grit.")).toBeVisible();
    await expect(page.getByText(/Wednesday morning/)).toBeVisible();
    await expectAccessible(page);
  });

  test("asks for a reply before sending", async ({ page }) => {
    await page.goto(replyPath);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Tell us what will stick with you.")).toBeVisible();
  });

  test("shows crisis help when a reply sounds like someone is hurting", async ({ page }) => {
    await page.goto(replyPath);
    await page.getByLabel("What will stick with you?").fill("Some days I want to die.");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("heading", { name: "Thank you for telling us." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Call or text 988" })).toHaveAttribute("href", "tel:988");
    await expect(page.getByText("Pastoral care line")).toBeVisible();
    await expectAccessible(page);
  });

  test("shows a friendly page for a code that doesn't exist", async ({ page }) => {
    await page.goto("/r/zzzzzzzz");
    await expect(page.getByRole("heading", { name: "We couldn't find that page." })).toBeVisible();
    await expectAccessible(page);
  });
});

test("the pastor sees a new reply arrive without reloading", async ({ page, browser }) => {
  const replyPath = await openDemo(page);
  await page.getByRole("link", { name: /Pressing On/ }).first().click();
  await expect(page.getByRole("img", { name: /QR code/ })).toBeVisible();
  const count = page.locator("span[aria-live=polite]", { hasText: /repl(y|ies)/ });
  const before = Number((await count.textContent())?.match(/\d+/)?.[0]);

  const member = await browser.newPage();
  await member.goto(replyPath);
  await member.getByLabel("What will stick with you?").fill("He took hold of me first.");
  await member.getByRole("button", { name: "Send" }).click();
  await expect(member.getByRole("heading", { name: "Thank you." })).toBeVisible();
  await member.close();

  await expect(count).toHaveText(`${before + 1} replies`, { timeout: 20_000 });
});
