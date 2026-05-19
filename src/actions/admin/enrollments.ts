"use server";

import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/prisma";
import {
  enforceAdminMutationRateLimit,
  parseOptionalDate,
  requireAdminUser,
  revalidateAdminViews
} from "./shared";

export async function updateEnrollmentAccessAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "update-enrollment-access",
    actorId: admin.id,
    redirectTo: "/admin/supervision"
  });
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const status = String(formData.get("status") ?? "ACTIVE");
  const notes = String(formData.get("notes") ?? "").trim();

  if (
    !enrollmentId ||
    !["ACTIVE", "CANCELLED", "REVOKED", "EXPIRED"].includes(status)
  ) {
    redirect("/admin/supervision?error=enrollment-update");
  }

  const nextStatus = status as "ACTIVE" | "CANCELLED" | "REVOKED" | "EXPIRED";
  const enrollment = await getDb().courseEnrollment.update({
    where: {
      id: enrollmentId
    },
    data: {
      status: nextStatus,
      accessUntil: parseOptionalDate(formData.get("accessUntil")),
      notes: notes || null,
      deactivatedAt: nextStatus === "ACTIVE" ? null : new Date(),
      deactivatedById: nextStatus === "ACTIVE" ? null : admin.id
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: nextStatus === "ACTIVE" ? "ENROLLMENT_REACTIVATED" : "ENROLLMENT_DEACTIVATED",
    entityType: "COURSE_ENROLLMENT",
    entityId: enrollment.id,
    metadata: {
      nextStatus,
      accessUntil: enrollment.accessUntil?.toISOString() ?? null
    }
  });

  revalidateAdminViews();
  redirect(`/admin/supervision?enrollmentId=${enrollment.id}`);
}
