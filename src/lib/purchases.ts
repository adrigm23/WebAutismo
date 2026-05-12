import { PurchaseStatus } from "@prisma/client";
import type Stripe from "stripe";
import { writeAuditLog } from "@/lib/audit";
import { getCatalogCourseBySlug, getCatalogCourses } from "@/lib/course-catalog";
import { resolveEditionAccessUntil } from "@/lib/course-editions";
import {
  canAccessCourseCommunity,
  ensureCourseMembershipForUser,
  getCourseRoleForUser
} from "@/lib/course-community";
import { sendPlatformNotification } from "@/lib/notifications";
import { getDb } from "@/lib/prisma";
import {
  calculatePurchaseAmounts,
  resolvePromotionForPurchase,
  type PromotionValidationResult
} from "@/lib/promotions";

type PurchasePricingInput = {
  subtotalInCents: number;
  promotionCode?: string | null;
  courseId: string;
};

export type ResolvedPurchasePricing = {
  subtotalInCents: number;
  discountInCents: number;
  taxInCents: number;
  totalInCents: number;
  promotionId: string | null;
  promotionCode: string | null;
  validation: PromotionValidationResult | null;
};

type StoredPurchaseSnapshot = {
  id: string;
  userId: string;
  courseId: string;
  subtotalInCents: number;
  discountInCents: number;
  taxInCents: number;
  totalInCents: number;
  promotionId: string | null;
  promotionCode: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
};

type StripeCheckoutValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

type CreatePendingPurchaseInput = {
  userId: string;
  courseSlug: string;
  courseEditionId?: string | null;
  promotionCode?: string | null;
  stripeCheckoutSessionId?: string | null;
};

type GrantCourseAccessInput = {
  userId: string;
  courseSlug: string;
  courseEditionId?: string | null;
  purchaseId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  promotionCode?: string | null;
};

async function resolveCoursePurchaseTarget(input: {
  courseSlug: string;
  courseEditionId?: string | null;
}) {
  const course = await getCatalogCourseBySlug(input.courseSlug);

  if (!course) {
    throw new Error("El curso solicitado no existe.");
  }

  const edition =
    (input.courseEditionId
      ? course.editions.find((item) => item.id === input.courseEditionId)
      : course.activeEdition) ??
    course.activeEdition ??
    course.editions[0] ??
    null;

  return {
    course,
    edition
  };
}

export async function resolvePurchasePricing(
  input: PurchasePricingInput
): Promise<ResolvedPurchasePricing> {
  const { promotion, validation } = input.promotionCode
    ? await resolvePromotionForPurchase({
        code: input.promotionCode,
        courseId: input.courseId
      })
    : { promotion: null, validation: null };

  if (validation && !validation.ok) {
    return {
      subtotalInCents: input.subtotalInCents,
      discountInCents: 0,
      taxInCents: Math.round(input.subtotalInCents * 0.21),
      totalInCents: input.subtotalInCents + Math.round(input.subtotalInCents * 0.21),
      promotionId: null,
      promotionCode: input.promotionCode?.trim().toUpperCase() ?? null,
      validation
    };
  }

  const amounts = calculatePurchaseAmounts({
    subtotalInCents: input.subtotalInCents,
    promotion: promotion
      ? {
          discountType: promotion.discountType,
          amountInCents: promotion.amountInCents
        }
      : null
  });

  return {
    subtotalInCents: amounts.subtotalInCents,
    discountInCents: amounts.discountInCents,
    taxInCents: amounts.taxInCents,
    totalInCents: amounts.totalInCents,
    promotionId: promotion?.id ?? null,
    promotionCode: promotion?.code ?? input.promotionCode?.trim().toUpperCase() ?? null,
    validation
  };
}

export async function createPendingPurchase(input: CreatePendingPurchaseInput) {
  const { course, edition } = await resolveCoursePurchaseTarget({
    courseSlug: input.courseSlug,
    courseEditionId: input.courseEditionId
  });
  const pricing = await resolvePurchasePricing({
    subtotalInCents: course.priceInCents,
    promotionCode: input.promotionCode,
    courseId: course.id
  });

  if (pricing.validation && !pricing.validation.ok) {
    throw new Error(pricing.validation.reason);
  }

  const purchase = await getDb().purchase.create({
    data: {
      userId: input.userId,
      courseId: course.id,
      courseEditionId: edition?.id ?? null,
      status: PurchaseStatus.PENDING,
      subtotalInCents: pricing.subtotalInCents,
      discountInCents: pricing.discountInCents,
      taxInCents: pricing.taxInCents,
      totalInCents: pricing.totalInCents,
      promotionId: pricing.promotionId,
      promotionCode: pricing.promotionCode,
      stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
      courseSlugSnapshot: course.slug,
      courseTitleSnapshot: course.title
    }
  });

  await writeAuditLog({
    actorId: input.userId,
    action: "PURCHASE_CREATED",
    entityType: "PURCHASE",
    entityId: purchase.id,
    entityLabel: course.title,
    metadata: {
      courseSlug: course.slug,
      courseEditionId: edition?.id ?? null,
      totalInCents: purchase.totalInCents,
      discountInCents: purchase.discountInCents,
      promotionCode: pricing.promotionCode
    }
  });

  return purchase;
}

export function validateStripeCheckoutSessionAgainstPurchase(input: {
  purchase: Pick<
    StoredPurchaseSnapshot,
    "totalInCents" | "stripeCheckoutSessionId" | "userId"
  >;
  session: Pick<
    Stripe.Checkout.Session,
    "amount_total" | "currency" | "id" | "metadata" | "payment_status"
  >;
}): StripeCheckoutValidationResult {
  if (input.session.payment_status !== "paid" && input.session.payment_status !== "no_payment_required") {
    return { ok: false, reason: "Stripe session is not paid." };
  }

  if (input.session.amount_total !== input.purchase.totalInCents) {
    return { ok: false, reason: "Stripe session amount does not match the stored purchase total." };
  }

  if ((input.session.currency ?? "").toLowerCase() !== "eur") {
    return { ok: false, reason: "Stripe session currency is invalid for this purchase." };
  }

  if (
    input.purchase.stripeCheckoutSessionId &&
    input.purchase.stripeCheckoutSessionId !== input.session.id
  ) {
    return { ok: false, reason: "Stripe session id does not match the stored purchase." };
  }

  if (
    input.session.metadata?.userId &&
    input.session.metadata.userId !== input.purchase.userId
  ) {
    return { ok: false, reason: "Stripe session metadata user does not match the stored purchase." };
  }

  return { ok: true };
}

export async function markPurchaseFailedByStripeSessionId(stripeCheckoutSessionId: string) {
  return getDb().purchase.updateMany({
    where: {
      stripeCheckoutSessionId
    },
    data: {
      status: PurchaseStatus.FAILED
    }
  });
}

async function createOrUpdateEnrollment(input: {
  userId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  courseEditionId: string | null;
  purchaseId: string;
}) {
  const edition = input.courseEditionId
    ? await getDb().courseEdition.findUnique({
        where: {
          id: input.courseEditionId
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          accessUntil: true,
          graceAccessDays: true
        }
      })
    : null;

  const accessStartsAt = edition?.startsAt ?? new Date();
  const accessUntil = edition
    ? resolveEditionAccessUntil({
        startsAt: edition.startsAt,
        endsAt: edition.endsAt,
        accessUntil: edition.accessUntil,
        graceAccessDays: edition.graceAccessDays
      })
    : null;

  const existing = await getDb().courseEnrollment.findFirst({
    where: {
      purchaseId: input.purchaseId
    }
  });

  const enrollment = existing
    ? await getDb().courseEnrollment.update({
        where: {
          id: existing.id
        },
        data: {
          status: "ACTIVE",
          accessStartsAt,
          accessUntil,
          deactivatedAt: null,
          deactivatedById: null
        }
      })
    : await getDb().courseEnrollment.create({
        data: {
          userId: input.userId,
          courseId: input.courseId,
          courseEditionId: input.courseEditionId,
          purchaseId: input.purchaseId,
          status: "ACTIVE",
          accessStartsAt,
          accessUntil
        }
      });

  await writeAuditLog({
    actorId: input.userId,
    action: existing ? "ENROLLMENT_REACTIVATED" : "ENROLLMENT_CREATED",
    entityType: "COURSE_ENROLLMENT",
    entityId: enrollment.id,
    entityLabel: input.courseTitle,
    metadata: {
      courseSlug: input.courseSlug,
      courseEditionId: input.courseEditionId,
      accessUntil: accessUntil?.toISOString() ?? null
    }
  });

  return enrollment;
}

export async function grantCourseAccess(input: GrantCourseAccessInput) {
  const { course, edition } = await resolveCoursePurchaseTarget({
    courseSlug: input.courseSlug,
    courseEditionId: input.courseEditionId
  });

  const existingPurchase = input.purchaseId
    ? await getDb().purchase.findUnique({
        where: {
          id: input.purchaseId
        }
      })
    : input.stripeCheckoutSessionId
      ? await getDb().purchase.findUnique({
          where: {
            stripeCheckoutSessionId: input.stripeCheckoutSessionId
          }
        })
      : null;

  if (existingPurchase && existingPurchase.userId !== input.userId) {
    throw new Error("The stored purchase does not belong to the current user.");
  }

  if (existingPurchase && existingPurchase.courseId !== course.id) {
    throw new Error("The stored purchase does not belong to the requested course.");
  }

  const pricing = existingPurchase
    ? null
    : await resolvePurchasePricing({
        subtotalInCents: course.priceInCents,
        promotionCode: input.promotionCode,
        courseId: course.id
      });

  if (pricing?.validation && !pricing.validation.ok) {
    throw new Error(pricing.validation.reason);
  }

  const purchase = existingPurchase
    ? await getDb().purchase.update({
        where: {
          id: existingPurchase.id
        },
        data: {
          status: PurchaseStatus.PAID,
          courseId: course.id,
          courseEditionId: edition?.id ?? null,
          stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? existingPurchase.stripeCheckoutSessionId,
          stripePaymentIntentId: input.stripePaymentIntentId ?? existingPurchase.stripePaymentIntentId,
          courseSlugSnapshot: course.slug,
          courseTitleSnapshot: course.title
        }
      })
    : await getDb().purchase.create({
        data: {
          userId: input.userId,
          courseId: course.id,
          courseEditionId: edition?.id ?? null,
          status: PurchaseStatus.PAID,
          subtotalInCents: pricing!.subtotalInCents,
          discountInCents: pricing!.discountInCents,
          taxInCents: pricing!.taxInCents,
          totalInCents: pricing!.totalInCents,
          promotionId: pricing!.promotionId,
          promotionCode: pricing!.promotionCode,
          stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
          stripePaymentIntentId: input.stripePaymentIntentId ?? null,
          courseSlugSnapshot: course.slug,
          courseTitleSnapshot: course.title
        }
      });

  const enrollment = await createOrUpdateEnrollment({
    userId: input.userId,
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    courseEditionId: edition?.id ?? null,
    purchaseId: purchase.id
  });

  if (purchase.promotionId && purchase.discountInCents > 0) {
    await getDb().promotionRedemption.upsert({
      where: {
        purchaseId: purchase.id
      },
      update: {
        discountInCents: purchase.discountInCents
      },
      create: {
        promotionId: purchase.promotionId,
        purchaseId: purchase.id,
        userId: input.userId,
        courseId: course.id,
        discountInCents: purchase.discountInCents
      }
    });

    await writeAuditLog({
      actorId: input.userId,
      action: "PROMOTION_APPLIED",
      entityType: "PROMOTION",
      entityId: purchase.promotionId,
      entityLabel: purchase.promotionCode,
      metadata: {
        purchaseId: purchase.id,
        courseSlug: course.slug,
        discountInCents: purchase.discountInCents
      }
    });
  }

  await writeAuditLog({
    actorId: input.userId,
    action: "PURCHASE_PAID",
    entityType: "PURCHASE",
    entityId: purchase.id,
    entityLabel: course.title,
    metadata: {
      courseSlug: course.slug,
      courseEditionId: edition?.id ?? null,
      totalInCents: purchase.totalInCents,
      discountInCents: purchase.discountInCents
    }
  });

  await sendPlatformNotification({
    userId: input.userId,
    category: "PURCHASE",
    title: `Compra confirmada: ${course.title}`,
    body:
      purchase.discountInCents > 0
        ? `Tu acceso ya esta activo. Se ha aplicado el codigo ${purchase.promotionCode}.`
        : "Tu acceso ya esta activo y el curso aparece en tu campus.",
    linkPath: `/mis-cursos/${course.slug}`,
    metadata: {
      purchaseId: purchase.id,
      enrollmentId: enrollment.id
    }
  });

  await ensureCourseMembershipForUser({
    userId: input.userId,
    courseSlug: course.slug
  });

  return {
    purchase,
    enrollment,
    course
  };
}

export async function userOwnsCourse(userId: string, courseSlug: string) {
  const role = await getCourseRoleForUser({
    userId,
    courseSlug
  });

  return Boolean(role);
}

export async function userHasCourseAccess(input: {
  userId: string;
  email?: string;
  courseSlug: string;
}) {
  const access = await canAccessCourseCommunity(input);
  return access.allowed;
}

export async function getUserPurchasedCourses(userId: string) {
  const purchases = await getDb().purchase.findMany({
    where: {
      userId,
      status: PurchaseStatus.PAID
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const courseMap = new Map((await getCatalogCourses(true)).map((course) => [course.id, course]));

  return purchases
    .map((purchase) => {
      const course = courseMap.get(purchase.courseId);

      if (!course) {
        return null;
      }

      return {
        course,
        purchase
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function getRecommendedCourses(excludedSlug?: string) {
  const courses = await getCatalogCourses();
  return courses.filter((course) => course.slug !== excludedSlug).slice(0, 2);
}
