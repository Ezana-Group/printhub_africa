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
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Invite new staff member" })).toBeVisible({ timeout: 10000 });
    const unique = `e2estaff${Date.now()}@printhub.africa`;
    const nameInput = page.locator("#invite-name");
    const emailInput = page.locator("#invite-email");
    await nameInput.waitFor({ state: "visible", timeout: 10000 });
    await nameInput.evaluate((el: HTMLInputElement, v: string) => {
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, "E2E Staff");
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.evaluate((el: HTMLInputElement, v: string) => {
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, unique);
    await dialog.getByRole("button", { name: /send invite/i }).click();
    await expect(page.getByText(/invited|sent|success|created/i)).toBeVisible({ timeout: 10000 });
  });

  test("All 4 tabs on staff detail page are clickable", async ({ page }) => {
    await page.goto("/admin/staff");
    const firstStaffLink = page.locator('a[href*="/admin/staff/"]').first();
    await firstStaffLink.click();
    await expect(page).toHaveURL(/\/admin\/staff\/.+/);
    const profileTab = page.getByRole("button", { name: "Profile", exact: true });
    const permissionsTab = page.getByRole("button", { name: "Permissions", exact: true });
    const activityTab = page.getByRole("button", { name: "Activity", exact: true });
    const performanceTab = page.getByRole("button", { name: "Performance", exact: true });
    await expect(profileTab).toBeVisible();
    await expect(permissionsTab).toBeVisible();
    await expect(activityTab).toBeVisible();
    await expect(performanceTab).toBeVisible();
    await permissionsTab.click();
    await expect(page.getByText("Orders").first()).toBeVisible({ timeout: 3000 });
    await activityTab.click();
    const activityEl = page.getByText(/activity|recent/i).first();
    if ((await activityEl.count()) > 0) {
      await expect(activityEl).toBeVisible({ timeout: 3000 });
    }
    await performanceTab.click();
    await expect(performanceTab).toBeVisible();
    await profileTab.click();
    await expect(profileTab).toBeVisible();
  });

  test("Profile edit saves correctly", async ({ page }) => {
    await page.goto("/admin/staff");
    const firstStaffLink = page.locator('a[href*="/admin/staff/"]').first();
    await firstStaffLink.click();
    await page.waitForURL(/\/admin\/staff\/.+/);
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    const section = page.locator("#staff-profile");
    await expect(section).toBeVisible({ timeout: 10000 });
    await section.scrollIntoViewIfNeeded();
    const editBtn = section.getByRole("button", { name: /edit profile/i });
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();
    const saveBtn = section.getByRole("button", { name: /save changes/i });
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    const nameInput = section.locator("input").first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill("Updated Name");
    await saveBtn.click({ timeout: 10000 });
    await expect(section.getByText("Saved.")).toBeVisible({ timeout: 8000 });
  });

  test("Delete staff shows confirmation and can be cancelled", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", "Delete menuitem click unstable in Firefox");
    await page.goto("/admin/staff");
    const firstRow = page.locator("table tbody tr").first();
    if (!(await firstRow.isVisible())) {
      test.skip(true, "No staff rows");
      return;
    }
    await firstRow.locator('button[aria-haspopup="menu"]').or(firstRow.getByRole("button").last()).click();
    await expect(page.getByRole("menu")).toBeVisible({ timeout: 5000 });
    const deleteItem = page.getByRole("menuitem", { name: /delete account/i });
    await deleteItem.waitFor({ state: "visible", timeout: 5000 });
    await deleteItem.evaluate((el) => (el as HTMLElement).click());
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText(/delete|remove|confirm/i).first()).toBeVisible({ timeout: 5000 });
    const cancelBtn = dialog.getByRole("button", { name: /cancel/i });
    await expect(cancelBtn).toBeVisible({ timeout: 5000 });
    await cancelBtn.evaluate((el) => (el as HTMLElement).click());
    await expect(dialog).toHaveCount(0);
  });
});
