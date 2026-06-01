"use server";

import { revalidatePath } from "next/cache";
import type {
  LibraryResourceCategory,
  LibraryVisibility,
} from "@prisma/client";
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
