import { defineConfig, devices } from "@playwright/test";

/**
 * PrintHub E2E tests.
 * Start the app with: npm run dev (port 3000)
 * Use a separate test database: set DATABASE_URL in .env.test and run tests with dotenv loading .env.test
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 4,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // WebKit excluded: login form often doesn't become visible in time (hydration). Run with: npx playwright test --project=webkit
    // { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  outputDir: "test-results/",
});
