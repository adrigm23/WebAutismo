"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { isDatabaseSchemaDriftError } from "@/lib/db-errors";
import {
  markAllUserNotificationsRead,
  markUserNotificationRead
} from "@/lib/notifications";
import { getDb } from "@/lib/prisma";
import { getSafeRedirect } from "@/lib/redirect";

const preferenceSchema = z.object({
  emailEnabled: z.union([z.literal("true"), z.literal("false")]),
  webEnabled: z.union([z.literal("true"), z.literal("false")])
});

export async function updateNotificationPreferencesAction(formData: FormData) {
  const user = await requireUser("/mi-cuenta");
  const parsed = preferenceSchema.safeParse({
    emailEnabled: formData.get("emailEnabled"),
    webEnabled: formData.get("webEnabled")
  });

  if (!parsed.success) {
    redirect("/mi-cuenta?error=preferences");
  }

  let preference;

  try {
    preference = await getDb().notificationPreference.upsert({
      where: {
        userId: user.id
      },
      update: {
        emailEnabled: parsed.data.emailEnabled === "true",
        webEnabled: parsed.data.webEnabled === "true"
      },
      create: {
        userId: user.id,
        emailEnabled: parsed.data.emailEnabled === "true",
        webEnabled: parsed.data.webEnabled === "true"
      }
    });
  } catch (error) {
    if (isDatabaseSchemaDriftError(error)) {
      redirect("/mi-cuenta");
    }

    throw error;
  }

  await writeAuditLog({
    actorId: user.id,
    action: "NOTIFICATION_PREFERENCES_UPDATED",
    entityType: "NOTIFICATION_PREFERENCE",
    entityId: preference.userId,
    entityLabel: user.email,
    metadata: {
      emailEnabled: preference.emailEnabled,
      webEnabled: preference.webEnabled
    }
  });

  revalidatePath("/mi-cuenta");
  redirect("/mi-cuenta");
}

export async function markUserNotificationReadAction(formData: FormData) {
  const user = await requireUser("/mi-cuenta");
  const notificationId = String(formData.get("notificationId") ?? "");
  const nextPath = String(formData.get("nextPath") ?? "/mi-cuenta");

  if (notificationId) {
    await markUserNotificationRead({
      notificationId,
      userId: user.id
    });
  }

  revalidatePath("/mi-cuenta");
  redirect(getSafeRedirect(nextPath, "/mi-cuenta"));
}

export async function markAllUserNotificationsReadAction(formData: FormData) {
  const user = await requireUser("/mi-cuenta");
  const nextPath = String(formData.get("nextPath") ?? "/mi-cuenta");

  await markAllUserNotificationsRead(user.id);
  revalidatePath("/mi-cuenta");
  redirect(getSafeRedirect(nextPath, "/mi-cuenta"));
}

export async function cancelEnrollmentAction(formData: FormData) {
  const user = await requireUser("/mi-cuenta");
  const enrollmentId = String(formData.get("enrollmentId") ?? "");

  if (!enrollmentId) {
    redirect("/mi-cuenta?error=enrollment");
  }

  const enrollment = await getDb().courseEnrollment.findUnique({
    where: {
      id: enrollmentId
    },
    include: {
      course: {
        select: {
          title: true,
          slug: true
        }
      }
    }
  });

  if (!enrollment || enrollment.userId !== user.id) {
    redirect("/mi-cuenta?error=enrollment-missing");
  }

  await getDb().courseEnrollment.update({
    where: {
      id: enrollment.id
    },
    data: {
      status: "CANCELLED",
      deactivatedAt: new Date(),
      deactivatedById: user.id
    }
  });

  await writeAuditLog({
    actorId: user.id,
    action: "ENROLLMENT_DEACTIVATED",
    entityType: "COURSE_ENROLLMENT",
    entityId: enrollment.id,
    entityLabel: enrollment.course.title,
    metadata: {
      courseSlug: enrollment.course.slug
    }
  });

  revalidatePath("/mi-cuenta");
  redirect("/mi-cuenta");
}
