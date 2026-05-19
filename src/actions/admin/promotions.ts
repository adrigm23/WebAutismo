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

export async function createPromotionAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "create-promotion",
    actorId: admin.id,
    redirectTo: "/admin/promotions"
  });
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
  await enforceAdminMutationRateLimit({
    action: "toggle-promotion",
    actorId: admin.id,
    redirectTo: "/admin/promotions"
  });
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

export async function updatePromotionAction(formData: FormData) {
  const admin = await requireAdminUser();
  await enforceAdminMutationRateLimit({
    action: "update-promotion",
    actorId: admin.id,
    redirectTo: "/admin/promotions"
  });
  const promotionId = String(formData.get("promotionId") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const amountInCents = Number(formData.get("amountInCents") ?? 0);
  const usageLimitRaw = String(formData.get("usageLimit") ?? "").trim();
  const scope = String(formData.get("scope") ?? "GLOBAL");
  const courseId = String(formData.get("courseId") ?? "").trim();

  if (!promotionId || !code || Number.isNaN(amountInCents) || amountInCents < 0) {
    redirect("/admin/promotions?error=promotion-update");
  }

  const promotion = await getDb().promotion.update({
    where: {
      id: promotionId
    },
    data: {
      code,
      description: description || null,
      discountType:
        String(formData.get("discountType") ?? "") === "FIXED_AMOUNT"
          ? "FIXED_AMOUNT"
          : "PERCENTAGE",
      amountInCents,
      validFrom: parseOptionalDate(formData.get("validFrom")),
      validUntil: parseOptionalDate(formData.get("validUntil")),
      usageLimit: usageLimitRaw ? Number(usageLimitRaw) : null,
      scope: scope === "COURSE" ? "COURSE" : "GLOBAL",
      courseId: scope === "COURSE" && courseId ? courseId : null,
      updatedById: admin.id
    }
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "PROMOTION_UPDATED",
    entityType: "PROMOTION",
    entityId: promotion.id,
    entityLabel: promotion.code
  });

  revalidateAdminViews();
  redirect(`/admin/promotions?promotionId=${promotion.id}`);
}
