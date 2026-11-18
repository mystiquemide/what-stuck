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
    await expect(page.getByRole("link", { name: /Open the connect card/ })).toHaveAttribute(
      "href",
      "/sample-form/connect",
    );
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
    await expect(page.getByRole("link", { name: "Ask someone to reach out" })).toHaveAttribute(
      "href",
      "/sample-form/care",
    );
    await expectAccessible(page);
  });

  test("shows a friendly page for a code that doesn't exist", async ({ page }) => {
    const response = await page.goto("/r/zzzzzzzz");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This page has wandered off." })).toBeVisible();
    await expectAccessible(page);
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

test.describe("Spanish", () => {
  test.use({ locale: "es-MX" });

  test("a phone set to Spanish gets the reply page in Spanish", async ({ page, browser }) => {
    const demo = await browser.newPage({ locale: "en-US" });
    const replyPath = await openDemo(demo);
    await demo.close();

    await page.goto(replyPath);
    await expect(page.getByRole("heading", { name: "¿Qué te vas a llevar de hoy?" })).toBeVisible();
    await expect(page.locator("main")).toHaveAttribute("lang", "es");
    await expectAccessible(page);

    await page.getByLabel("¿Qué te vas a llevar de hoy?").fill("Dios no ha terminado conmigo.");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByRole("heading", { name: "Gracias." })).toBeVisible();
    await expect(page.getByText(/Reina-Valera 1909/)).toBeVisible();
    await expectAccessible(page);
  });

  test("shows Spanish crisis help, with 988 and AYUDA by text", async ({ page, browser }) => {
    const demo = await browser.newPage({ locale: "en-US" });
    const replyPath = await openDemo(demo);
    await demo.close();

    await page.goto(replyPath);
    await page.getByLabel("¿Qué te vas a llevar de hoy?").fill("No quiero vivir así.");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByRole("heading", { name: "Gracias por contárnoslo." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Llamar al 988" })).toHaveAttribute("href", "tel:988");
    await expect(page.getByRole("link", { name: /AYUDA/ })).toHaveAttribute("href", "sms:988?&body=AYUDA");
    await expectAccessible(page);
  });

  test("can switch back to English", async ({ page, browser }) => {
    const demo = await browser.newPage({ locale: "en-US" });
    const replyPath = await openDemo(demo);
    await demo.close();

    await page.goto(replyPath);
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "What will stick with you?" })).toBeVisible();
  });
});
