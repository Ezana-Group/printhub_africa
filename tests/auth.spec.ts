import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsStaff, loginAsCustomer, SUPER_ADMIN, STAFF_PASSWORD } from "./helpers";

test.describe("Auth", () => {
  test.setTimeout(60000);

  test("Super Admin can log in with correct credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#email").fill(SUPER_ADMIN.email);
    await page.locator("#password").fill(SUPER_ADMIN.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(admin|login\/success)/, { timeout: 45000 });
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test("Staff member can log in", async ({ page }) => {
    await loginAsStaff(page, "sales@printhub.africa");
    await expect(page).toHaveURL(/\/(admin|login\/success)/);
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test("Invalid credentials shows error message", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#email").fill(SUPER_ADMIN.email);
    await page.locator("#password").fill("WrongPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page.getByText("Invalid email or password.")).toBeVisible({ timeout: 10000 });
  });

  test("Logged out user redirected to login from /admin/*", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/admin/quotes");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Staff without finance permission cannot access /admin/finance", async ({ page }) => {
    // Marketing staff has no finance permission in seed
    await loginAsStaff(page, "marketing@printhub.africa", "/admin/dashboard");
    await page.goto("/admin/finance");
    await expect(page).toHaveURL(/\/admin\/access-denied/);
  });

  test("Staff without orders permission cannot access /admin/orders", async ({ page }) => {
    // Requires a staff user with no orders_view (e.g. inventory_only). See permissions.spec.ts for toggling permissions.
    test.skip(true, "Seed has no staff without orders_view; test in permissions.spec after toggling off.");
  });
});
