"use server";

import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  calculatePurchaseAmounts,
  resolvePromotionForPurchase,
} from "@/lib/promotions";

export type PromoPreviewResult =
  | { ok: true; discountInCents: number; totalInCents: number; code: string }
  | { ok: false; error: string };

export async function previewPromotionAction(
  courseSlug: string,
  promotionCode: string,
): Promise<PromoPreviewResult> {
  const code = promotionCode.trim().toUpperCase();

  if (!code) {
    return { ok: false, error: "Introduce un código de descuento." };
  }

  const course = await getCatalogCourseBySlug(courseSlug);
  if (!course) {
    return { ok: false, error: "Curso no encontrado." };
  }

  const { promotion, validation } = await resolvePromotionForPurchase({
    code,
    courseId: course.id,
  });

  if (!validation || !validation.ok) {
    return { ok: false, error: validation?.reason ?? "Código no válido." };
  }

  const amounts = calculatePurchaseAmounts({
    subtotalInCents: course.priceInCents,
    promotion: promotion ?? null,
  });

  return {
    ok: true,
    discountInCents: amounts.discountInCents,
    totalInCents: amounts.totalInCents,
    code,
  };
}
