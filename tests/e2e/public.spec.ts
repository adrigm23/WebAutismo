import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("home page renders the main marketing content", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("link", { name: /ver cursos/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /acceder/i })).toBeVisible();
  });

  test("courses index renders at least one course card", async ({ page }) => {
    await page.goto("/cursos", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { name: /cursos/i })).toBeVisible();
    await expect(page.locator('a[href^="/cursos/"]').first()).toBeVisible();
  });
});
