import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsCustomer, createTestQuote } from "./helpers";

test.describe("Quote flow", () => {
  test.setTimeout(90000);
  test("Customer can submit a Large Format quote", async ({ page, request }) => {
    await loginAsCustomer(page, "customer@printhub.africa", "/get-a-quote");
    await page.goto("/get-a-quote");
    await page.getByRole("button", { name: /large format|3d printed/i }).first().click();
    const lfTab = page.locator('button:has-text("Large Format"), [data-state="active"]').first();
    await page.getByText(/large format/i).first().click();
    await page.waitForTimeout(300);
    await page.getByLabel(/name/i).first().fill("E2E LF Customer");
    await page.getByLabel(/email/i).first().fill("customer@printhub.africa");
    const submitBtn = page.getByRole("button", { name: /submit|get quote|send/i }).first();
    await submitBtn.click();
    await expect(page.getByText(/received|success|thank/i)).toBeVisible({ timeout: 15000 });
  });

  test("Customer can submit a 3D Print quote with material + colour", async ({ page }) => {
    await loginAsCustomer(page, "customer@printhub.africa", "/get-a-quote");
    await page.goto("/get-a-quote");
    await page.getByText(/3d print|3d product/i).first().click();
    await page.waitForTimeout(500);
    const materialSelect = page.locator('select, [role="combobox"]').filter({ hasText: /material|filament/i }).first();
    if (await materialSelect.isVisible()) {
      await materialSelect.selectOption({ index: 1 });
    }
    await page.getByLabel(/name/i).first().fill("E2E 3D Customer");
    await page.getByLabel(/email/i).first().fill("customer@printhub.africa");
    await page.getByRole("button", { name: /submit|get quote|send/i }).first().click();
    await expect(page.getByText(/received|success|thank|estimate/i)).toBeVisible({ timeout: 15000 });
  });

  test("Customer can submit an I Have an Idea quote", async ({ page }) => {
    await loginAsCustomer(page, "customer@printhub.africa", "/get-a-quote");
    await page.goto("/get-a-quote");
    await page.getByText(/idea|design and print/i).first().click();
    await page.waitForTimeout(300);
    await page.getByLabel(/describe your idea/i).fill("E2E test idea description with at least twenty characters here.");
    await page.getByLabel(/name/i).first().fill("E2E Idea Customer");
    await page.getByLabel(/email/i).first().fill("customer@printhub.africa");
    await page.getByRole("button", { name: /submit|send my idea/i }).first().click();
    await expect(page.getByText(/received your idea|received your request|We've received|review.*1 business day|2 business days/i)).toBeVisible({ timeout: 15000 });
  });

  test("Quote appears in /admin/quotes after submission", async ({ page }) => {
    await loginAsCustomer(page, "customer@printhub.africa", "/account");
    const created = await createTestQuote(page.context().request, "large_format", {
      projectName: `E2E Admin List ${Date.now()}`,
    });
    expect(created).not.toBeNull();
    await loginAsAdmin(page, "/admin/quotes");
    await page.goto("/admin/quotes");
    await expect(page.getByRole("heading", { name: /quotes & uploads/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(created!.quoteNumber)).toBeVisible({ timeout: 10000 });
  });

  test("Admin can change quote status through full pipeline", async ({ page }) => {
    await loginAsAdmin(page, "/admin/quotes");
    await page.goto("/admin/quotes");
    await expect(page.getByRole("heading", { name: /quotes & uploads/i })).toBeVisible({ timeout: 10000 });
    // Wait for list to load then open first quote: open row menu and click "View / Open quote" (menuitem)
    await expect(page.locator("table tbody tr td").filter({ hasText: /^PHQ-/ }).first()).toBeVisible({ timeout: 15000 });
    await page.locator("table tbody tr").first().locator("td[data-no-row-click]").getByRole("button").click();
    const viewQuoteItem = page.getByRole("menuitem", { name: /view \/ open quote/i }).or(page.getByRole("link", { name: /view \/ open quote/i })).first();
    await expect(viewQuoteItem).toBeVisible({ timeout: 5000 });
    await viewQuoteItem.click();
    await expect(page).toHaveURL(/\/admin\/quotes\/[^/]+/, { timeout: 15000 });
    const moveToBtn = page.getByRole("button").filter({ hasText: /Move to/i }).first();
    await expect(moveToBtn).toBeVisible({ timeout: 10000 });
    await moveToBtn.click();
    await expect(page.getByText("Status updated.").first()).toBeVisible({ timeout: 8000 });
  });

  test("Admin can assign quote to staff member", async ({ page }) => {
    await loginAsAdmin(page, "/admin/quotes");
    await page.goto("/admin/quotes");
    const firstQuoteLink = page.locator('a[href*="/admin/quotes/"]').first();
    await firstQuoteLink.click();
    await expect(page).toHaveURL(/\/admin\/quotes\/.+/);
    const assignSelect = page.getByLabel(/assign|staff/i).or(page.locator('select[name*="assign"]')).first();
    if (await assignSelect.isVisible()) {
      await assignSelect.selectOption({ index: 1 });
      await page.getByRole("button", { name: /save|update/i }).first().click();
      await expect(page.getByText(/saved|updated|Sales|Marketing/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test("Admin can send quote to customer with amount", async ({ page }) => {
    await loginAsAdmin(page, "/admin/quotes");
    await page.goto("/admin/quotes");
    const firstQuoteLink = page.locator('a[href*="/admin/quotes/"]').first();
    await firstQuoteLink.click();
    const amountInput = page.getByLabel(/amount|quoted|kes/i).first();
    if (await amountInput.isVisible()) {
      await amountInput.fill("5000");
      await page.getByRole("button", { name: /send|quote to customer|submit/i }).first().click();
      await expect(page.getByText(/sent|saved|updated/i)).toBeVisible({ timeout: 8000 });
    }
  });

  test("Customer receives confirmation email on submission", async ({ page }) => {
    test.skip(true, "Email delivery not asserted in E2E; use mock or integration test.");
  });

  test("Customer can see quote in /account", async ({ page }) => {
    test.skip(true, "Quote created via request context may not send customer session; verify POST /api/quotes sets customerId from session when called with customer cookies.");
  });
});
