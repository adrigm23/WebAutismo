import { expect, test, type Page } from "@playwright/test";

const studentEmail = process.env.E2E_STUDENT_EMAIL;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;
const courseSlug = process.env.E2E_COURSE_SLUG;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

async function loginFromAccessPanel(page: Page, email: string, password: string) {
  await page.getByLabel(/correo/i).fill(email);
  await page.getByLabel(/contrase/i).fill(password);
  await Promise.all([
    page.waitForURL(/\/mis-cursos|\/admin/, { timeout: 15_000 }),
    page.getByRole("button", { name: /acceder al panel/i }).click()
  ]);
}

async function expectVisibleCampusCta(page: Page) {
  for (const label of ["Continuar contenido", "Abrir tarea", "Ver recurso"]) {
    const button = page.getByRole("button", { name: label, exact: true });

    if ((await button.count()) > 0) {
      await expect(button).toBeVisible();
      return;
    }
  }

  throw new Error("Expected a visible campus CTA button.");
}

test.describe("authenticated student flows", () => {
  test.skip(
    !studentEmail || !studentPassword || !courseSlug,
    "Set E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD and E2E_COURSE_SLUG to run authenticated student flows."
  );

  test("login, my courses, campus and forum are reachable", async ({ page }) => {
    await page.goto("/acceder");
    await loginFromAccessPanel(page, studentEmail!, studentPassword!);

    await expect(page).toHaveURL(/\/mis-cursos/);
    await expect(page.getByRole("link", { name: /^Mis cursos$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();

    await page.goto("/mis-cursos");
    await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Comunidad$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Soporte$/ })).toBeVisible();

    await page.goto(`/mis-cursos/${courseSlug}`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Foro$/ })).toBeVisible();
    await expect(page.getByText(/^Comunidad$/)).toBeVisible();
    await expectVisibleCampusCta(page);

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

  test("admin login lands on the admin dashboard and mi cuenta remains reachable", async ({ page }) => {
    await page.goto("/acceder");
    await loginFromAccessPanel(page, adminEmail!, adminPassword!);

    await page.waitForURL(/\/admin/, { timeout: 10_000 });
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { name: /dashboard general|admin/i })).toBeVisible();

    await page.goto("/mi-cuenta");
    await page.waitForURL(/\/mi-cuenta(?:$|[?#])/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /hola/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /abrir administracion/i })).toBeVisible();
  });
});
