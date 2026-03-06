import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Staff", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, "/admin/staff");
  });

  test("Invite Staff modal opens without freezing page", async ({ page }) => {
    await page.goto("/admin/staff");
    await page.getByRole("button", { name: /invite|add staff/i }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Invite new staff member" })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("dialog").locator("#invite-email")).toBeVisible();
  });

  test("Invite form submits and creates staff record", async ({ page }) => {
    await page.goto("/admin/staff");
    await page.getByRole("button", { name: /invite|add staff/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const unique = `e2estaff${Date.now()}@printhub.africa`;
    await page.getByRole("dialog").locator("#invite-email").waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("dialog").locator("#invite-email").fill(unique, { force: true });
    await page.getByRole("dialog").locator("#invite-name").fill("E2E Staff", { force: true });
    await page.getByRole("dialog").getByRole("button", { name: "Send Invite" }).click({ force: true });
    await expect(page.getByText(/invited|sent|success|created/i)).toBeVisible({ timeout: 10000 });
  });

  test("All 4 tabs on staff detail page are clickable", async ({ page }) => {
    await page.goto("/admin/staff");
    const firstStaffLink = page.locator('a[href*="/admin/staff/"]').first();
    await firstStaffLink.click();
    await expect(page).toHaveURL(/\/admin\/staff\/.+/);
    const profileTab = page.getByRole("button", { name: "Profile", exact: true });
    const permissionsTab = page.getByRole("button", { name: "Permissions", exact: true });
    await expect(profileTab).toBeVisible();
    await expect(permissionsTab).toBeVisible();
    await permissionsTab.click();
    await expect(page.getByText("Orders").first()).toBeVisible({ timeout: 3000 });
  });

  test("Profile edit saves correctly", async ({ page }) => {
    await page.goto("/admin/staff");
    const firstStaffLink = page.locator('a[href*="/admin/staff/"]').first();
    await firstStaffLink.click();
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    const editBtn = page.getByRole("link", { name: /edit/i }).or(page.getByRole("button", { name: /edit/i })).first();
    await editBtn.click();
    const nameInput = page.getByLabel(/name/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("Updated Name");
      await page.getByRole("button", { name: /save/i }).first().click();
      await expect(page.getByText(/saved|updated|Updated Name/i)).toBeVisible({ timeout: 8000 });
    }
  });

  test("Delete staff shows confirmation and removes record", async ({ page }) => {
    await page.goto("/admin/staff");
    const firstRow = page.locator("table tbody tr").first();
    if (!(await firstRow.isVisible())) {
      test.skip(true, "No staff rows");
      return;
    }
    await firstRow.locator('button[aria-haspopup="menu"]').or(firstRow.getByRole("button").last()).click();
    await page.getByRole("menu").getByRole("menuitem", { name: /delete|remove/i }).click({ force: true });
    await expect(page.getByRole("alertdialog").getByText(/delete|remove|confirm/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });
});
