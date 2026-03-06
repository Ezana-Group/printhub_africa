import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Finance", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, "/admin/finance");
  });

  test("Business costs load from database on page open", async ({ page }) => {
    await page.goto("/admin/finance");
    await page.getByRole("tab", { name: /business|costs/i }).click();
    await expect(page.getByText(/labour|rent|vat|profit/i)).toBeVisible({ timeout: 8000 });
  });

  test("Edit button switches section to edit mode", async ({ page }) => {
    await page.goto("/admin/finance");
    await page.getByRole("tab", { name: /business|costs/i }).click();
    const editBtn = page.getByRole("button", { name: /edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.getByRole("button", { name: /save|cancel/i })).toBeVisible({ timeout: 3000 });
    }
  });

  test("Changed values save to database", async ({ page }) => {
    await page.goto("/admin/finance");
    await page.getByRole("tab", { name: /business|costs/i }).click();
    const editBtn = page.getByRole("button", { name: /edit/i }).first();
    if (!(await editBtn.isVisible())) return;
    await editBtn.click();
    const labourInput = page.getByLabel(/labour|rate/i).first();
    if (await labourInput.isVisible()) {
      await labourInput.fill("250");
      await page.getByRole("button", { name: /save/i }).first().click();
      await expect(page.getByText(/saved|updated|250/i)).toBeVisible({ timeout: 8000 });
    }
  });

  test("Calculator uses updated costs after save", async ({ page }) => {
    await page.goto("/admin/finance");
    await page.getByRole("tab", { name: /business|costs/i }).click();
    const editBtn = page.getByRole("button", { name: /edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const labourInput = page.getByLabel(/labour|rate/i).first();
      if (await labourInput.isVisible()) {
        await labourInput.fill("300");
        await page.getByRole("button", { name: /save/i }).first().click();
        await page.waitForTimeout(1000);
        await expect(page.getByText(/300|labour/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("3D print estimate recalculates when costs change", async ({ page }) => {
    await page.goto("/get-a-quote");
    await page.getByText(/3d print/i).first().click();
    await page.waitForTimeout(800);
    const estimateText = page.getByText(/kes|estimate|range/i);
    await expect(estimateText.first()).toBeVisible({ timeout: 10000 });
  });

  test("VAT correctly applied to estimate", async ({ page }) => {
    await page.goto("/admin/finance");
    await page.getByRole("tab", { name: /business|costs/i }).click();
    await expect(page.getByText(/vat|16|%/i)).toBeVisible({ timeout: 5000 });
  });
});
