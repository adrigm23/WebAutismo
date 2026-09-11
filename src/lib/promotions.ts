import {
  type PromotionDiscountType,
  type PromotionScope,
  type PurchaseStatus,
} from "@prisma/client";
import { getDb } from "./prisma.ts";

export const TAX_RATE = 0.21;

export type PromotionLike = {
  id: string;
  code: string;
  isActive: boolean;
  discountType: PromotionDiscountType;
  amountInCents: number;
  validFrom: Date | null;
  validUntil: Date | null;
  usageLimit: number | null;
  scope: PromotionScope;
  courseId: string | null;
};

export type PromotionValidationResult =
  | {
      ok: true;
      promotion: PromotionLike;
    }
  | {
      ok: false;
      reason: string;
    };

export type PurchaseAmounts = {
  subtotalInCents: number;
  discountInCents: number;
  taxableBaseInCents: number;
  taxInCents: number;
  totalInCents: number;
};

export function normalizePromotionCode(code: string) {
  return code.trim().toUpperCase();
}

/**
 * Single source of truth for every promotion-validation failure message.
 * `purchase.ts` builds its user-facing safe-error allowlist directly from
 * this object instead of hand-copying the strings — they drifted apart once
 * already (different wording/accents), which meant most rejection reasons
 * silently fell back to a generic error instead of the real one.
 */
export const PROMOTION_VALIDATION_REASONS = {
  NOT_FOUND: "El código promocional no existe.",
  NOT_ACTIVE: "El código promocional no está activo.",
  NOT_YET_VALID: "El código promocional todavía no está disponible.",
  EXPIRED: "El código promocional ha caducado.",
  WRONG_COURSE: "El código promocional no aplica a este curso.",
  USAGE_LIMIT_REACHED: "El código promocional ya ha alcanzado su límite de usos."
} as const;

export function calculatePromotionDiscount(input: {
  subtotalInCents: number;
  discountType: PromotionDiscountType;
  amountInCents: number;
}) {
  if (input.subtotalInCents <= 0) {
    return 0;
  }

  if (input.discountType === "PERCENTAGE") {
    const boundedPercentage = Math.max(0, Math.min(input.amountInCents, 100));
    return Math.min(
      input.subtotalInCents,
      Math.round((input.subtotalInCents * boundedPercentage) / 100),
    );
  }

  return Math.min(input.subtotalInCents, Math.max(input.amountInCents, 0));
}

export function calculatePurchaseAmounts(input: {
  subtotalInCents: number;
  promotion?: Pick<PromotionLike, "discountType" | "amountInCents"> | null;
}) {
  const subtotalInCents = Math.max(input.subtotalInCents, 0);
  const discountInCents = input.promotion
    ? calculatePromotionDiscount({
        subtotalInCents,
        discountType: input.promotion.discountType,
        amountInCents: input.promotion.amountInCents,
      })
    : 0;
  const taxableBaseInCents = Math.max(subtotalInCents - discountInCents, 0);
  const taxInCents = Math.round(taxableBaseInCents * TAX_RATE);

  return {
    subtotalInCents,
    discountInCents,
    taxableBaseInCents,
    taxInCents,
    totalInCents: taxableBaseInCents + taxInCents,
  } satisfies PurchaseAmounts;
}

export function validatePromotionForCourse(input: {
  promotion: PromotionLike;
  courseId: string;
  usageCount: number;
  now?: Date;
}): PromotionValidationResult {
  const now = input.now ?? new Date();

  if (!input.promotion.isActive) {
    return { ok: false, reason: PROMOTION_VALIDATION_REASONS.NOT_ACTIVE };
  }

  if (
    input.promotion.validFrom &&
    input.promotion.validFrom.getTime() > now.getTime()
  ) {
    return {
      ok: false,
      reason: PROMOTION_VALIDATION_REASONS.NOT_YET_VALID,
    };
  }

  if (
    input.promotion.validUntil &&
    input.promotion.validUntil.getTime() < now.getTime()
  ) {
    return { ok: false, reason: PROMOTION_VALIDATION_REASONS.EXPIRED };
  }

  if (
    input.promotion.scope === "COURSE" &&
    input.promotion.courseId &&
    input.promotion.courseId !== input.courseId
  ) {
    return {
      ok: false,
      reason: PROMOTION_VALIDATION_REASONS.WRONG_COURSE,
    };
  }

  if (
    input.promotion.usageLimit !== null &&
    input.promotion.usageLimit !== undefined &&
    input.usageCount >= input.promotion.usageLimit
  ) {
    return {
      ok: false,
      reason: PROMOTION_VALIDATION_REASONS.USAGE_LIMIT_REACHED,
    };
  }

  return {
    ok: true,
    promotion: input.promotion,
  };
}

export async function getPromotionByCode(code: string) {
  const normalizedCode = normalizePromotionCode(code);

  if (!normalizedCode) {
    return null;
  }

  return getDb().promotion.findUnique({
    where: {
      code: normalizedCode,
    },
  });
}

export async function resolvePromotionForPurchase(input: {
  code: string;
  courseId: string;
}) {
  const normalizedCode = normalizePromotionCode(input.code);

  if (!normalizedCode) {
    return { promotion: null, validation: null };
  }

  const promotion = await getDb().promotion.findUnique({
    where: {
      code: normalizedCode,
    },
    include: {
      _count: {
        select: {
          redemptions: true,
        },
      },
    },
  });

  if (!promotion) {
    return {
      promotion: null,
      validation: {
        ok: false as const,
        reason: PROMOTION_VALIDATION_REASONS.NOT_FOUND,
      },
    };
  }

  const validation = validatePromotionForCourse({
    promotion,
    courseId: input.courseId,
    usageCount: promotion._count.redemptions,
  });

  return {
    promotion,
    validation,
  };
}

export async function getSuccessfulPurchasesCountForPromotion(
  promotionId: string,
) {
  return getDb().promotionRedemption.count({
    where: {
      promotionId,
      purchase: {
        status: {
          in: ["PAID", "PENDING"] satisfies PurchaseStatus[],
        },
      },
    },
  });
}
