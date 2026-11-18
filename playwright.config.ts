import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a running app with the demo church seeded.
 * Locally: start the app, then `npm run test:e2e`. CI starts it for you.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "off",
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  projects: [
    {
      name: "phone",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
      testIgnore: /desktop\.spec\.ts/,
    },
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testMatch: /desktop\.spec\.ts/ },
  ],
});
