"use server";

import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  captureOperationalInfo,
  captureOperationalWarning,
  captureServerException
} from "@/lib/monitoring";
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import { getPurchaseRuntimeMode } from "@/lib/purchase-runtime";
import { PROMOTION_VALIDATION_REASONS } from "@/lib/promotions";
import { createPendingPurchase, grantCourseAccess, userOwnsCourse } from "@/lib/purchases";
import { getDb } from "@/lib/prisma";
import { buildRequestFingerprint } from "@/lib/request-client";
import { consumeRateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import { getStripe, getStripeRuntimeState } from "@/lib/stripe";

export type PurchaseFormState = {
  error?: string;
};

const purchaseSchema = z.object({
  courseSlug: z.string().min(1),
  courseEditionId: z.string().optional(),
  promotionCode: z.string().optional()
});

// Built from promotions.ts's own reasons instead of hand-copied strings, so
// this can't silently drift out of sync with what that module actually
// throws again (it already had — see the fix that added this comment).
const SAFE_PURCHASE_ERRORS = new Set([
  "El curso solicitado no existe.",
  ...Object.values(PROMOTION_VALIDATION_REASONS)
]);

export async function startPurchaseAction(
  _: PurchaseFormState,
  formData: FormData
): Promise<PurchaseFormState> {
  const requestHeaders = await headers();
  const purchaseLogger = createRequestLogger({
    requestId: getRequestIdFromHeaders(requestHeaders),
    action: "startPurchaseAction",
    route: "/checkout/[slug]"
  });
  const startedAt = Date.now();
  const parsed = purchaseSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    courseEditionId: formData.get("courseEditionId"),
    promotionCode: formData.get("promotionCode")
  });

  if (!parsed.success) {
    return { error: "No hemos podido identificar el curso." };
  }

  const course = await getCatalogCourseBySlug(parsed.data.courseSlug);

  if (!course) {
    return { error: "El curso solicitado no existe." };
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/registro?next=${encodeURIComponent(`/checkout/${course.slug}`)}`);
  }

  const alreadyOwned = await userOwnsCourse(user.id, course.slug);

  if (alreadyOwned) {
    redirect(`/mis-cursos/${course.slug}`);
  }

  const rateLimit = await consumeRateLimit({
    bucket: "purchase-start",
    key: buildRequestFingerprint(requestHeaders, [user.id]),
    limit: 8,
    windowMs: 10 * 60 * 1_000
  });

  if (!rateLimit.allowed) {
    purchaseLogger.warn("Purchase blocked by rate limit.", {
      userId: user.id,
      courseSlug: course.slug,
      result: "rate-limited",
      durationMs: Date.now() - startedAt
    });

    return {
      error: `Demasiados intentos de compra. Espera ${rateLimit.retryAfterSeconds} segundos antes de volver a intentarlo.`
    };
  }

  try {
    const stripeState = getStripeRuntimeState();

    if (stripeState.mode === "misconfigured") {
      captureOperationalWarning("Blocked purchase because Stripe runtime configuration is incomplete.", {
        action: "startPurchaseAction",
        courseSlug: course.slug,
        userId: user.id,
        stripeConfigured: stripeState.hasSecretKey,
        webhookConfigured: stripeState.hasWebhookSecret
      });
      purchaseLogger.error("Purchase blocked because Stripe webhook configuration is incomplete.", {
        userId: user.id,
        courseSlug: course.slug,
        result: "blocked-misconfigured",
        durationMs: Date.now() - startedAt
      });

      return {
        error:
          "La compra esta bloqueada porque Stripe no tiene la configuracion completa de webhook en este entorno."
      };
    }

    const pendingPurchase = await createPendingPurchase({
      userId: user.id,
      courseSlug: course.slug,
      courseEditionId: parsed.data.courseEditionId,
      promotionCode: parsed.data.promotionCode
    });
    const purchaseMode = getPurchaseRuntimeMode();
    const stripe = purchaseMode === "live" ? getStripe() : null;

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        client_reference_id: pendingPurchase.id,
        mode: "payment",
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: pendingPurchase.totalInCents,
              product_data: {
                name: course.title,
                description: course.shortDescription
              }
            },
            quantity: 1
          }
        ],
        metadata: {
          purchaseId: pendingPurchase.id,
          userId: user.id,
          courseSlug: course.slug,
          courseEditionId: pendingPurchase.courseEditionId ?? "",
          promotionCode: pendingPurchase.promotionCode ?? ""
        },
        success_url: absoluteUrl(`/checkout/exito?course=${course.slug}`),
        cancel_url: absoluteUrl(`/checkout/${course.slug}`)
      });

      await getDb().purchase.update({
        where: {
          id: pendingPurchase.id
        },
        data: {
          stripeCheckoutSessionId: session.id
        }
      });

      if (!session.url) {
        return { error: "No se ha podido iniciar el pago en Stripe." };
      }

      purchaseLogger.info("Stripe checkout session created.", {
        userId: user.id,
        courseSlug: course.slug,
        purchaseId: pendingPurchase.id,
        result: "redirect-stripe",
        durationMs: Date.now() - startedAt
      });

      redirect(session.url);
    }

    if (purchaseMode === "disabled") {
      captureOperationalWarning("Blocked purchase because Stripe is not configured for this environment.", {
        action: "startPurchaseAction",
        courseSlug: course.slug,
        userId: user.id,
        purchaseId: pendingPurchase.id
      });
      purchaseLogger.warn("Purchase blocked because Stripe is unavailable.", {
        userId: user.id,
        courseSlug: course.slug,
        purchaseId: pendingPurchase.id,
        result: "blocked",
        durationMs: Date.now() - startedAt
      });

      return {
        error:
          "La compra no esta disponible en este entorno porque la pasarela de pago no esta configurada."
      };
    }

    captureOperationalInfo("Using development demo purchase flow without Stripe.", {
      action: "startPurchaseAction",
      courseSlug: course.slug,
      userId: user.id,
      purchaseId: pendingPurchase.id
    });

    await grantCourseAccess({
      userId: user.id,
      courseSlug: course.slug,
      courseEditionId: pendingPurchase.courseEditionId,
      purchaseId: pendingPurchase.id,
      grantSource: "development-demo"
    });

    purchaseLogger.info("Development demo purchase granted.", {
      userId: user.id,
      courseSlug: course.slug,
      purchaseId: pendingPurchase.id,
      result: "granted-demo",
      durationMs: Date.now() - startedAt
    });

    redirect(`/checkout/exito?course=${course.slug}&demo=1`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    captureServerException(error, {
      action: "startPurchaseAction",
      courseSlug: course.slug,
      userId: user.id
    });
    purchaseLogger.error("Failed to start purchase flow.", {
      userId: user.id,
      courseSlug: course.slug,
      result: "error",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error : new Error(String(error))
    });

    return {
      error:
        error instanceof Error && SAFE_PURCHASE_ERRORS.has(error.message)
          ? error.message
          : "No se ha podido iniciar la compra. Intentalo de nuevo en unos minutos."
    };
  }
}
