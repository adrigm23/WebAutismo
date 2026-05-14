"use server";

import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { buildClonedCourseInput } from "@/lib/course-cloning";
import { getDb } from "@/lib/prisma";
import { parseOptionalDate, requireAdminUser, revalidateAdminViews } from "./shared";

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
