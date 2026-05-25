import { expect, test, type Page } from "@playwright/test";

const studentEmail = process.env.E2E_STUDENT_EMAIL;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;
const courseSlug = process.env.E2E_COURSE_SLUG;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

async function loginFromAccessPanel(page: Page, email: string, password: string) {
  await page.getByLabel(/correo/i).fill(email);
  await page.getByLabel(/contrase/i).fill(password);
  await page.getByRole("button", { name: /acceder al panel/i }).click();
}

test.describe("authenticated student flows", () => {
  test.skip(
    !studentEmail || !studentPassword || !courseSlug,
    "Set E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD and E2E_COURSE_SLUG to run authenticated student flows."
  );

  test("login, my courses, campus and forum are reachable", async ({ page }) => {
    await page.goto("/acceder");
    await loginFromAccessPanel(page, studentEmail!, studentPassword!);

    await expect(page).toHaveURL(/\/mi-cuenta/);
    await expect(page.getByRole("link", { name: /^Mis cursos$/ })).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByRole("link", {
          name: /continuar leccion|abrir docencia|explorar catalogo/i
        })
        .first()
    ).toBeVisible();

    await page.goto("/mis-cursos");
    await expect(page.getByRole("heading", { name: /^Mis cursos$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Mi cuenta$/ })).toBeVisible();

    await page.goto(`/mis-cursos/${courseSlug}`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Foro$/ })).toBeVisible();
    await expect(page.getByText(/^Comunidad$/)).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: /continuar contenido|abrir tarea/i })
        .first()
    ).toBeVisible();

    await page.goto(`/mis-cursos/${courseSlug}/foro`);
    await expect(page.getByRole("link", { name: /^Nuevo hilo$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Volver al campus$/ })).toBeVisible();
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

    await page.waitForURL(/\/admin/, { timeout: 10_000 });
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { name: /dashboard general|admin/i })).toBeVisible();
  });
});
