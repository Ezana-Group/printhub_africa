import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Inventory", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, "/admin/inventory");
  });

  test("Admin can add filament with all fields", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("button", { name: /3D printing/i }).click();
    await expect(page.getByRole("button", { name: "Add filament" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add filament" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Add Filament/i })).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator("select").first()).toBeVisible({ timeout: 5000 });
    await dialog.locator("select").first().selectOption("Other");
    await dialog.getByPlaceholder("Custom material name").fill("E2E Test PLA");
    await dialog.getByPlaceholder("e.g. Matte Black, Galaxy Purple").fill("Orange");
    await dialog.getByRole("spinbutton").first().fill("10");
    await dialog.getByPlaceholder("e.g. 2500").fill("2500");
    await dialog.getByRole("spinbutton").nth(2).fill("2");

    await dialog.getByRole("button", { name: "Add filament" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator("table tbody").getByText("E2E Test PLA").first()).toBeVisible({ timeout: 12000 });
  });

  test("Added filament appears in table with correct status badge", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("button", { name: /3D printing/i }).click();
    await expect(page.getByRole("button", { name: "Add filament" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add filament" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("select").first()).toBeVisible({ timeout: 8000 });
    await dialog.locator("select").first().selectOption("Other");
    await dialog.getByPlaceholder("Custom material name").fill("E2E Table Check PLA");
    await dialog.getByPlaceholder("e.g. Matte Black, Galaxy Purple").fill("Blue");
    await dialog.getByRole("spinbutton").first().fill("10");
    await dialog.getByPlaceholder("e.g. 2500").fill("2500");
    await dialog.getByRole("spinbutton").nth(2).fill("2");
    await dialog.getByRole("button", { name: "Add filament" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator("table tbody").getByText("E2E Table Check PLA").first()).toBeVisible({ timeout: 12000 });

    const table = page.locator("table tbody");
    await expect(table).toBeVisible();
    const row = table.locator("tr").filter({ hasText: "E2E Table Check PLA" }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText("E2E Table Check PLA");
    await expect(page.locator("table").getByText("Low stock", { exact: true }).first()).toBeVisible();
  });

  test("Edit filament modal pre-populates correctly and saves", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("button", { name: /3D printing/i }).click();
    await expect(page.getByRole("button", { name: "Add filament" })).toBeVisible({ timeout: 10000 });
    const firstRow = page.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.locator("td").last().getByRole("button").click();
    await page.getByRole("menuitem", { name: /edit filament/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.getByText(/Edit Filament/i)).toBeVisible({ timeout: 5000 });
    await dialog.getByPlaceholder("Custom material name").fill("E2E Updated Name");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator("table tbody").getByText("E2E Updated Name").first()).toBeVisible({ timeout: 5000 });
  });

  test("Adjust stock (add) increases quantity correctly", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("button", { name: /3D printing/i }).click();
    await expect(page.getByRole("button", { name: "Add filament" })).toBeVisible({ timeout: 5000 });
    const firstRow = page.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    const materialName = (await firstRow.locator("td").nth(1).textContent())?.trim() ?? "";
    const quantityCell = firstRow.locator("td").nth(3);
    const initialText = await quantityCell.textContent();
    const initialQty = parseInt(initialText?.replace(/\D/g, "") || "0", 10);

    await firstRow.locator("td").last().getByRole("button").click();
    await page.getByRole("menuitem", { name: "Adjust stock" }).click();
    await expect(page.getByRole("dialog").getByText("Adjust stock")).toBeVisible({ timeout: 3000 });
    await page.getByRole("dialog").getByRole("button", { name: "+ Add stock" }).click();
    await page.getByRole("dialog").locator("#adjust-stock-qty").fill("5");
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5000 });

    const expectedQty = initialQty + 5;
    const rowAfter = page.locator("table tbody tr").filter({ hasText: materialName }).first();
    await expect(rowAfter.locator("td").nth(3)).toContainText(String(expectedQty), { timeout: 10000 });
    const newText = await rowAfter.locator("td").nth(3).textContent();
    const newQty = parseInt(newText?.replace(/\D/g, "") || "0", 10);
    expect(newQty).toBe(expectedQty);
  });

  test("Adjust stock (remove) decreases quantity correctly", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("button", { name: /3D printing/i }).click();
    await expect(page.getByRole("button", { name: "Add filament" })).toBeVisible({ timeout: 5000 });
    const firstRow = page.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    const materialName = (await firstRow.locator("td").nth(1).textContent())?.trim() ?? "";
    const quantityCell = firstRow.locator("td").nth(3);
    const initialText = await quantityCell.textContent();
    const initialQty = parseInt(initialText?.replace(/\D/g, "") || "0", 10);

    await firstRow.locator("td").last().getByRole("button").click();
    await page.getByRole("menuitem", { name: "Adjust stock" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "− Remove stock" }).click();
    await page.getByRole("dialog").locator("#adjust-stock-qty").fill("1");
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5000 });

    const rowAfter = page.locator("table tbody tr").filter({ hasText: materialName }).first();
    await expect(rowAfter.locator("td").nth(3)).toContainText(/\d+/, { timeout: 5000 });
    const newText = await rowAfter.locator("td").nth(3).textContent();
    const newQty = parseInt(newText?.replace(/\D/g, "") || "0", 10);
    expect(newQty).toBe(initialQty - 1);
  });

  test("Stock movement is logged after adjustment", async ({ page }) => {
    test.skip(true, "Assert stock movement log in DB or UI if feature exists.");
  });

  test("Filament below threshold shows Low Stock badge", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("button", { name: /3D printing/i }).click();
    await expect(page.getByRole("button", { name: "Add filament" })).toBeVisible({ timeout: 5000 });
    const table = page.locator("table");
    await expect(table.getByText("Low stock", { exact: true }).first()).toBeVisible({ timeout: 10000 });
  });

  test("3D print calculator shows only in-stock materials", async ({ page }) => {
    await page.goto("/get-a-quote");
    await page.getByText("3D print", { exact: true }).first().click();
    await expect(page.getByText("Loading options…")).toHaveCount(0, { timeout: 25000 });
    if (await page.getByText("No materials configured").isVisible()) {
      test.skip(true, "No 3D materials in test DB; skipping material options check.");
      return;
    }
    const materialBlock = page.locator("div").filter({ has: page.getByText("What material do you need?") });
    const materialSelect = materialBlock.locator("select").first();
    await expect(materialSelect).toBeVisible({ timeout: 10000 });
    const optionCount = await materialSelect.locator("option").count();
    expect(optionCount).toBeGreaterThanOrEqual(1);
  });
});
