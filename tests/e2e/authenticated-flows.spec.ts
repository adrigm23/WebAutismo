import { expect, test, type Page } from "@playwright/test";

const studentEmail = process.env.E2E_STUDENT_EMAIL;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;
const courseSlug = process.env.E2E_COURSE_SLUG;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

async function loginFromAccessPanel(page: Page, email: string, password: string) {
  const loginSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Inicia sesion" })
  });

  await loginSection.getByLabel("Correo electronico").fill(email);
  await loginSection.getByLabel("Contrasena").fill(password);
  await loginSection.getByRole("button", { name: "Acceder" }).click();
}

test.describe("authenticated student flows", () => {
  test.skip(
    !studentEmail || !studentPassword || !courseSlug,
    "Set E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD and E2E_COURSE_SLUG to run authenticated student flows."
  );

  test("login, account, course campus and forum are reachable", async ({ page }) => {
    await page.goto("/acceder");
    await loginFromAccessPanel(page, studentEmail!, studentPassword!);

    await expect(page).toHaveURL(/\/mi-cuenta/);
    await expect(page.getByRole("heading", { name: /Hola,/ })).toBeVisible();

    await page.goto(`/checkout/${courseSlug}`);
    await expect(page).toHaveURL(new RegExp(`/checkout/${courseSlug}|/mis-cursos/${courseSlug}`));

    await page.goto(`/mis-cursos/${courseSlug}`);
    await expect(page.getByRole("heading", { name: /Campus del curso/i })).toBeVisible();

    await page.goto(`/mis-cursos/${courseSlug}/foro`);
    await expect(page.getByRole("heading", { name: /foro/i })).toBeVisible();
  });
});

test.describe("authenticated admin flows", () => {
  test.skip(
    !adminEmail || !adminPassword,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin flows."
  );

  test("admin dashboard is reachable after login", async ({ page }) => {
    await page.goto("/acceder");
    await loginFromAccessPanel(page, adminEmail!, adminPassword!);

    await expect(page).toHaveURL(/\/mi-cuenta/);
    await expect(page.getByRole("link", { name: /Abrir administracion/i })).toBeVisible();

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Dashboard general/i })).toBeVisible();
  });
});
