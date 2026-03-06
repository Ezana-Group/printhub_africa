import { Page } from "@playwright/test";

/** Super Admin from TEST_ACCOUNTS.md */
export const SUPER_ADMIN = {
  email: "admin@printhub.africa",
  password: "Admin@Printhub2025!",
};

/** Default staff/customer password from seed */
export const STAFF_PASSWORD = "Test@12345";

/**
 * Log in as Super Admin. Redirects to /login/success or callback.
 */
export async function loginAsAdmin(page: Page, callbackUrl = "/admin/dashboard") {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.locator("#email").waitFor({ state: "visible", timeout: 15000 });
  await page.locator("#email").fill(SUPER_ADMIN.email);
  await page.locator("#password").fill(SUPER_ADMIN.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(admin|login\/success)/, { timeout: 60000 });
}

/**
 * Log in as a staff member. Use email from TEST_ACCOUNTS (e.g. sales@printhub.africa).
 */
export async function loginAsStaff(page: Page, email: string, callbackUrl = "/admin/dashboard") {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.locator("#email").waitFor({ state: "visible", timeout: 15000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(STAFF_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(admin|login\/success)/, { timeout: 60000 });
}

/**
 * Log in as a customer. Use email from TEST_ACCOUNTS (e.g. customer@printhub.africa).
 * callbackUrl can be /account, /get-a-quote, etc. We wait for any redirect away from /login.
 */
export async function loginAsCustomer(page: Page, email: string, callbackUrl = "/account") {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.locator("#email").waitFor({ state: "visible", timeout: 15000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(STAFF_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 60000 });
}
