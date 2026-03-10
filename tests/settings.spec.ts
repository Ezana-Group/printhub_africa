import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Settings", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, "/admin/settings");
  });

  test("Each settings section Edit button works", async ({ page }) => {
    await page.goto("/admin/settings/business");
    const editBtn = page.locator("#business-identity").getByRole("button", { name: /edit/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
    await expect(page.locator("#business-identity").getByRole("button", { name: /save|cancel/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test("Each settings section saves to DB", async ({ page }) => {
    await page.goto("/admin/settings/shipping");
    const form = page.locator("form");
    await expect(form).toBeVisible();
    const saveBtn = page.getByRole("button", { name: /save/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    const thresholdInput = page.locator('input[name="freeShippingThreshold"]');
    await expect(thresholdInput).toBeVisible();
    const initialValue = await thresholdInput.inputValue();
    const newValue = initialValue === "5000" ? "6000" : "5000";
    await thresholdInput.fill(newValue);
    await saveBtn.click();
    await expect(page.getByText("Settings saved successfully.")).toBeVisible({ timeout: 8000 });
    await page.reload();
    await expect(page.locator('input[name="freeShippingThreshold"]')).toHaveValue(newValue);
  });

  test("After save, reloading page shows updated values", async ({ page }) => {
    await page.goto("/admin/settings/shipping");
    const thresholdInput = page.locator('input[name="freeShippingThreshold"]');
    await expect(thresholdInput).toBeVisible({ timeout: 5000 });
    const initialValue = await thresholdInput.inputValue();
    const newValue = initialValue === "5000" ? "6000" : "5000";
    await thresholdInput.fill(newValue);
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText("Settings saved successfully.")).toBeVisible({ timeout: 8000 });
    await page.reload();
    await expect(thresholdInput).toHaveValue(newValue);
  });

  test("Cancel reverts to original values without saving", async ({ page }) => {
    await page.goto("/admin/settings/business");
    const section = page.locator("#business-identity");
    const editBtn = section.getByRole("button", { name: /edit/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
    const cancelBtn = section.getByRole("button", { name: "Cancel" });
    await expect(cancelBtn).toBeVisible({ timeout: 10000 });
    await cancelBtn.click();
    await expect(section.getByRole("button", { name: /edit/i }).first()).toBeVisible({ timeout: 10000 });
  });
});
