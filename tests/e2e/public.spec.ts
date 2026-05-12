import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("home page renders the main marketing content", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Formacion especializada en autismo con compra directa, campus privado y un recorrido de acceso claro." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver cursos" })).toBeVisible();
  });

  test("courses index renders at least one course card", async ({ page }) => {
    await page.goto("/cursos", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Catalogo de cursos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver curso" }).first()).toBeVisible();
  });
});
