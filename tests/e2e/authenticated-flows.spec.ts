import { expect, test, type Page } from "@playwright/test";

const studentEmail = process.env.E2E_STUDENT_EMAIL;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;
const courseSlug = process.env.E2E_COURSE_SLUG;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

async function loginFromAccessPanel(page: Page, email: string, password: string) {
  await page.getByLabel(/correo/i).fill(email);
  await page.getByLabel(/contrase/i).fill(password);
  await page.getByRole("button", { name: /acceder/i }).click();
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
    await expect(page.getByRole("link", { name: /mis cursos/i })).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: /continuar curso|abrir docencia|explorar catálogo/i
      })
    ).toBeVisible();

    await page.goto("/mis-cursos");
    await expect(page.getByRole("heading", { name: /mis cursos/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /volver a mi cuenta/i })).toBeVisible();

    await page.goto(`/mis-cursos/${courseSlug}`);
    await expect(page.getByRole("link", { name: /comunidad/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /vista simple|vista completa/i }).first()
    ).toBeVisible();

    await page.goto(`/mis-cursos/${courseSlug}/foro`);
    await expect(page.getByRole("link", { name: /nuevo hilo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /volver al campus/i })).toBeVisible();
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
    await expect(page.getByRole("link", { name: /abrir administracion/i })).toBeVisible();

    await page.goto("/admin");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /dashboard general|administraci[oó]n/i })
    ).toBeVisible();
  });
});
