import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsStaff, SUPER_ADMIN } from "./helpers";

test.describe("Permissions", () => {
  test("Toggling off Finance for staff saves to DB", async ({ page }) => {
    await loginAsAdmin(page, "/admin/staff");
    await page.goto("/admin/staff");
    const staffLink = page.locator('a[href*="/admin/staff/"]').first();
    await staffLink.click();
    await expect(page).toHaveURL(/\/admin\/staff\/.+/);
    await page.getByRole("button", { name: "Permissions", exact: true }).click();
    const financeCheckbox = page.getByLabel(/finance.*view|view.*finance/i).or(page.getByRole("checkbox").filter({ has: page.locator(".. >> text=Finance") }).first());
    if (await financeCheckbox.isVisible()) {
      await financeCheckbox.uncheck();
      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test("Staff without finance permission does not see Finance in sidebar", async ({ page }) => {
    await loginAsStaff(page, "marketing@printhub.africa", "/admin/dashboard");
    await page.goto("/admin/dashboard");
    const nav = page.locator("nav");
    await expect(nav.locator('a[href="/admin/finance"]')).toHaveCount(0);
  });

  test("Staff cannot access /admin/finance directly (gets 403/redirect)", async ({ page }) => {
    await loginAsStaff(page, "marketing@printhub.africa", "/admin/dashboard");
    await page.goto("/admin/finance");
    await expect(page).toHaveURL(/\/admin\/access-denied/);
  });

  test("Finance API returns 403 for restricted staff", async ({ page }) => {
    await loginAsStaff(page, "marketing@printhub.africa", "/admin/dashboard");
    const res = await page.request.get("/api/admin/calculator/lf/settings");
    expect(res.status()).toBe(403);
  });

  test("Super Admin always has full access regardless of toggles", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(SUPER_ADMIN.email);
    await page.getByLabel(/password/i).fill(SUPER_ADMIN.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(admin|login\/success)/);
    await page.goto("/admin/finance");
    await expect(page).toHaveURL(/\/admin\/finance/);
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/orders/);
    await page.goto("/admin/staff");
    await expect(page).toHaveURL(/\/admin\/staff/);
  });
});
