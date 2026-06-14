"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import path from "path";
import type { CourseResourceSource, CourseResourceType, CourseStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import {
  COURSE_COVER_IMAGE_UPLOAD_POLICY,
  COURSE_RESOURCE_UPLOAD_POLICY,
  validateFileUpload,
} from "@/lib/file-security";
import { deleteStoredObject, writeStoredObject } from "@/lib/object-storage";

// ─── Shared ───────────────────────────────────────────────────────────────────

export type BuilderActionState = { error?: string; success?: boolean; module?: { id: string; title: string; position: number } };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "modulo";
}

async function requireBuilderAccess(courseId: string) {
  const user = await requireUser();
  const db = getDb();

  if (user.globalRole === "ADMIN") return { user, db };

  const assignment = await db.courseTeacherAssignment.findFirst({
    where: { courseId, userId: user.id },
    select: { id: true },
  });

  if (!assignment) throw new Error("No tienes permisos para editar este curso.");

  return { user, db };
}

function revalidateCourse(slug: string) {
  revalidatePath(`/docente/cursos/${slug}/constructor`);
  revalidatePath(`/cursos/${slug}`);
}

// ─── Course metadata ──────────────────────────────────────────────────────────

export async function updateCourseStatusAction(
  _state: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  try {
    const courseId = formData.get("courseId");
    const status = formData.get("status");

    if (typeof courseId !== "string" || !courseId) return { error: "Curso no válido." };
    if (status !== "ACTIVE" && status !== "INACTIVE") return { error: "Estado no válido." };

    const { db } = await requireBuilderAccess(courseId);

    const course = await db.course.update({
      where: { id: courseId },
      data: { status: status as CourseStatus },
      select: { slug: true },
    });

    revalidateCourse(course.slug);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar el estado." };
  }
}

export async function updateCourseCategoryAction(
  _state: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  try {
    const courseId = formData.get("courseId");
    const category = formData.get("category");

    if (typeof courseId !== "string" || !courseId) return { error: "Curso no válido." };
    if (typeof category !== "string" || !category.trim()) return { error: "Categoría requerida." };

    const { db } = await requireBuilderAccess(courseId);

    const course = await db.course.update({
      where: { id: courseId },
      data: { category: category.trim() },
      select: { slug: true },
    });

    revalidateCourse(course.slug);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar la categoría." };
  }
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export type AddModuleResult = {
  error?: string;
  module?: { id: string; title: string; position: number };
};

export async function addCourseModuleAction(
  _state: AddModuleResult,
  formData: FormData,
): Promise<AddModuleResult> {
  try {
    const courseId = formData.get("courseId");
    const title = formData.get("title");

    if (typeof courseId !== "string" || !courseId) return { error: "Curso no válido." };
    if (typeof title !== "string" || title.trim().length < 2)
      return { error: "El título debe tener al menos 2 caracteres." };

    const { db } = await requireBuilderAccess(courseId);

    const count = await db.courseModule.count({ where: { courseId } });
    const position = count + 1;
    const baseKey = slugify(title.trim());

    // Ensure unique moduleKey
    const existing = await db.courseModule.findMany({
      where: { courseId, moduleKey: { startsWith: baseKey } },
      select: { moduleKey: true },
    });
    const moduleKey = existing.length === 0 ? baseKey : `${baseKey}-${randomUUID().slice(0, 6)}`;

    const mod = await db.courseModule.create({
      data: {
        courseId,
        moduleKey,
        title: title.trim(),
        description: "",
        estimatedTime: "0 min",
        resourcesSummary: "",
        position,
      },
      select: { id: true, title: true, position: true },
    });

    const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
    if (course) revalidateCourse(course.slug);

    return { module: mod };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear el módulo." };
  }
}

export async function updateCourseModuleAction(
  _state: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  try {
    const moduleId = formData.get("moduleId");
    const title = formData.get("title");
    const description = formData.get("description");
    const estimatedTime = formData.get("estimatedTime");

    if (typeof moduleId !== "string" || !moduleId) return { error: "Módulo no válido." };
    if (typeof title !== "string" || title.trim().length < 2)
      return { error: "El título debe tener al menos 2 caracteres." };

    const mod = await getDb().courseModule.findUnique({
      where: { id: moduleId },
      select: { courseId: true },
    });
    if (!mod) return { error: "Módulo no encontrado." };

    const { db } = await requireBuilderAccess(mod.courseId);

    const updated = await db.courseModule.update({
      where: { id: moduleId },
      data: {
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : undefined,
        estimatedTime: typeof estimatedTime === "string" && estimatedTime.trim()
          ? estimatedTime.trim()
          : undefined,
      },
      select: { id: true, title: true, position: true },
    });

    const course = await db.course.findUnique({
      where: { id: mod.courseId },
      select: { slug: true },
    });
    if (course) revalidateCourse(course.slug);

    return { success: true, module: { id: updated.id, title: updated.title, position: updated.position } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar el módulo." };
  }
}

export async function deleteCourseModuleAction(
  _state: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  try {
    const moduleId = formData.get("moduleId");
    if (typeof moduleId !== "string" || !moduleId) return { error: "Módulo no válido." };

    const mod = await getDb().courseModule.findUnique({
      where: { id: moduleId },
      select: { courseId: true, position: true },
    });
    if (!mod) return { error: "Módulo no encontrado." };

    const { db } = await requireBuilderAccess(mod.courseId);
    await db.courseModule.delete({ where: { id: moduleId } });

    // Reorder remaining
    const remaining = await db.courseModule.findMany({
      where: { courseId: mod.courseId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    await Promise.all(
      remaining.map((m, i) =>
        db.courseModule.update({ where: { id: m.id }, data: { position: i + 1 } }),
      ),
    );

    const course = await db.course.findUnique({
      where: { id: mod.courseId },
      select: { slug: true },
    });
    if (course) revalidateCourse(course.slug);

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al eliminar el módulo." };
  }
}

export async function moveModuleAction(
  _state: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  try {
    const moduleId = formData.get("moduleId");
    const direction = formData.get("direction");

    if (typeof moduleId !== "string" || !moduleId) return { error: "Módulo no válido." };
    if (direction !== "up" && direction !== "down") return { error: "Dirección no válida." };

    const mod = await getDb().courseModule.findUnique({
      where: { id: moduleId },
      select: { courseId: true, position: true },
    });
    if (!mod) return { error: "Módulo no encontrado." };

    const { db } = await requireBuilderAccess(mod.courseId);

    const targetPosition = direction === "up" ? mod.position - 1 : mod.position + 1;
    if (targetPosition < 1) return { success: true };

    const sibling = await db.courseModule.findFirst({
      where: { courseId: mod.courseId, position: targetPosition },
      select: { id: true },
    });

    if (sibling) {
      await db.$transaction([
        db.courseModule.update({ where: { id: moduleId }, data: { position: targetPosition } }),
        db.courseModule.update({ where: { id: sibling.id }, data: { position: mod.position } }),
      ]);
    }

    const course = await db.course.findUnique({
      where: { id: mod.courseId },
      select: { slug: true },
    });
    if (course) revalidateCourse(course.slug);

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al reordenar módulos." };
  }
}

// ─── Resources (lessons) ─────────────────────────────────────────────────────

export type AddResourceResult = {
  error?: string;
  resource?: {
    id: string;
    title: string;
    type: CourseResourceType;
    source: CourseResourceSource;
    mimeType: string | null;
    linkUrl: string | null;
  };
};

export async function addCourseResourceAction(
  _state: AddResourceResult,
  formData: FormData,
): Promise<AddResourceResult> {
  const courseId = formData.get("courseId");
  const moduleId = formData.get("moduleId");
  const title = formData.get("title");
  const type = formData.get("type");
  const source = formData.get("source");
  const linkUrl = formData.get("linkUrl");
  const file = formData.get("file");
  const description = formData.get("description");
  const isPublishedRaw = formData.get("isPublished");
  const isPublished = isPublishedRaw !== "false";

  if (typeof courseId !== "string" || !courseId) return { error: "Curso no válido." };
  if (moduleId !== null && (typeof moduleId !== "string" || !moduleId)) return { error: "Módulo no válido." };
  if (typeof title !== "string" || title.trim().length < 2)
    return { error: "El título debe tener al menos 2 caracteres." };
  if (type !== "MATERIAL" && type !== "EXERCISE") return { error: "Tipo de lección no válido." };
  if (source !== "FILE" && source !== "LINK") return { error: "Origen no válido." };

  let resource: AddResourceResult["resource"];

  try {
    const { user, db } = await requireBuilderAccess(courseId);

    const count = await db.courseResource.count({ where: { moduleId } });

    let storageKey: string | undefined;
    let mimeType: string | undefined;
    let sizeInBytes: number | undefined;
    let resolvedLinkUrl: string | undefined;

    if (source === "LINK") {
      if (typeof linkUrl !== "string" || !linkUrl.trim()) {
        return { error: "Introduce una URL válida." };
      }
      resolvedLinkUrl = linkUrl.trim();
    } else if (source === "FILE" && file instanceof File && file.size > 0) {
      const validated = validateFileUpload(file, COURSE_RESOURCE_UPLOAD_POLICY);
      const ext = path.extname(validated.fileName);
      const key = `course-resources/${courseId}/${randomUUID()}${ext}`;
      await writeStoredObject({
        storageKey: key,
        content: new Uint8Array(await file.arrayBuffer()),
        contentType: validated.mimeType,
      });
      storageKey = key;
      mimeType = validated.mimeType;
      sizeInBytes = validated.sizeInBytes;
    }

    const created = await db.courseResource.create({
      data: {
        courseId,
        moduleId: typeof moduleId === "string" ? moduleId : null,
        createdById: user.id,
        type: type as CourseResourceType,
        source: source as CourseResourceSource,
        title: title.trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        linkUrl: resolvedLinkUrl ?? null,
        storageKey: storageKey ?? null,
        mimeType: mimeType ?? null,
        sizeInBytes: sizeInBytes ?? null,
        sortOrder: count,
        isPublished,
      },
      select: { id: true, title: true, type: true, source: true, mimeType: true, linkUrl: true },
    });

    const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
    if (course) revalidateCourse(course.slug);

    resource = created;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al añadir la lección." };
  }

  const redirectTo = formData.get("redirectTo");
  if (typeof redirectTo === "string" && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  return { resource };
}

export async function updateCourseResourceAction(
  _state: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  try {
    const resourceId = formData.get("resourceId");
    const title = formData.get("title");
    const linkUrl = formData.get("linkUrl");

    if (typeof resourceId !== "string" || !resourceId) return { error: "Recurso no válido." };
    if (typeof title !== "string" || title.trim().length < 2)
      return { error: "El título debe tener al menos 2 caracteres." };

    const res = await getDb().courseResource.findUnique({
      where: { id: resourceId },
      select: { courseId: true },
    });
    if (!res) return { error: "Lección no encontrada." };

    const { db } = await requireBuilderAccess(res.courseId);
    await db.courseResource.update({
      where: { id: resourceId },
      data: {
        title: title.trim(),
        linkUrl: typeof linkUrl === "string" ? linkUrl.trim() || null : undefined,
      },
    });

    const course = await db.course.findUnique({
      where: { id: res.courseId },
      select: { slug: true },
    });
    if (course) revalidateCourse(course.slug);

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar la lección." };
  }
}

export async function deleteCourseResourceAction(
  _state: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  try {
    const resourceId = formData.get("resourceId");
    if (typeof resourceId !== "string" || !resourceId) return { error: "Recurso no válido." };

    const res = await getDb().courseResource.findUnique({
      where: { id: resourceId },
      select: { courseId: true },
    });
    if (!res) return { error: "Lección no encontrada." };

    const { db } = await requireBuilderAccess(res.courseId);
    await db.courseResource.delete({ where: { id: resourceId } });

    const course = await db.course.findUnique({
      where: { id: res.courseId },
      select: { slug: true },
    });
    if (course) revalidateCourse(course.slug);

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al eliminar la lección." };
  }
}

export async function updateCourseCoverImageAction(
  _state: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  try {
    const courseId = formData.get("courseId");
    const file = formData.get("file");

    if (typeof courseId !== "string" || !courseId) return { error: "Curso no válido." };
    if (!(file instanceof File) || file.size === 0) return { error: "Selecciona una imagen." };

    const validated = validateFileUpload(file, COURSE_COVER_IMAGE_UPLOAD_POLICY);

    const { db } = await requireBuilderAccess(courseId);

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { slug: true, coverImageStorageKey: true },
    });
    if (!course) return { error: "Curso no encontrado." };

    const ext = path.extname(validated.fileName);
    const key = `course-covers/${courseId}/${randomUUID()}${ext}`;
    await writeStoredObject({
      storageKey: key,
      content: new Uint8Array(await file.arrayBuffer()),
      contentType: validated.mimeType,
    });

    if (course.coverImageStorageKey) {
      await deleteStoredObject(course.coverImageStorageKey);
    }

    await db.course.update({
      where: { id: courseId },
      data: { coverImageStorageKey: key, coverImageMimeType: validated.mimeType },
    });

    revalidateCourse(course.slug);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al subir la imagen." };
  }
}

export async function reorderModulesAction(
  _state: BuilderActionState,
  formData: FormData,
): Promise<BuilderActionState> {
  try {
    const courseId = formData.get("courseId");
    const orderedIds = formData.get("orderedIds");

    if (typeof courseId !== "string" || !courseId) return { error: "Curso no válido." };
    if (typeof orderedIds !== "string" || !orderedIds) return { error: "Orden no válido." };

    const ids = JSON.parse(orderedIds) as string[];
    if (!Array.isArray(ids) || ids.some(id => typeof id !== "string")) return { error: "Datos de orden inválidos." };

    const { db } = await requireBuilderAccess(courseId);

    // Update all positions in a transaction
    await db.$transaction(
      ids.map((id, index) =>
        db.courseModule.update({
          where: { id },
          data: { position: index + 1 },
        })
      )
    );

    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al reordenar los módulos." };
  }
}
