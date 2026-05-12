"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
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
    const stripe = getStripe();

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

    await grantCourseAccess({
      userId: user.id,
      courseSlug: course.slug,
      courseEditionId: pendingPurchase.courseEditionId,
      purchaseId: pendingPurchase.id,
      promotionCode: pendingPurchase.promotionCode
    });

    redirect(`/checkout/exito?course=${course.slug}&demo=1`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se ha podido iniciar la compra."
    };
  }
}
