"use server";

import { headers } from "next/headers";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  calculatePurchaseAmounts,
  resolvePromotionForPurchase,
} from "@/lib/promotions";
import { buildRequestFingerprint } from "@/lib/request-client";
import { consumeRateLimit } from "@/lib/rate-limit";

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

  // Not keyed on the code itself — that would let an attacker just rotate
  // codes to dodge the limit. This throttles how many distinct codes a given
  // client can probe against a course, closing off brute-force enumeration
  // of valid promotion codes via this read-only preview.
  const requestHeaders = await headers();
  const rateLimit = await consumeRateLimit({
    bucket: "promotion-preview",
    key: buildRequestFingerprint(requestHeaders, [courseSlug]),
    limit: 10,
    windowMs: 5 * 60 * 1_000,
  });

  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: `Demasiados intentos. Espera ${rateLimit.retryAfterSeconds} segundos antes de volver a probar un código.`,
    };
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
