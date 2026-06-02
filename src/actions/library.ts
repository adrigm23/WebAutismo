"use server";

import { revalidatePath } from "next/cache";
import type {
  LibraryResourceAudience,
  LibraryResourceCategory,
  LibraryResourceStatus,
  LibraryVisibility,
} from "@prisma/client";
import { assertSafeHttpUrl } from "@/lib/file-security";
import { requireUser } from "@/lib/auth";
import {
  createLibraryResource,
  createLibraryFolder,
  updateLibraryResource,
  deleteLibraryResource,
  deleteLibraryFolder,
} from "@/lib/library";

export type LibraryActionState = {
  error?: string;
  success?: boolean;
};

function canManageLibrary(globalRole: string) {
  return globalRole === "TEACHER" || globalRole === "ADMIN";
}

// ─── Upload resource ──────────────────────────────────────────────────────────

export async function uploadLibraryResourceAction(
  _state: LibraryActionState,
  formData: FormData
): Promise<LibraryActionState> {
  try {
    const user = await requireUser();
    if (!canManageLibrary(user.globalRole)) {
      return { error: "No tienes permisos para subir recursos." };
    }

    const title = formData.get("title");
    const description = formData.get("description");
    const visibility = formData.get("visibility");
    const category = formData.get("category");
    const courseId = formData.get("courseId");
    const folderId = formData.get("folderId");
    const file = formData.get("file");

    if (typeof title !== "string" || title.trim().length < 2) {
      return { error: "El título debe tener al menos 2 caracteres." };
    }
    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: "Debes seleccionar un archivo." };
    }
    if (typeof visibility !== "string") {
      return { error: "Visibilidad requerida." };
    }

    await createLibraryResource({
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      file,
      category: (category as LibraryResourceCategory) || null,
      visibility: visibility as LibraryVisibility,
      courseId: typeof courseId === "string" && courseId ? courseId : null,
      folderId: typeof folderId === "string" && folderId ? folderId : null,
      uploadedById: user.id,
    });

    revalidatePath("/biblioteca");
    revalidatePath("/docente/biblioteca");
    revalidatePath("/admin/biblioteca");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al subir el recurso.",
    };
  }
}

// ─── Update resource ──────────────────────────────────────────────────────────

export async function updateLibraryResourceAction(
  _state: LibraryActionState,
  formData: FormData
): Promise<LibraryActionState> {
  try {
    const user = await requireUser();
    if (!canManageLibrary(user.globalRole)) {
      return { error: "No tienes permisos para editar recursos." };
    }

    const id = formData.get("id");
    const title = formData.get("title");
    const description = formData.get("description");
    const visibility = formData.get("visibility");
    const category = formData.get("category");
    const courseId = formData.get("courseId");
    const folderId = formData.get("folderId");
    const file = formData.get("file");

    if (typeof id !== "string" || !id) return { error: "ID de recurso requerido." };
    if (typeof title !== "string" || title.trim().length < 2) {
      return { error: "El título debe tener al menos 2 caracteres." };
    }
    if (typeof visibility !== "string") {
      return { error: "Visibilidad requerida." };
    }

    await updateLibraryResource({
      id,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      category: (category as LibraryResourceCategory) || null,
      visibility: visibility as LibraryVisibility,
      courseId: typeof courseId === "string" && courseId ? courseId : null,
      folderId: typeof folderId === "string" && folderId ? folderId : null,
      file: file instanceof File && file.size > 0 ? file : null,
    });

    revalidatePath("/biblioteca");
    revalidatePath("/docente/biblioteca");
    revalidatePath("/admin/biblioteca");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al actualizar el recurso.",
    };
  }
}

// ─── Delete resource ──────────────────────────────────────────────────────────

export async function deleteLibraryResourceAction(
  _state: LibraryActionState,
  formData: FormData
): Promise<LibraryActionState> {
  try {
    const user = await requireUser();
    if (!canManageLibrary(user.globalRole)) {
      return { error: "No tienes permisos para eliminar recursos." };
    }

    const id = formData.get("id");
    if (typeof id !== "string" || !id) return { error: "ID de recurso requerido." };

    await deleteLibraryResource(id);

    revalidatePath("/biblioteca");
    revalidatePath("/docente/biblioteca");
    revalidatePath("/admin/biblioteca");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al eliminar el recurso.",
    };
  }
}

// ─── Create folder ────────────────────────────────────────────────────────────

export async function createLibraryFolderAction(
  _state: LibraryActionState,
  formData: FormData
): Promise<LibraryActionState> {
  try {
    const user = await requireUser();
    if (!canManageLibrary(user.globalRole)) {
      return { error: "No tienes permisos para crear carpetas." };
    }

    const name = formData.get("name");
    const description = formData.get("description");
    const courseId = formData.get("courseId");
    const parentId = formData.get("parentId");

    if (typeof name !== "string" || name.trim().length < 2) {
      return { error: "El nombre debe tener al menos 2 caracteres." };
    }

    await createLibraryFolder({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      courseId: typeof courseId === "string" && courseId ? courseId : null,
      parentId: typeof parentId === "string" && parentId ? parentId : null,
      createdById: user.id,
    });

    revalidatePath("/biblioteca");
    revalidatePath("/docente/biblioteca");
    revalidatePath("/admin/biblioteca");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al crear la carpeta.",
    };
  }
}

// ─── Delete folder ────────────────────────────────────────────────────────────

export async function deleteLibraryFolderAction(
  _state: LibraryActionState,
  formData: FormData
): Promise<LibraryActionState> {
  try {
    const user = await requireUser();
    if (!canManageLibrary(user.globalRole)) {
      return { error: "No tienes permisos para eliminar carpetas." };
    }

    const id = formData.get("id");
    if (typeof id !== "string" || !id) return { error: "ID de carpeta requerido." };

    await deleteLibraryFolder(id);

    revalidatePath("/biblioteca");
    revalidatePath("/docente/biblioteca");
    revalidatePath("/admin/biblioteca");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al eliminar la carpeta.",
    };
  }
}

// ─── Publish / Draft resource (new full-page form) ────────────────────────────

export type PublishResourceActionState = {
  error?: string;
  success?: boolean;
  resourceId?: string;
};

export async function publishResourceAction(
  _state: PublishResourceActionState,
  formData: FormData
): Promise<PublishResourceActionState> {
  try {
    const user = await requireUser();
    if (!canManageLibrary(user.globalRole)) {
      return { error: "No tienes permisos para publicar recursos." };
    }

    const uploadMode = formData.get("uploadMode"); // "file" | "link"
    const actionType = formData.get("action"); // "publish" | "draft"
    const title = formData.get("title");
    const description = formData.get("description");
    const visibility = formData.get("visibility");
    const category = formData.get("category");
    const audience = formData.get("audience");
    const courseId = formData.get("courseId");
    const folderId = formData.get("folderId");
    const externalUrlRaw = formData.get("externalUrl");
    const file = formData.get("file");

    // Common validations
    if (typeof title !== "string" || title.trim().length < 2) {
      return { error: "El título debe tener al menos 2 caracteres." };
    }

    const isDraft = actionType === "draft";
    const status: LibraryResourceStatus = isDraft ? "DRAFT" : "PUBLISHED";

    // Validate required fields only when publishing
    if (!isDraft) {
      if (typeof visibility !== "string" || !visibility) {
        return { error: "Selecciona la visibilidad del recurso." };
      }
    }

    const resolvedVisibility = (typeof visibility === "string" && visibility
      ? visibility
      : "PRIVATE") as LibraryVisibility;

    if (uploadMode === "link") {
      if (typeof externalUrlRaw !== "string" || !externalUrlRaw.trim()) {
        return { error: "Introduce un enlace externo válido." };
      }
      let safeUrl: string;
      try {
        safeUrl = assertSafeHttpUrl(externalUrlRaw.trim());
      } catch {
        return { error: "El enlace debe empezar por http:// o https://." };
      }

      const resource = await createLibraryResource({
        title: title.trim(),
        description: typeof description === "string" ? description.trim() || null : null,
        externalUrl: safeUrl,
        category: (category as LibraryResourceCategory) || null,
        audience: (audience as LibraryResourceAudience) || null,
        visibility: resolvedVisibility,
        status,
        courseId: typeof courseId === "string" && courseId ? courseId : null,
        folderId: typeof folderId === "string" && folderId ? folderId : null,
        uploadedById: user.id,
      });

      revalidatePath("/biblioteca");
      revalidatePath("/docente/biblioteca");
      revalidatePath("/admin/biblioteca");
      return { success: true, resourceId: resource.id };
    }

    // File upload mode
    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: "Selecciona un archivo para subir." };
    }

    const resource = await createLibraryResource({
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      file,
      category: (category as LibraryResourceCategory) || null,
      audience: (audience as LibraryResourceAudience) || null,
      visibility: resolvedVisibility,
      status,
      courseId: typeof courseId === "string" && courseId ? courseId : null,
      folderId: typeof folderId === "string" && folderId ? folderId : null,
      uploadedById: user.id,
    });

    revalidatePath("/biblioteca");
    revalidatePath("/docente/biblioteca");
    revalidatePath("/admin/biblioteca");
    return { success: true, resourceId: resource.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al guardar el recurso.",
    };
  }
}
