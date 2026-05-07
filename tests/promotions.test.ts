import assert from "node:assert/strict";
import {
  calculatePurchaseAmounts,
  calculatePromotionDiscount,
  validatePromotionForCourse
} from "../src/lib/promotions.ts";

export function runPromotionTests() {
  assert.equal(
    calculatePromotionDiscount({
      subtotalInCents: 10000,
      discountType: "PERCENTAGE",
      amountInCents: 25
    }),
    2500
  );

  assert.equal(
    calculatePromotionDiscount({
      subtotalInCents: 5000,
      discountType: "FIXED_AMOUNT",
      amountInCents: 9000
    }),
    5000
  );

  const amounts = calculatePurchaseAmounts({
    subtotalInCents: 10000,
    promotion: {
      discountType: "PERCENTAGE",
      amountInCents: 10
    }
  });

  assert.deepEqual(amounts, {
    subtotalInCents: 10000,
    discountInCents: 1000,
    taxableBaseInCents: 9000,
    taxInCents: 1890,
    totalInCents: 10890
  });

  const validPromotion = validatePromotionForCourse({
    promotion: {
      id: "promo-1",
      code: "PRIMAVERA",
      isActive: true,
      discountType: "PERCENTAGE",
      amountInCents: 15,
      validFrom: new Date("2026-05-01T00:00:00.000Z"),
      validUntil: new Date("2026-05-31T23:59:59.000Z"),
      usageLimit: 3,
      scope: "COURSE",
      courseId: "course-1"
    },
    courseId: "course-1",
    usageCount: 1,
    now: new Date("2026-05-06T12:00:00.000Z")
  });

  assert.equal(validPromotion.ok, true);

  const exhaustedPromotion = validatePromotionForCourse({
    promotion: {
      id: "promo-2",
      code: "SINMAS",
      isActive: true,
      discountType: "FIXED_AMOUNT",
      amountInCents: 500,
      validFrom: null,
      validUntil: null,
      usageLimit: 1,
      scope: "GLOBAL",
      courseId: null
    },
    courseId: "course-1",
    usageCount: 1
  });

  assert.deepEqual(exhaustedPromotion, {
    ok: false,
    reason: "El codigo promocional ya ha alcanzado su limite de usos."
  });
}
