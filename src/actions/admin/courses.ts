"use server";

import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { buildClonedCourseInput } from "@/lib/course-cloning";
import { getDb } from "@/lib/prisma";
import {
  enforceAdminMutationRateLimit,
  parseOptionalDate,
  requireAdminUser,
  revalidateAdminViews
} from "./shared";

export async function createCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "create-course",
    actorId: admin.id,
    redirectTo: "/admin/courses"
  });

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const title = String(formData.get("title") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || shortDescription;
  const priceInCents = Math.max(0, Number(formData.get("priceInCents") ?? 0));
  const duration =
    String(formData.get("duration") ?? "").trim() || "Pendiente de configurar";
  const level = String(formData.get("level") ?? "General").trim();
  const category = String(formData.get("category") ?? "General").trim();
  const accentFrom = String(formData.get("accentFrom") ?? "#163c58").trim();
  const accentTo = String(formData.get("accentTo") ?? "#2e6b8a").trim();
  const status =
    formData.get("status") === "ACTIVE"
      ? ("ACTIVE" as const)
      : ("INACTIVE" as const);
  const teacherIds = formData
    .getAll("teacherIds")
    .map(String)
    .filter(Boolean);

  if (!slug || !title || !shortDescription) {
    redirect("/admin/courses?error=course-create");
  }

  const db = getDb();
  const existing = await db.course.findUnique({
    where: { slug },
    select: { id: true }
  });
  if (existing) {
    redirect("/admin/courses/nuevo?error=slug-taken");
  }

  const course = await db.course.create({
    data: {
      slug,
      title,
      shortDescription,
      description,
      priceInCents,
      duration,
      format: "Campus online",
      level,
      accentFrom,
      accentTo,
      category,
      audienceJson: [],
      outcomesJson: [],
      methodologyJson: [],
      faqJson: [],
      seoTitle: title,
      seoDescription: shortDescription,
      status,
      editions: {
        create: {
          label: "Edición 1",
          editionNumber: 1,
          status: "ACTIVE",
          isActive: true,
          graceAccessDays: 0
        }
      }
    }
  });

  if (teacherIds.length > 0) {
    await db.courseTeacherAssignment.createMany({
      data: teacherIds.map((userId) => ({ courseId: course.id, userId })),
      skipDuplicates: true
    });
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "COURSE_CREATED",
    entityType: "COURSE",
    entityId: course.id,
    entityLabel: course.title,
    metadata: { slug }
  });

  revalidateAdminViews();
  const tabParam = status === "INACTIVE" ? "&tab=borradores" : "";
  redirect(`/admin/courses?courseId=${course.id}${tabParam}#course-detail`);
}

export async function updateCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "update-course",
    actorId: admin.id,
    redirectTo: "/admin/courses"
  });
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
  redirect(`/admin/courses?courseId=${course.id}#course-detail`);
}

export async function cloneCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "clone-course",
    actorId: admin.id,
    redirectTo: "/admin/courses"
  });
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
          label: "Edición 1",
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
  redirect(`/admin/courses?courseId=${clonedCourse.id}#course-detail`);
}

export async function createCourseEditionAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "create-course-edition",
    actorId: admin.id,
    redirectTo: "/admin/editions"
  });
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
  redirect(`/admin/courses?courseId=${courseId}#course-detail`);
}

export async function updateCourseEditionAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "update-course-edition",
    actorId: admin.id,
    redirectTo: "/admin/editions"
  });
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

  // When an edition is closed or cancelled, expire all active enrollments in it
  if (edition.status === "CLOSED" || edition.status === "CANCELLED") {
    await getDb().courseEnrollment.updateMany({
      where: {
        courseEditionId: edition.id,
        status: "ACTIVE",
      },
      data: {
        status: "EXPIRED",
      },
    });
  }

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
