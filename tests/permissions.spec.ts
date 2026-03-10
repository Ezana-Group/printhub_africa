import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsStaff, SUPER_ADMIN } from "./helpers";

test.describe("Permissions", () => {
  test.setTimeout(60000);

  test("Toggling off Finance for staff saves to DB", async ({ page }) => {
    await loginAsAdmin(page, "/admin/staff");
    await page.goto("/admin/staff");
    const staffLink = page.locator('a[href*="/admin/staff/"]').first();
    await staffLink.click();
    await expect(page).toHaveURL(/\/admin\/staff\/.+/);
    // Wait for tab strip then click Permissions (only one such button on staff detail page)
    const permissionsTab = page.getByRole("button", { name: "Permissions", exact: true });
    await expect(permissionsTab).toBeVisible({ timeout: 15000 });
    await permissionsTab.click();
    // Wait for permissions panel by testid or unique description (more reliable than #staff-permissions in some envs)
    const permissionsPanel = page.getByTestId("staff-permissions-panel").or(page.locator("#staff-permissions"));
    await expect(permissionsPanel).toBeVisible({ timeout: 15000 });
    const editPermissionsBtn = permissionsPanel.getByRole("button", { name: /edit/i });
    await expect(editPermissionsBtn).toBeVisible({ timeout: 5000 });
    await editPermissionsBtn.click();
    const financeViewSwitch = permissionsPanel.locator("#finance_view");
    await expect(financeViewSwitch).toBeVisible({ timeout: 5000 });
    if ((await financeViewSwitch.getAttribute("aria-checked")) === "true") {
      await financeViewSwitch.click();
    }
    await permissionsPanel.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 5000 });
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
    await page.waitForURL(/\/(admin|login\/success)/, { timeout: 45000, waitUntil: "load" });
    await page.goto("/admin/finance");
    await expect(page).toHaveURL(/\/admin\/finance/);
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/orders/);
    await page.goto("/admin/staff");
    await expect(page).toHaveURL(/\/admin\/staff/);
  });
});
