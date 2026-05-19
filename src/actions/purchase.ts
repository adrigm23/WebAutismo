"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  captureOperationalInfo,
  captureOperationalWarning,
  captureServerException
} from "@/lib/monitoring";
import { getPurchaseRuntimeMode } from "@/lib/purchase-runtime";
import { createPendingPurchase, grantCourseAccess, userOwnsCourse } from "@/lib/purchases";
import { getDb } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export type PurchaseFormState = {
  error?: string;
};

const purchaseSchema = z.object({
  courseSlug: z.string().min(1),
  courseEditionId: z.string().optional(),
  promotionCode: z.string().optional()
});

const SAFE_PURCHASE_ERRORS = new Set([
  "El curso solicitado no existe.",
  "El codigo promocional ya ha alcanzado su limite de usos.",
  "El codigo promocional no es valido para este curso.",
  "El codigo promocional todavia no esta activo.",
  "El codigo promocional ya ha caducado.",
  "El codigo promocional no esta activo."
]);

export async function startPurchaseAction(
  _: PurchaseFormState,
  formData: FormData
): Promise<PurchaseFormState> {
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

  try {
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

      redirect(session.url);
    }

    if (purchaseMode === "disabled") {
      captureOperationalWarning("Blocked purchase because Stripe is not configured for this environment.", {
        action: "startPurchaseAction",
        courseSlug: course.slug,
        userId: user.id,
        purchaseId: pendingPurchase.id
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
      promotionCode: pendingPurchase.promotionCode
    });

    redirect(`/checkout/exito?course=${course.slug}&demo=1`);
  } catch (error) {
    captureServerException(error, {
      action: "startPurchaseAction",
      courseSlug: course.slug,
      userId: user.id
    });

    return {
      error:
        error instanceof Error && SAFE_PURCHASE_ERRORS.has(error.message)
          ? error.message
          : "No se ha podido iniciar la compra. Intentalo de nuevo en unos minutos."
    };
  }
}
