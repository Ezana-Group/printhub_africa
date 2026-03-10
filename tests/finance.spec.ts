import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Finance", () => {
  test.setTimeout(60000);
  /** Serial so tests that mutate calculator settings don't overwrite each other. */
  test.describe.configure({ mode: "serial" });
  let originalLabourRate: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, "/admin/finance");
  });

  /** Wait for Business costs tab content to load and return the section locator. */
  async function getBusinessCostsSection(page: import("@playwright/test").Page) {
    await page.goto("/admin/finance");
    await page.getByRole("button", { name: /business costs/i }).click();
    const section = page.locator("#finance-business-costs");
    await expect(section).toBeVisible({ timeout: 20000 });
    return section;
  }

  /** Labour rate input in the Business costs edit form (by label to avoid wrong field). */
  function labourInputLocator(costsSection: import("@playwright/test").Locator) {
    return costsSection.locator("div").filter({ hasText: /Labour rate \(KES\/hr\)/ }).locator("input").first();
  }

  /** Click Edit and wait until the section is in edit mode (Save/Cancel visible). */
  async function openBusinessCostsEdit(page: import("@playwright/test").Page, costsSection: import("@playwright/test").Locator) {
    const editBtn = costsSection.getByRole("button", { name: /edit/i });
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
    await expect(costsSection.getByText("Editing")).toBeVisible({ timeout: 10000 });
    await expect(costsSection.getByRole("button", { name: /save changes/i })).toBeVisible({ timeout: 5000 });
  }

  test.afterEach(async ({ page }) => {
    if (originalLabourRate === null) return;
    const rateToRestore = originalLabourRate;
    originalLabourRate = null;
    try {
      const costsSection = await getBusinessCostsSection(page);
      await openBusinessCostsEdit(page, costsSection);
      const labourInput = labourInputLocator(costsSection);
      await expect(labourInput).toBeVisible({ timeout: 5000 });
      await labourInput.fill(rateToRestore);
      await costsSection.getByRole("button", { name: /save changes/i }).click({ timeout: 10000 });
      await expect(page.getByText(/saved|updated/i).first()).toBeVisible({ timeout: 8000 });
    } catch {
      // Best-effort restore; avoid failing afterEach and masking the real test failure
    }
  });

  test("Business costs load from database on page open", async ({ page }) => {
    await getBusinessCostsSection(page);
    await expect(page.getByText(/labour|rent|vat|profit/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("Edit button switches section to edit mode", async ({ page }) => {
    const costsSection = await getBusinessCostsSection(page);
    await openBusinessCostsEdit(page, costsSection);
  });

  test("Changed values save to database", async ({ page }) => {
    const costsSection = await getBusinessCostsSection(page);
    await openBusinessCostsEdit(page, costsSection);
    const labourInput = labourInputLocator(costsSection);
    await expect(labourInput).toBeVisible({ timeout: 5000 });
    const currentValue = await labourInput.inputValue();
    originalLabourRate = currentValue || "200";
    await labourInput.fill("250");
    const saveResponse = page.waitForResponse(
      (r) => r.url().includes("/api/admin/calculator/lf/settings") && r.request().method() === "PATCH" && r.status() === 200
    );
    await costsSection.getByRole("button", { name: /save changes/i }).click({ timeout: 10000 });
    await saveResponse;
    await expect(page.getByText(/saved|updated/i).first()).toBeVisible({ timeout: 8000 });
    await page.reload();
    const sectionAfter = await getBusinessCostsSection(page);
    await sectionAfter.getByRole("button", { name: /edit/i }).click();
    await expect(sectionAfter.getByText("Editing")).toBeVisible({ timeout: 10000 });
    const labourDisplay = labourInputLocator(sectionAfter);
    await expect(labourDisplay).toHaveValue("250");
  });

  test("Calculator uses updated costs after save", async ({ page }) => {
    const costsSection = await getBusinessCostsSection(page);
    await openBusinessCostsEdit(page, costsSection);
    const labourInput = labourInputLocator(costsSection);
    await expect(labourInput).toBeVisible({ timeout: 5000 });
    const currentValue = await labourInput.inputValue();
    originalLabourRate = currentValue || "200";
    await labourInput.fill("300");
    const saveResponse = page.waitForResponse(
      (r) => r.url().includes("/api/admin/calculator/lf/settings") && r.request().method() === "PATCH" && r.status() === 200
    );
    await costsSection.getByRole("button", { name: /save changes/i }).click({ timeout: 10000 });
    await saveResponse;
    await expect(page.getByText(/saved|updated|300/i).first()).toBeVisible({ timeout: 5000 });
    await page.goto("/get-a-quote");
    await page.getByText(/3d print|3d product/i).first().click();
    const estimateArea = page.getByText(/kes|estimate|range|labour/i);
    await expect(estimateArea.first()).toBeVisible({ timeout: 10000 });
  });

  test("3D print estimate is visible on quote page", async ({ page }) => {
    await page.goto("/get-a-quote");
    await page.getByText(/3d print/i).first().click();
    const estimateText = page.getByText(/kes|estimate|range/i);
    await estimateText.first().waitFor({ state: "visible", timeout: 10000 });
    await expect(estimateText.first()).toBeVisible();
  });

  test("VAT label visible in admin costs page", async ({ page }) => {
    await getBusinessCostsSection(page);
    await expect(page.getByText(/vat|16|%/i).first()).toBeVisible({ timeout: 5000 });
  });
});
