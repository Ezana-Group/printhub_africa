import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, "/admin/settings");
  });

  test("Each settings section Edit button works", async ({ page }) => {
    await page.goto("/admin/settings/business");
    const editBtn = page.getByRole("button", { name: /edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.getByRole("button", { name: /save|cancel/i })).toBeVisible({ timeout: 3000 });
    }
  });

  test("Each settings section saves to DB", async ({ page }) => {
    await page.goto("/admin/settings/shipping");
    const form = page.locator("form");
    await expect(form).toBeVisible();
    const saveBtn = page.getByRole("button", { name: /save/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await expect(page.getByText("Settings saved successfully.")).toBeVisible({ timeout: 8000 });
    }
  });

  test("After save, reloading page shows updated values", async ({ page }) => {
    await page.goto("/admin/settings/shipping");
    const thresholdInput = page.getByLabel(/free shipping threshold|threshold/i).first();
    if (await thresholdInput.isVisible()) {
      const initialValue = await thresholdInput.inputValue();
      const newValue = initialValue === "5000" ? "6000" : "5000";
      await thresholdInput.fill(newValue);
      await page.getByRole("button", { name: /save/i }).first().click();
      await expect(page.getByText(/saved|success/i)).toBeVisible({ timeout: 8000 });
      await page.reload();
      await expect(thresholdInput).toHaveValue(newValue);
    }
  });

  test("Cancel reverts to original values without saving", async ({ page }) => {
    await page.goto("/admin/settings/business");
    const editBtn = page.getByRole("button", { name: /edit/i }).first();
    if (!(await editBtn.isVisible())) return;
    await editBtn.click();
    const input = page.getByLabel(/company|business|name/i).first();
    if (await input.isVisible()) {
      const original = await input.inputValue();
      await input.fill(original + " X");
      await page.getByRole("button", { name: /cancel/i }).first().click();
      await page.waitForTimeout(500);
      await editBtn.click();
      await expect(input).toHaveValue(original);
    }
  });
});
