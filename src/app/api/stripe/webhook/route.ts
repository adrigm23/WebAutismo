import type Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";
import { grantCourseAccess } from "@/lib/purchases";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 }
    );
  }

  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid webhook signature."
      },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseId = session.metadata?.purchaseId;
    const userId = session.metadata?.userId;
    const courseSlug = session.metadata?.courseSlug;
    const courseEditionId = session.metadata?.courseEditionId || null;
    const promotionCode = session.metadata?.promotionCode || null;

    if (purchaseId && userId && courseSlug) {
      await grantCourseAccess({
        userId,
        courseSlug,
        courseEditionId,
        purchaseId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        promotionCode
      });
    } else if (session.id) {
      await getDb().purchase.updateMany({
        where: {
          stripeCheckoutSessionId: session.id
        },
        data: {
          status: "FAILED"
        }
      });
    }
  }

  return NextResponse.json({ received: true });
}
