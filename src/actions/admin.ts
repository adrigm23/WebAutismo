"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { buildClonedCourseInput } from "@/lib/course-cloning";
import { canManageUsers } from "@/lib/course-permissions";
import { hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/prisma";

function parseOptionalDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function requireAdminUser() {
  const user = await requireUser("/admin");

  if (!canManageUsers(user.globalRole)) {
    redirect("/mi-cuenta");
  }

  return user;
}

function revalidateAdminViews() {
  revalidatePath("/admin");
  revalidatePath("/cursos");
  revalidatePath("/mi-cuenta");
}

const createTeacherSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function createTeacherAction(formData: FormData) {
  const admin = await requireAdminUser();
  const parsed = createTeacherSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect("/admin?error=teacher");
  }

  const db = getDb();
  const normalizedEmail = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (existing) {
    redirect("/admin?error=teacher-exists");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const teacher = await db.user.create({
    data: {
      name: parsed.data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      globalRole: "TEACHER",
      notificationPreference: {
        create: {}
      }
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "USER_TEACHER_GRANTED",
    entityType: "USER",
    entityId: teacher.id,
    entityLabel: teacher.email,
    metadata: {
      createdUser: true
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdminUser();
  const userId = String(formData.get("userId") ?? "");
  const nextRole = String(formData.get("globalRole") ?? "");

  if (!userId || !["STUDENT", "TEACHER", "ADMIN"].includes(nextRole)) {
    redirect("/admin?error=user-role");
  }

  const updatedUser = await getDb().user.update({
    where: {
      id: userId
    },
    data: {
      globalRole: nextRole as "STUDENT" | "TEACHER" | "ADMIN"
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action:
      nextRole === "ADMIN"
        ? "USER_ADMIN_GRANTED"
        : nextRole === "TEACHER"
          ? "USER_TEACHER_GRANTED"
          : "USER_ADMIN_REVOKED",
    entityType: "USER",
    entityId: updatedUser.id,
    entityLabel: updatedUser.email,
    metadata: {
      nextRole
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function toggleUserActiveAction(formData: FormData) {
  const admin = await requireAdminUser();
  const userId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!userId) {
    redirect("/admin?error=user-active");
  }

  const updatedUser = await getDb().user.update({
    where: {
      id: userId
    },
    data: {
      isActive: active,
      deactivatedAt: active ? null : new Date(),
      deactivatedById: active ? null : admin.id
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
    entityType: "USER",
    entityId: updatedUser.id,
    entityLabel: updatedUser.email
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function createCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const priceInCents = Number(formData.get("priceInCents") ?? 0);

  if (!slug || !title || !shortDescription || Number.isNaN(priceInCents)) {
    redirect("/admin?error=course-create");
  }

  const course = await getDb().course.create({
    data: {
      slug,
      title,
      shortDescription,
      description: shortDescription,
      priceInCents,
      duration: "Pendiente de configurar",
      format: "Campus online",
      level: "General",
      accentFrom: "#0b6357",
      accentTo: "#f08968",
      category: "General",
      audienceJson: [],
      outcomesJson: [],
      methodologyJson: [],
      faqJson: [],
      seoTitle: title,
      seoDescription: shortDescription,
      status: "ACTIVE",
      editions: {
        create: {
          label: "Edicion 1",
          editionNumber: 1,
          status: "ACTIVE",
          isActive: true,
          graceAccessDays: 0
        }
      }
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "COURSE_CREATED",
    entityType: "COURSE",
    entityId: course.id,
    entityLabel: course.title,
    metadata: {
      slug: course.slug
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function updateCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const priceInCents = Number(formData.get("priceInCents") ?? 0);
  const status = String(formData.get("status") ?? "ACTIVE");

  if (!courseId || !title || !shortDescription || Number.isNaN(priceInCents)) {
    redirect("/admin?error=course-update");
  }

  const course = await getDb().course.update({
    where: {
      id: courseId
    },
    data: {
      title,
      shortDescription,
      priceInCents,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE"
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "COURSE_UPDATED",
    entityType: "COURSE",
    entityId: course.id,
    entityLabel: course.title
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function cloneCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  const sourceSlug = String(formData.get("sourceSlug") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!sourceSlug || !slug || !title) {
    redirect("/admin?error=course-clone");
  }

  const sourceCourse = await getCatalogCourseBySlug(sourceSlug);

  if (!sourceCourse) {
    redirect("/admin?error=course-clone-source");
  }

  const cloneData = buildClonedCourseInput(sourceCourse, {
    slug,
    title,
    seoTitle: title
  });

  const clonedCourse = await getDb().course.create({
    data: {
      ...cloneData,
      clonedFrom: {
        connect: {
          id: sourceCourse.id
        }
      },
      modules: {
        create: cloneData.modules
      },
      editions: {
        create: {
          label: "Edicion 1",
          editionNumber: 1,
          status: "ACTIVE",
          isActive: true,
          graceAccessDays: sourceCourse.activeEdition?.graceAccessDays ?? 0
        }
      }
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "COURSE_CLONED",
    entityType: "COURSE",
    entityId: clonedCourse.id,
    entityLabel: clonedCourse.title,
    metadata: {
      sourceCourseId: sourceCourse.id,
      sourceCourseSlug: sourceCourse.slug
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function assignTeacherToCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  const courseId = String(formData.get("courseId") ?? "");
  const teacherUserId = String(formData.get("teacherUserId") ?? "");

  if (!courseId || !teacherUserId) {
    redirect("/admin?error=assign-teacher");
  }

  const [teacher, course] = await Promise.all([
    getDb().user.findUnique({
      where: {
        id: teacherUserId
      }
    }),
    getDb().course.findUnique({
      where: {
        id: courseId
      }
    })
  ]);

  if (!teacher || !course) {
    redirect("/admin?error=assign-teacher-missing");
  }

  await getDb().courseTeacherAssignment.upsert({
    where: {
      courseId_userId: {
        courseId,
        userId: teacherUserId
      }
    },
    update: {},
    create: {
      courseId,
      userId: teacherUserId
    }
  });

  if (teacher.globalRole === "STUDENT") {
    await getDb().user.update({
      where: {
        id: teacher.id
      },
      data: {
        globalRole: "TEACHER"
      }
    });
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "COURSE_TEACHER_ASSIGNED",
    entityType: "COURSE",
    entityId: course.id,
    entityLabel: course.title,
    metadata: {
      teacherUserId: teacher.id,
      teacherEmail: teacher.email
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function unassignTeacherFromCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  const courseId = String(formData.get("courseId") ?? "");
  const teacherUserId = String(formData.get("teacherUserId") ?? "");

  if (!courseId || !teacherUserId) {
    redirect("/admin?error=unassign-teacher");
  }

  await getDb().courseTeacherAssignment.deleteMany({
    where: {
      courseId,
      userId: teacherUserId
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "COURSE_TEACHER_UNASSIGNED",
    entityType: "COURSE",
    entityId: courseId,
    metadata: {
      teacherUserId
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function createCourseEditionAction(formData: FormData) {
  const admin = await requireAdminUser();
  const courseId = String(formData.get("courseId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const status = String(formData.get("status") ?? "ACTIVE");
  const graceAccessDays = Number(formData.get("graceAccessDays") ?? 0);

  if (!courseId || !label || Number.isNaN(graceAccessDays)) {
    redirect("/admin?error=edition-create");
  }

  const latestEdition = await getDb().courseEdition.findFirst({
    where: {
      courseId
    },
    orderBy: {
      editionNumber: "desc"
    }
  });

  const edition = await getDb().courseEdition.create({
    data: {
      courseId,
      label,
      editionNumber: (latestEdition?.editionNumber ?? 0) + 1,
      status:
        status === "SCHEDULED" || status === "CLOSED" || status === "CANCELLED"
          ? status
          : "ACTIVE",
      startsAt: parseOptionalDate(formData.get("startsAt")),
      endsAt: parseOptionalDate(formData.get("endsAt")),
      accessUntil: parseOptionalDate(formData.get("accessUntil")),
      graceAccessDays: Math.max(graceAccessDays, 0),
      isActive: true
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "EDITION_CREATED",
    entityType: "COURSE_EDITION",
    entityId: edition.id,
    entityLabel: edition.label,
    metadata: {
      courseId
    }
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function updateCourseEditionAction(formData: FormData) {
  const admin = await requireAdminUser();
  const editionId = String(formData.get("editionId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const status = String(formData.get("status") ?? "ACTIVE");
  const graceAccessDays = Number(formData.get("graceAccessDays") ?? 0);

  if (!editionId || !label || Number.isNaN(graceAccessDays)) {
    redirect("/admin?error=edition-update");
  }

  const edition = await getDb().courseEdition.update({
    where: {
      id: editionId
    },
    data: {
      label,
      status:
        status === "SCHEDULED" || status === "CLOSED" || status === "CANCELLED"
          ? status
          : "ACTIVE",
      startsAt: parseOptionalDate(formData.get("startsAt")),
      endsAt: parseOptionalDate(formData.get("endsAt")),
      accessUntil: parseOptionalDate(formData.get("accessUntil")),
      graceAccessDays: Math.max(graceAccessDays, 0),
      isActive: String(formData.get("isActive") ?? "") === "true"
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: edition.status === "CLOSED" ? "EDITION_CLOSED" : "EDITION_UPDATED",
    entityType: "COURSE_EDITION",
    entityId: edition.id,
    entityLabel: edition.label
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function createPromotionAction(formData: FormData) {
  const admin = await requireAdminUser();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const amountInCents = Number(formData.get("amountInCents") ?? 0);
  const usageLimitRaw = String(formData.get("usageLimit") ?? "").trim();
  const scope = String(formData.get("scope") ?? "GLOBAL");
  const courseId = String(formData.get("courseId") ?? "").trim();

  if (!code || Number.isNaN(amountInCents) || amountInCents < 0) {
    redirect("/admin?error=promotion-create");
  }

  const promotion = await getDb().promotion.create({
    data: {
      code,
      description: description || null,
      discountType:
        String(formData.get("discountType") ?? "") === "FIXED_AMOUNT"
          ? "FIXED_AMOUNT"
          : "PERCENTAGE",
      amountInCents,
      isActive: true,
      validFrom: parseOptionalDate(formData.get("validFrom")),
      validUntil: parseOptionalDate(formData.get("validUntil")),
      usageLimit: usageLimitRaw ? Number(usageLimitRaw) : null,
      scope: scope === "COURSE" ? "COURSE" : "GLOBAL",
      courseId: scope === "COURSE" && courseId ? courseId : null,
      createdById: admin.id,
      updatedById: admin.id
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "PROMOTION_CREATED",
    entityType: "PROMOTION",
    entityId: promotion.id,
    entityLabel: promotion.code
  });

  revalidateAdminViews();
  redirect("/admin");
}

export async function togglePromotionAction(formData: FormData) {
  const admin = await requireAdminUser();
  const promotionId = String(formData.get("promotionId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!promotionId) {
    redirect("/admin?error=promotion-toggle");
  }

  const promotion = await getDb().promotion.update({
    where: {
      id: promotionId
    },
    data: {
      isActive,
      updatedById: admin.id
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: isActive ? "PROMOTION_ACTIVATED" : "PROMOTION_DEACTIVATED",
    entityType: "PROMOTION",
    entityId: promotion.id,
    entityLabel: promotion.code
  });

  revalidateAdminViews();
  redirect("/admin");
}
