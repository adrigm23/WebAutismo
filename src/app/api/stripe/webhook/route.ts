import type Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";
import {
  beginPaymentWebhookEventProcessing,
  finishPaymentWebhookEventProcessing
} from "@/lib/payment-webhook-events";
import {
  grantCourseAccess,
  markPurchaseFailedByStripeSessionId,
  validateStripeCheckoutSessionAgainstPurchase
} from "@/lib/purchases";
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import { getStripe, getStripeRuntimeState } from "@/lib/stripe";

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const webhookLogger = createRequestLogger({
    requestId: getRequestIdFromHeaders(requestHeaders),
    route: "/api/stripe/webhook",
    action: "stripeWebhook"
  });
  const startedAt = Date.now();
  const stripeState = getStripeRuntimeState();
  const stripe = getStripe();
  const secret = stripeState.mode === "live" ? stripeState.webhookSecret : null;

  if (stripeState.mode === "misconfigured") {
    webhookLogger.error("Stripe webhook blocked because the runtime is misconfigured.", {
      result: "misconfigured",
      stripeConfigured: stripeState.hasSecretKey,
      webhookConfigured: stripeState.hasWebhookSecret,
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json(
      {
        error:
          "Stripe webhook is blocked because STRIPE_SECRET_KEY is configured without STRIPE_WEBHOOK_SECRET."
      },
      { status: 503 }
    );
  }

  if (!stripe || !secret) {
    webhookLogger.warn("Stripe webhook called without configuration.", {
      result: "disabled",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 }
    );
  }

  const signature = requestHeaders.get("stripe-signature");

  if (!signature) {
    webhookLogger.warn("Stripe webhook request missing signature.", {
      result: "missing-signature",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    webhookLogger.warn("Stripe webhook signature validation failed.", {
      result: "invalid-signature",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid webhook signature."
      },
      { status: 400 }
    );
  }

  const eventLease = await beginPaymentWebhookEventProcessing({
    stripeEventId: event.id,
    type: event.type,
    payload: body
  });

  if (eventLease.duplicate) {
    if (eventLease.exhausted) {
      webhookLogger.error("Stripe webhook replay blocked because retry attempts are exhausted.", {
        stripeEventId: event.id,
        stripeEventType: event.type,
        webhookStatus: eventLease.record.status,
        attemptCount: eventLease.record.attemptCount,
        result: "attempts-exhausted",
        durationMs: Date.now() - startedAt
      });

      return NextResponse.json({
        received: true,
        duplicate: true,
        exhausted: true
      });
    }

    webhookLogger.info("Stripe webhook replay ignored.", {
      stripeEventId: event.id,
      stripeEventType: event.type,
      webhookStatus: eventLease.record.status,
      attemptCount: eventLease.record.attemptCount,
      result: "duplicate",
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type !== "checkout.session.completed") {
      await finishPaymentWebhookEventProcessing({
        stripeEventId: event.id,
        status: "IGNORED"
      });
      webhookLogger.info("Stripe webhook event ignored.", {
        stripeEventId: event.id,
        stripeEventType: event.type,
        result: "ignored",
        durationMs: Date.now() - startedAt
      });

      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseId = session.metadata?.purchaseId;
    const userId = session.metadata?.userId;
    const courseSlug = session.metadata?.courseSlug;
    const courseEditionId = session.metadata?.courseEditionId || null;

    if (!purchaseId || !userId || !courseSlug) {
      if (session.id) {
        await markPurchaseFailedByStripeSessionId(session.id);
      }

      await finishPaymentWebhookEventProcessing({
        stripeEventId: event.id,
        status: "REJECTED",
        lastError: "Stripe checkout session metadata is incomplete."
      });

      webhookLogger.warn("Stripe webhook rejected because metadata is incomplete.", {
        stripeEventId: event.id,
        stripeEventType: event.type,
        stripeCheckoutSessionId: session.id,
        result: "rejected-metadata",
        durationMs: Date.now() - startedAt
      });

      return NextResponse.json(
        { error: "Stripe checkout session metadata is incomplete." },
        { status: 400 }
      );
    }

    const purchase = await getDb().purchase.findUnique({
      where: {
        id: purchaseId
      },
      select: {
        id: true,
        userId: true,
        totalInCents: true,
        stripeCheckoutSessionId: true
      }
    });

    if (!purchase) {
      await finishPaymentWebhookEventProcessing({
        stripeEventId: event.id,
        status: "REJECTED",
        lastError: "Purchase not found for Stripe session."
      });

      webhookLogger.warn("Stripe webhook rejected because the purchase does not exist.", {
        stripeEventId: event.id,
        stripeEventType: event.type,
        purchaseId,
        result: "rejected-missing-purchase",
        durationMs: Date.now() - startedAt
      });

      return NextResponse.json({ error: "Purchase not found for Stripe session." }, { status: 404 });
    }

    const validation = validateStripeCheckoutSessionAgainstPurchase({
      purchase,
      session
    });

    if (!validation.ok) {
      await markPurchaseFailedByStripeSessionId(session.id);
      await finishPaymentWebhookEventProcessing({
        stripeEventId: event.id,
        status: "REJECTED",
        lastError: validation.reason
      });

      webhookLogger.warn("Stripe webhook rejected because purchase validation failed.", {
        stripeEventId: event.id,
        stripeEventType: event.type,
        purchaseId,
        stripeCheckoutSessionId: session.id,
        result: "rejected-validation",
        durationMs: Date.now() - startedAt
      });

      return NextResponse.json(
        {
          error: validation.reason
        },
        { status: 400 }
      );
    }

    await grantCourseAccess({
      userId,
      courseSlug,
      courseEditionId,
      purchaseId,
      grantSource: "stripe-webhook",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null
    });

    await finishPaymentWebhookEventProcessing({
      stripeEventId: event.id,
      status: "PROCESSED",
      processedAt: new Date(),
      lastError: null
    });

    webhookLogger.info("Stripe webhook processed successfully.", {
      stripeEventId: event.id,
      stripeEventType: event.type,
      purchaseId,
      userId,
      attemptCount: eventLease.record.attemptCount,
      resumedProcessing: eventLease.resumed,
      result: "processed",
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    await finishPaymentWebhookEventProcessing({
      stripeEventId: event.id,
      status: "FAILED",
      lastError: error instanceof Error ? error.message : String(error)
    });

    webhookLogger.error("Stripe webhook processing failed.", {
      stripeEventId: event.id,
      stripeEventType: event.type,
      attemptCount: eventLease.record.attemptCount,
      resumedProcessing: eventLease.resumed,
      result: "failed",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error : new Error(String(error))
    });

    return NextResponse.json({ error: "Stripe webhook processing failed." }, { status: 500 });
  }
}
