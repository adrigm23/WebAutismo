"use server";

import { revalidatePath } from "next/cache";
import type { CalendarEventType, CalendarEventVisibility } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import {
  createCalendarEvent,
  updateCalendarEvent,
  cancelCalendarEvent,
  getCalendarEventById,
} from "@/lib/calendar";

export type CalendarActionState = {
  error?: string;
  success?: boolean;
  eventId?: string;
};

function canManageCalendar(role: string) {
  return role === "TEACHER" || role === "ADMIN";
}

function revalidateAll() {
  revalidatePath("/calendario");
  revalidatePath("/docente/calendario");
  revalidatePath("/admin/calendario");
}

// ─── Create event ─────────────────────────────────────────────────────────────

export async function createCalendarEventAction(
  _state: CalendarActionState,
  formData: FormData
): Promise<CalendarActionState> {
  try {
    const user = await requireUser();
    if (!canManageCalendar(user.globalRole)) {
      return { error: "No tienes permisos para crear eventos." };
    }

    const title = formData.get("title");
    const description = formData.get("description");
    const type = formData.get("type");
    const startsAtRaw = formData.get("startsAt");
    const endsAtRaw = formData.get("endsAt");
    const courseId = formData.get("courseId");
    const meetingUrl = formData.get("meetingUrl");
    const location = formData.get("location");
    const visibility = formData.get("visibility");

    if (typeof title !== "string" || title.trim().length < 2) {
      return { error: "El título debe tener al menos 2 caracteres." };
    }
    if (typeof type !== "string" || !type) return { error: "Tipo de evento requerido." };
    if (typeof startsAtRaw !== "string" || !startsAtRaw) return { error: "Fecha de inicio requerida." };
    if (typeof endsAtRaw !== "string" || !endsAtRaw) return { error: "Fecha de fin requerida." };
    if (typeof visibility !== "string" || !visibility) return { error: "Visibilidad requerida." };

    const startsAt = new Date(startsAtRaw);
    const endsAt = new Date(endsAtRaw);

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      return { error: "Fechas inválidas." };
    }
    if (endsAt < startsAt) {
      return { error: "La fecha de fin debe ser posterior a la de inicio." };
    }

    const event = await createCalendarEvent({
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      type: type as CalendarEventType,
      startsAt,
      endsAt,
      courseId: typeof courseId === "string" && courseId ? courseId : null,
      meetingUrl: typeof meetingUrl === "string" && meetingUrl ? meetingUrl : null,
      location: typeof location === "string" && location ? location : null,
      visibility: visibility as CalendarEventVisibility,
      createdById: user.id,
    });

    revalidateAll();
    return { success: true, eventId: event.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear el evento." };
  }
}

// ─── Update event ─────────────────────────────────────────────────────────────

export async function updateCalendarEventAction(
  _state: CalendarActionState,
  formData: FormData
): Promise<CalendarActionState> {
  try {
    const user = await requireUser();
    if (!canManageCalendar(user.globalRole)) {
      return { error: "No tienes permisos para editar eventos." };
    }

    const id = formData.get("id");
    if (typeof id !== "string" || !id) return { error: "ID de evento requerido." };

    const existing = await getCalendarEventById(id);
    if (!existing) return { error: "El evento no existe." };
    if (user.globalRole !== "ADMIN" && existing.createdById !== user.id) {
      return { error: "Solo puedes editar tus propios eventos." };
    }

    const title = formData.get("title");
    const description = formData.get("description");
    const type = formData.get("type");
    const startsAtRaw = formData.get("startsAt");
    const endsAtRaw = formData.get("endsAt");
    const courseId = formData.get("courseId");
    const meetingUrl = formData.get("meetingUrl");
    const location = formData.get("location");
    const visibility = formData.get("visibility");

    if (typeof title !== "string" || title.trim().length < 2) {
      return { error: "El título debe tener al menos 2 caracteres." };
    }

    const startsAt = typeof startsAtRaw === "string" && startsAtRaw ? new Date(startsAtRaw) : undefined;
    const endsAt = typeof endsAtRaw === "string" && endsAtRaw ? new Date(endsAtRaw) : undefined;

    await updateCalendarEvent(id, {
      title: typeof title === "string" ? title.trim() : undefined,
      description: typeof description === "string" ? description.trim() || null : undefined,
      type: typeof type === "string" && type ? (type as CalendarEventType) : undefined,
      startsAt,
      endsAt,
      courseId: typeof courseId === "string" && courseId ? courseId : null,
      meetingUrl: typeof meetingUrl === "string" ? meetingUrl.trim() || null : undefined,
      location: typeof location === "string" ? location.trim() || null : undefined,
      visibility: typeof visibility === "string" && visibility ? (visibility as CalendarEventVisibility) : undefined,
    });

    revalidateAll();
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al actualizar el evento." };
  }
}

// ─── Cancel event ─────────────────────────────────────────────────────────────

export async function cancelCalendarEventAction(
  _state: CalendarActionState,
  formData: FormData
): Promise<CalendarActionState> {
  try {
    const user = await requireUser();
    if (!canManageCalendar(user.globalRole)) {
      return { error: "No tienes permisos para cancelar eventos." };
    }

    const id = formData.get("id");
    if (typeof id !== "string" || !id) return { error: "ID de evento requerido." };

    const existing = await getCalendarEventById(id);
    if (!existing) return { error: "El evento no existe." };
    if (user.globalRole !== "ADMIN" && existing.createdById !== user.id) {
      return { error: "Solo puedes cancelar tus propios eventos." };
    }

    await cancelCalendarEvent(id);

    revalidateAll();
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al cancelar el evento." };
  }
}
