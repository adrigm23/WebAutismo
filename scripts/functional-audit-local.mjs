import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3003";
const suffix = Date.now().toString();

const sourceCourseSlug = "nociones-basicas-sobre-apoyo-conductual-positivo-para-profesionales";
const artifacts = {
  student: {
    name: `Audit Alumno ${suffix}`,
    email: `audit.alumno.${suffix}@autismocordoba.local`,
    password: "AuditAlumno2026!"
  },
  teacher: {
    name: `Audit Docente ${suffix}`,
    email: `audit.docente.${suffix}@autismocordoba.local`,
    password: "AuditDocente2026!"
  },
  simpleCourse: {
    title: `Curso simple audit ${suffix}`,
    slug: `curso-simple-audit-${suffix}`,
    shortDescription: `Curso simple de auditoria ${suffix}`
  },
  clonedCourse: {
    title: `Curso clonado audit ${suffix}`,
    slug: `curso-clonado-audit-${suffix}`
  },
  editionLabel: `Edicion audit ${suffix}`,
  promotionCode: `AUDIT${suffix.slice(-6)}`
};

const report = {
  baseUrl,
  suffix,
  steps: [],
  errors: []
};

function pushStep(name, ok, details = {}) {
  report.steps.push({ name, ok, ...details });
  if (!ok) {
    report.errors.push({ name, ...details });
  }
}

async function step(name, fn) {
  try {
    const details = (await fn()) ?? {};
    pushStep(name, true, details);
    return details;
  } catch (error) {
    pushStep(name, false, {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

async function login(page, email, password, expectedPattern) {
  await page.goto(`${baseUrl}/acceder`, { waitUntil: "domcontentloaded" });
  const form = page.locator("form").first();
  await form.locator('input[name="email"]').fill(email);
  await form.locator('input[name="password"]').fill(password);
  await form.locator('button[type="submit"]').click();
  await page.waitForURL(expectedPattern, { timeout: 30000 });
}

async function countCsvRows(page, href) {
  const result = await page.evaluate(async (url) => {
    const response = await fetch(url, { credentials: "include" });
    return {
      ok: response.ok,
      status: response.status,
      text: await response.text()
    };
  }, href);

  if (!result.ok) {
    throw new Error(`Export failed with status ${result.status} for ${href}`);
  }

  return result.text.trim().split("\n").length;
}

async function poll(label, fn, timeoutMs = 12000, intervalMs = 400) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await fn();
    if (value) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const studentCtx = await browser.newContext();
  const teacherCtx = await browser.newContext();
  const adminCtx = await browser.newContext();
  const studentPage = await studentCtx.newPage();
  const teacherPage = await teacherCtx.newPage();
  const adminPage = await adminCtx.newPage();

  let clonedCourse = null;
  let createdTeacher = null;
  let createdStudent = null;
  let createdPromotion = null;
  let createdEdition = null;
  let firstCategorySlug = null;
  let createdThreadId = null;
  let createdExerciseTitle = `Ejercicio audit ${suffix}`;
  let createdMaterialTitle = `Material audit ${suffix}`;

  try {
    await step("public_pages_load", async () => {
      const publicPage = await browser.newPage();
      const paths = [
        "/",
        "/plataforma",
        "/cursos",
        `/cursos/${sourceCourseSlug}`,
        `/checkout/${sourceCourseSlug}`,
        "/acceder",
        "/registro"
      ];
      const visited = [];
      for (const path of paths) {
        await publicPage.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
        visited.push({ path, title: await publicPage.title() });
      }
      await publicPage.close();
      return { visited };
    });

    await step("student_register", async () => {
      await studentPage.goto(`${baseUrl}/registro`, { waitUntil: "domcontentloaded" });
      const form = studentPage.locator("form").nth(1);
      await form.locator('input[name="name"]').fill(artifacts.student.name);
      await form.locator('input[name="email"]').fill(artifacts.student.email);
      await form.locator('input[name="password"]').fill(artifacts.student.password);
      await form.locator('input[name="confirmPassword"]').fill(artifacts.student.password);
      await form.locator('button[type="submit"]').click();
      await studentPage.waitForURL(/\/mi-cuenta/, { timeout: 30000 });
      createdStudent = await db.user.findUnique({
        where: { email: artifacts.student.email },
        select: { id: true, email: true, globalRole: true, isActive: true }
      });
      return { createdStudent };
    });

    await step("admin_login", async () => {
      await login(adminPage, "admin@autismocordoba.local", "CampusAdmin2026!", /\/admin|\/mi-cuenta/);
      if (new URL(adminPage.url()).pathname === "/mi-cuenta") {
        await adminPage.waitForURL(/\/admin/, { timeout: 30000 });
      }
      return { url: adminPage.url() };
    });

    await step("admin_pages_load", async () => {
      const pages = [
        "/admin",
        "/admin/users",
        "/admin/teachers",
        "/admin/courses",
        "/admin/editions",
        "/admin/promotions",
        "/admin/supervision",
        "/admin/audit"
      ];
      const visited = [];
      for (const path of pages) {
        await adminPage.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
        visited.push({ path, title: await adminPage.title() });
      }
      return { visited };
    });

    await step("admin_create_teacher", async () => {
      await adminPage.goto(`${baseUrl}/admin/teachers`, { waitUntil: "domcontentloaded" });
      const form = adminPage.locator("form").filter({
        has: adminPage.locator('input[name="name"][placeholder="Nombre y apellidos"]')
      }).first();
      await form.locator('input[name="name"]').fill(artifacts.teacher.name);
      await form.locator('input[name="email"]').fill(artifacts.teacher.email);
      await form.locator('input[name="password"]').fill(artifacts.teacher.password);
      await form.locator('button[type="submit"]').click();
      createdTeacher = await poll("teacher creation", () =>
        db.user.findUnique({
          where: { email: artifacts.teacher.email },
          select: { id: true, email: true, globalRole: true, isActive: true }
        })
      );
      if (!createdTeacher) {
        throw new Error("Teacher was not created");
      }
      return { createdTeacher };
    });

    await step("admin_create_simple_course", async () => {
      await adminPage.goto(`${baseUrl}/admin/courses?create=1#create-course`, {
        waitUntil: "domcontentloaded"
      });
      const form = adminPage
        .locator("form")
        .filter({ has: adminPage.locator('button[type="submit"]:has-text("Crear curso")') })
        .first();
      await form.locator('input[name="title"]').fill(artifacts.simpleCourse.title);
      await form.locator('input[name="slug"]').fill(artifacts.simpleCourse.slug);
      await form.locator('input[name="shortDescription"]').fill(artifacts.simpleCourse.shortDescription);
      await form.locator('input[name="priceInCents"]').fill("4900");
      await form.locator('button[type="submit"]').click();
      const course = await poll("simple course creation", () =>
        db.course.findUnique({
          where: { slug: artifacts.simpleCourse.slug },
          select: { id: true, slug: true, title: true }
        })
      );
      if (!course) {
        throw new Error("Simple course was not created");
      }
      return { course };
    });

    await step("admin_clone_course", async () => {
      const sourceCourse = await db.course.findUnique({
        where: { slug: sourceCourseSlug },
        select: { id: true, slug: true, title: true }
      });
      if (!sourceCourse) {
        throw new Error("Source course not found");
      }

      await adminPage.goto(`${baseUrl}/admin/courses?courseId=${sourceCourse.id}`, {
        waitUntil: "domcontentloaded"
      });
      const form = adminPage
        .locator("form")
        .filter({ has: adminPage.locator('button[type="submit"]:has-text("Clonar")') })
        .first();
      await form.locator('input[name="slug"]').fill(artifacts.clonedCourse.slug);
      await form.locator('input[name="title"]').fill(artifacts.clonedCourse.title);
      await form.locator('button[type="submit"]').click();
      clonedCourse = await poll("course cloning", () =>
        db.course.findUnique({
          where: { slug: artifacts.clonedCourse.slug },
          select: {
            id: true,
            slug: true,
            title: true,
            modules: { select: { id: true, title: true }, orderBy: { position: "asc" } },
            editions: { select: { id: true, label: true }, orderBy: { editionNumber: "asc" } }
          }
        })
      );
      if (!clonedCourse) {
        throw new Error("Cloned course was not created");
      }
      return {
        clonedCourse: {
          id: clonedCourse.id,
          slug: clonedCourse.slug,
          modules: clonedCourse.modules.length,
          editions: clonedCourse.editions.length
        }
      };
    });

    await step("admin_assign_teacher_course", async () => {
      await adminPage.goto(`${baseUrl}/admin/teachers?teacherId=${createdTeacher.id}`, {
        waitUntil: "domcontentloaded"
      });
      const courseForm = adminPage.locator("form").nth(3);
      const courseCheckbox = courseForm.locator(`input[type="checkbox"][value="${clonedCourse.id}"]`);
      await courseCheckbox.check();
      await courseForm.locator('button[type="submit"]').click();
      const assignment = await poll("teacher course assignment", () =>
        db.courseTeacherAssignment.findUnique({
          where: { courseId_userId: { courseId: clonedCourse.id, userId: createdTeacher.id } },
          select: { id: true }
        })
      );
      if (!assignment) {
        throw new Error("Teacher course assignment was not created");
      }
      return { assignmentId: assignment.id };
    });

    await step("admin_create_edition", async () => {
      await adminPage.goto(`${baseUrl}/admin/courses?courseId=${clonedCourse.id}`, {
        waitUntil: "domcontentloaded"
      });
      const form = adminPage
        .locator("form")
        .filter({ has: adminPage.locator('button[type="submit"]:has-text("Crear edicion")') })
        .first();
      await form.locator('input[name="label"]').fill(artifacts.editionLabel);
      await form.locator('select[name="status"]').selectOption("SCHEDULED");
      await form.locator('input[name="graceAccessDays"]').fill("14");
      await form.locator('button[type="submit"]').click();
      createdEdition = await poll("edition creation", () =>
        db.courseEdition.findFirst({
          where: { label: artifacts.editionLabel, courseId: clonedCourse.id },
          select: { id: true, label: true, graceAccessDays: true }
        })
      );
      if (!createdEdition) {
        throw new Error("Edition was not created");
      }
      return { createdEdition };
    });

    await step("admin_assign_teacher_edition", async () => {
      await adminPage.goto(`${baseUrl}/admin/teachers?teacherId=${createdTeacher.id}`, {
        waitUntil: "domcontentloaded"
      });
      const editionForm = adminPage.locator("form").nth(4);
      const editionCheckbox = editionForm.locator(
        `input[type="checkbox"][value="${createdEdition.id}"]`
      );
      await editionCheckbox.check();
      await editionForm.locator('button[type="submit"]').click();
      const assignment = await poll("teacher edition assignment", () =>
        db.courseEditionTeacherAssignment.findUnique({
          where: {
            courseEditionId_userId: { courseEditionId: createdEdition.id, userId: createdTeacher.id }
          },
          select: { id: true }
        })
      );
      if (!assignment) {
        throw new Error("Teacher edition assignment was not created");
      }
      return { assignmentId: assignment.id };
    });

    await step("admin_create_promotion", async () => {
      await adminPage.goto(`${baseUrl}/admin/promotions?create=1#create-promotion`, {
        waitUntil: "domcontentloaded"
      });
      const form = adminPage.locator("form").nth(3);
      await form.locator('input[name="code"]').fill(artifacts.promotionCode);
      await form.locator('input[name="description"]').fill("Promocion de auditoria");
      await form.locator('select[name="discountType"]').selectOption("PERCENTAGE");
      await form.locator('input[name="amountInCents"]').fill("15");
      await form.locator('select[name="scope"]').selectOption("COURSE");
      await form.locator('select[name="courseId"]').selectOption(clonedCourse.id);
      await form.locator('button[type="submit"]').click();
      createdPromotion = await poll("promotion creation", () =>
        db.promotion.findUnique({
          where: { code: artifacts.promotionCode },
          select: { id: true, code: true, isActive: true, courseId: true }
        })
      );
      if (!createdPromotion) {
        throw new Error("Promotion was not created");
      }
      return { createdPromotion };
    });

    await step("teacher_login", async () => {
      await login(
        teacherPage,
        artifacts.teacher.email,
        artifacts.teacher.password,
        /\/mi-cuenta|\/admin/
      );
      return { url: teacherPage.url() };
    });

    await step("teacher_dashboard_load", async () => {
      await teacherPage.goto(`${baseUrl}/mi-cuenta`, { waitUntil: "domcontentloaded" });
      const heading = await teacherPage.locator("h1").first().innerText();
      return { heading };
    });

    await step("teacher_publish_material", async () => {
      await teacherPage.goto(`${baseUrl}/mis-cursos/${clonedCourse.slug}?tab=resources`, {
        waitUntil: "networkidle"
      });
      await teacherPage.waitForLoadState("networkidle");
      const form = teacherPage.locator("form").first();
      await form.locator('select[name="type"]').selectOption("MATERIAL");
      await form.locator('select[name="source"]').selectOption("LINK");
      await teacherPage.locator('input[name="linkUrl"]').waitFor({ state: "visible", timeout: 10000 });
      await form.locator('input[name="title"]').fill(createdMaterialTitle);
      await form.locator('textarea[name="description"]').fill("Material publicado durante la auditoria.");
      await form.locator('select[name="moduleId"]').selectOption(clonedCourse.modules[0].id);
      await form.locator('input[name="linkUrl"]').fill("https://example.com/material-audit");
      await form.locator('button[type="submit"]').click();
      const resource = await poll("material creation", () =>
        db.courseResource.findFirst({
          where: { courseId: clonedCourse.id, title: createdMaterialTitle },
          select: { id: true, title: true, type: true, source: true, isPublished: true }
        })
      );
      if (!resource) {
        throw new Error("Material resource was not created");
      }
      return { resource };
    });

    await step("teacher_publish_exercise", async () => {
      await teacherPage.goto(`${baseUrl}/mis-cursos/${clonedCourse.slug}?tab=resources`, {
        waitUntil: "networkidle"
      });
      await teacherPage.waitForLoadState("networkidle");
      const form = teacherPage.locator("form").first();
      await form.locator('select[name="type"]').selectOption("EXERCISE");
      await form.locator('select[name="source"]').selectOption("LINK");
      await teacherPage.locator('input[name="linkUrl"]').waitFor({ state: "visible", timeout: 10000 });
      await form.locator('input[name="title"]').fill(createdExerciseTitle);
      await form.locator('textarea[name="description"]').fill("Ejercicio de auditoria funcional.");
      await form.locator('select[name="moduleId"]').selectOption(clonedCourse.modules[0].id);
      await form.locator('input[name="dueAt"]').fill("2026-05-31T18:30");
      await form.locator('input[name="passingScore"]').fill("5");
      await form.locator('input[name="linkUrl"]').fill("https://example.com/ejercicio-audit");
      await form.locator('button[type="submit"]').click();
      const resource = await poll("exercise creation", () =>
        db.courseResource.findFirst({
          where: { courseId: clonedCourse.id, title: createdExerciseTitle },
          select: { id: true, title: true, type: true, source: true, moduleId: true, isPublished: true }
        })
      );
      if (!resource) {
        throw new Error("Exercise resource was not created");
      }
      return { resource };
    });

    await step("student_checkout_with_promotion", async () => {
      await studentPage.goto(`${baseUrl}/checkout/${clonedCourse.slug}`, {
        waitUntil: "domcontentloaded"
      });
      await studentPage.locator('input[name="promotionCode"]').fill(artifacts.promotionCode);
      await studentPage.locator('button[type="submit"]').click();
      const enrollment = await poll("student enrollment after checkout", () =>
        db.courseEnrollment.findFirst({
          where: { userId: createdStudent.id, courseId: clonedCourse.id },
          select: { id: true, status: true, accessUntil: true, purchaseId: true }
        }),
        30000
      );
      if (!enrollment) {
        throw new Error("Enrollment was not created after checkout");
      }
      return { enrollment, finalUrl: studentPage.url() };
    });

    await step("student_dashboard_and_preferences", async () => {
      await studentPage.goto(`${baseUrl}/mi-cuenta`, { waitUntil: "domcontentloaded" });
      const preferenceForm = studentPage.locator("form").filter({
        has: studentPage.locator('input[name="emailEnabled"][value="false"]')
      }).filter({
        has: studentPage.locator('input[name="webEnabled"][value="true"]')
      }).first();
      await preferenceForm.locator('button[type="submit"]').click();
      const preference = await poll("student notification preference update", () =>
        db.notificationPreference.findUnique({
          where: { userId: createdStudent.id },
          select: { emailEnabled: true, webEnabled: true }
        })
      );
      return { preference };
    });

    await step("student_course_tabs_load", async () => {
      const urls = [
        `${baseUrl}/mis-cursos/${clonedCourse.slug}`,
        `${baseUrl}/mis-cursos/${clonedCourse.slug}?tab=resources`,
        `${baseUrl}/mis-cursos/${clonedCourse.slug}?tab=support`
      ];
      const visited = [];
      for (const url of urls) {
        await studentPage.goto(url, { waitUntil: "domcontentloaded" });
        visited.push({ url: studentPage.url(), title: await studentPage.title() });
      }
      return { visited };
    });

    await step("student_forum_create_thread", async () => {
      await studentPage.goto(`${baseUrl}/mis-cursos/${clonedCourse.slug}/foro`, {
        waitUntil: "domcontentloaded"
      });
      firstCategorySlug = "dudas";
      await studentPage.goto(`${baseUrl}/mis-cursos/${clonedCourse.slug}/foro/${firstCategorySlug}/nuevo`, {
        waitUntil: "domcontentloaded"
      });
      const threadTitle = `Hilo audit ${suffix}`;
      await studentPage.locator('input[name="title"]').fill(threadTitle);
      await studentPage.locator('textarea[name="body"]').fill("Mensaje inicial de auditoria del alumno.");
      await studentPage.locator('button[type="submit"]:has-text("Publicar contenido")').click();
      const thread = await poll("forum thread creation", () =>
        db.forumThread.findFirst({
          where: {
            title: threadTitle,
            authorId: createdStudent.id
          },
          select: { id: true, title: true, category: { select: { slug: true } } }
        }),
        20000
      );
      if (!thread) {
        throw new Error("Forum thread was not created");
      }
      createdThreadId = thread.id;
      return { thread };
    });

    await step("teacher_forum_reply", async () => {
      await teacherPage.goto(
        `${baseUrl}/mis-cursos/${clonedCourse.slug}/foro/${firstCategorySlug}/${createdThreadId}`,
        { waitUntil: "domcontentloaded" }
      );
      await teacherPage.locator('textarea[name="body"]').fill("Respuesta docente de auditoria.");
      await teacherPage.locator('button[type="submit"]:has-text("Responder")').click();
      const reply = await poll("teacher forum reply", () =>
        db.forumPost.findFirst({
          where: { threadId: createdThreadId, authorId: createdTeacher.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, threadId: true }
        })
      );
      if (!reply) {
        throw new Error("Teacher forum reply was not created");
      }
      return { replyId: reply.id };
    });

    await step("student_submit_exercise", async () => {
      await studentPage.goto(`${baseUrl}/mis-cursos/${clonedCourse.slug}?tab=resources`, {
        waitUntil: "domcontentloaded"
      });
      const form = studentPage.locator("form").filter({
        has: studentPage.locator('button[type="submit"]:has-text("Enviar entrega"), button[type="submit"]:has-text("Actualizar entrega")')
      }).first();
      await form.locator('textarea[name="body"]').fill("Entrega del alumno durante la auditoria.");
      await form.locator('input[name="linkUrl"]').fill("https://example.com/entrega-audit");
      await form.locator('button[type="submit"]').click();
      const exercise = await db.courseResource.findFirst({
        where: { courseId: clonedCourse.id, title: createdExerciseTitle },
        select: { id: true }
      });
      const submission = await poll("exercise submission", () =>
        db.courseResourceSubmission.findFirst({
          where: { resourceId: exercise.id, studentId: createdStudent.id },
          select: { id: true, status: true, linkUrl: true }
        })
      );
      if (!submission) {
        throw new Error("Exercise submission was not created");
      }
      return { submission };
    });

    await step("teacher_review_submission", async () => {
      await teacherPage.goto(`${baseUrl}/mis-cursos/${clonedCourse.slug}/seguimiento`, {
        waitUntil: "domcontentloaded"
      });
      const reviewForm = teacherPage.locator("form").filter({
        has: teacherPage.locator('button[type="submit"]:has-text("Marcar revisada")')
      }).first();
      await reviewForm.locator('textarea[name="feedback"]').fill("Feedback docente de auditoria.");
      await reviewForm.locator('input[name="score"]').fill("8.5");
      await reviewForm.locator('button[type="submit"]:has-text("Marcar revisada")').click();
      const exercise = await db.courseResource.findFirst({
        where: { courseId: clonedCourse.id, title: createdExerciseTitle },
        select: { id: true }
      });
      const submission = await poll("reviewed submission", () =>
        db.courseResourceSubmission.findFirst({
          where: { resourceId: exercise.id, studentId: createdStudent.id, status: "REVIEWED" },
          select: { id: true, status: true, score: true, feedback: true }
        })
      );
      if (!submission || submission.status !== "REVIEWED") {
        throw new Error("Submission review was not saved");
      }
      return { submission };
    });

    await step("student_sees_reviewed_submission", async () => {
      await studentPage.goto(`${baseUrl}/mis-cursos/${clonedCourse.slug}?tab=resources`, {
        waitUntil: "domcontentloaded"
      });
      const body = await studentPage.locator("body").innerText();
      if (
        !(body.includes("8,5/10") || body.includes("8.5/10")) ||
        !body.includes("Feedback docente de auditoria.")
      ) {
        throw new Error("Reviewed submission details are not visible to the student");
      }
      return { visible: true };
    });

    await step("teacher_forum_staff_pages_load", async () => {
      const urls = [
        `${baseUrl}/mis-cursos/${clonedCourse.slug}/foro`,
        `${baseUrl}/mis-cursos/${clonedCourse.slug}/foro/moderacion`,
        `${baseUrl}/mis-cursos/${clonedCourse.slug}/foro/historico`
      ];
      const visited = [];
      for (const url of urls) {
        await teacherPage.goto(url, { waitUntil: "domcontentloaded" });
        visited.push({ url: teacherPage.url(), title: await teacherPage.title() });
      }
      return { visited };
    });

    await step("admin_supervision_exports", async () => {
      await adminPage.goto(`${baseUrl}/admin/supervision`, { waitUntil: "domcontentloaded" });
      const datasets = ["enrollments", "progress", "submissions", "grades"];
      const counts = {};
      for (const dataset of datasets) {
        counts[dataset] = await countCsvRows(
          adminPage,
          `${baseUrl}/admin/supervision/export?dataset=${dataset}`
        );
      }
      return { counts };
    });

    await step("admin_users_role_and_active", async () => {
      await adminPage.goto(`${baseUrl}/admin/users`, { waitUntil: "domcontentloaded" });
      const roleForm = adminPage.locator("form").filter({
        has: adminPage.locator(`input[name="userId"][value="${createdStudent.id}"]`)
      }).filter({
        has: adminPage.locator('select[name="globalRole"]')
      }).first();
      await roleForm.locator('select[name="globalRole"]').selectOption("TEACHER");
      await roleForm.locator('button[type="submit"]').click();
      let user = await poll("user role update to teacher", () =>
        db.user.findUnique({
          where: { id: createdStudent.id },
          select: { globalRole: true, isActive: true }
        }).then((record) => (record?.globalRole === "TEACHER" ? record : null))
      );
      if (user.globalRole !== "TEACHER") {
        throw new Error("User role was not updated to teacher");
      }

      await adminPage.goto(`${baseUrl}/admin/users`, { waitUntil: "domcontentloaded" });
      const roleForm2 = adminPage.locator("form").filter({
        has: adminPage.locator(`input[name="userId"][value="${createdStudent.id}"]`)
      }).filter({
        has: adminPage.locator('select[name="globalRole"]')
      }).first();
      await roleForm2.locator('select[name="globalRole"]').selectOption("STUDENT");
      await roleForm2.locator('button[type="submit"]').click();
      user = await poll("user role restore to student", () =>
        db.user.findUnique({
          where: { id: createdStudent.id },
          select: { globalRole: true, isActive: true }
        }).then((record) => (record?.globalRole === "STUDENT" ? record : null))
      );

      await adminPage.goto(`${baseUrl}/admin/users`, { waitUntil: "domcontentloaded" });
      const activeForm = adminPage.locator("form").filter({
        has: adminPage.locator(`input[name="userId"][value="${createdStudent.id}"]`)
      }).filter({
        has: adminPage.locator('input[name="active"]')
      }).first();
      await activeForm.locator('button[type="submit"]').click();
      user = await poll("user deactivation", () =>
        db.user.findUnique({
          where: { id: createdStudent.id },
          select: { globalRole: true, isActive: true }
        }).then((record) => (record?.isActive === false ? record : null))
      );
      if (user.isActive !== false) {
        throw new Error("User was not deactivated");
      }

      await adminPage.goto(`${baseUrl}/admin/users`, { waitUntil: "domcontentloaded" });
      const activeForm2 = adminPage.locator("form").filter({
        has: adminPage.locator(`input[name="userId"][value="${createdStudent.id}"]`)
      }).filter({
        has: adminPage.locator('input[name="active"]')
      }).first();
      await activeForm2.locator('button[type="submit"]').click();
      user = await poll("user reactivation", () =>
        db.user.findUnique({
          where: { id: createdStudent.id },
          select: { globalRole: true, isActive: true }
        }).then((record) => (record?.isActive === true ? record : null))
      );
      if (user.globalRole !== "STUDENT" || user.isActive !== true) {
        throw new Error("User was not restored to active student");
      }
      return { user };
    });
  } finally {
    await studentCtx.close();
    await teacherCtx.close();
    await adminCtx.close();
    await browser.close();
    await db.$disconnect();
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify(report, null, 2));
  console.error(error);
  process.exitCode = 1;
});
