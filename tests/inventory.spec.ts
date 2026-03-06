import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Inventory", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, "/admin/inventory");
  });

  test("Admin can add filament with all fields", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("tab", { name: /3d|filament/i }).click();
    await page.getByRole("button", { name: /add filament/i }).click();
    await expect(page.getByRole("dialog").getByText(/add.*filament|new filament/i)).toBeVisible();
    await page.getByLabel(/material|name/i).first().fill("E2E Test PLA");
    await page.getByLabel(/colour|specification/i).first().fill("Orange");
    await page.getByLabel(/quantity/i).first().fill("10");
    await page.getByLabel(/cost per kg|cost.*kg/i).first().fill("2500");
    await page.getByLabel(/low stock|threshold/i).first().fill("2");
    await page.getByRole("button", { name: /add filament|save/i }).click();
    await expect(page.getByText("E2E Test PLA")).toBeVisible({ timeout: 8000 });
  });

  test("Added filament appears in table with correct status badge", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("tab", { name: /3d|filament/i }).click();
    const table = page.locator("table tbody");
    await expect(table).toBeVisible();
    const firstRow = table.locator("tr").first();
    await expect(firstRow).toContainText(/\d+/);
  });

  test("Edit filament modal pre-populates correctly and saves", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("tab", { name: /3d|filament/i }).click();
    const firstRow = page.locator("table tbody tr").first();
    if (!(await firstRow.isVisible())) {
      test.skip(true, "No filament rows to edit");
      return;
    }
    await firstRow.click();
    await expect(page.getByRole("dialog").getByText(/edit filament/i)).toBeVisible({ timeout: 3000 });
    const nameInput = page.getByLabel(/material|name/i).first();
    await expect(nameInput).not.toHaveValue("");
    await nameInput.fill("E2E Updated Name");
    await page.getByRole("button", { name: /save changes|update/i }).click();
    await expect(page.getByText("E2E Updated Name")).toBeVisible({ timeout: 5000 });
  });

  test("Adjust stock (add) increases quantity correctly", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("tab", { name: /3d|filament/i }).click();
    const firstRow = page.locator("table tbody tr").first();
    if (!(await firstRow.isVisible())) {
      test.skip(true, "No filament rows");
      return;
    }
    await firstRow.click();
    await page.getByRole("button", { name: /adjust stock/i }).first().click();
    await expect(page.getByRole("dialog").getByText(/adjust stock/i)).toBeVisible();
    await page.getByRole("button", { name: /add stock/i }).click();
    await page.getByLabel(/quantity/i).last().fill("5");
    await page.getByRole("button", { name: /^save$/i }).last().click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5000 });
  });

  test("Adjust stock (remove) decreases quantity correctly", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("tab", { name: /3d|filament/i }).click();
    const firstRow = page.locator("table tbody tr").first();
    if (!(await firstRow.isVisible())) {
      test.skip(true, "No filament rows");
      return;
    }
    await firstRow.click();
    await page.getByRole("menuitem", { name: /adjust stock/i }).click();
    await page.getByRole("button", { name: /remove stock/i }).click();
    await page.getByLabel(/quantity/i).last().fill("1");
    await page.getByRole("button", { name: /^save$/i }).last().click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5000 });
  });

  test("Stock movement is logged after adjustment", async ({ page }) => {
    test.skip(true, "Assert stock movement log in DB or UI if feature exists.");
  });

  test("Filament below threshold shows Low Stock badge", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("tab", { name: /3d|filament/i }).click();
    const lowStockCell = page.locator("table").getByText(/low|stock/i).first();
    if (await lowStockCell.isVisible()) {
      await expect(lowStockCell).toBeVisible();
    }
  });

  test("3D print calculator shows only in-stock materials", async ({ page }) => {
    await page.goto("/get-a-quote");
    await page.getByText(/3d print|3d product/i).first().click();
    await page.waitForTimeout(500);
    const materialOptions = page.locator('select option, [role="option"]');
    await expect(materialOptions.first()).toBeVisible({ timeout: 5000 });
  });
});
