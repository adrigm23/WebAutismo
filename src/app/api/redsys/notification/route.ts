import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { captureOperationalWarning } from "@/lib/monitoring";
import { getDb } from "@/lib/prisma";
import {
  beginPaymentWebhookEventProcessing,
  finishPaymentWebhookEventProcessing
} from "@/lib/payment-webhook-events";
import {
  grantCourseAccess,
  markPurchaseFailedByRedsysOrder,
  validateRedsysNotificationAgainstPurchase
} from "@/lib/purchases";
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import {
  getRedsysRuntimeState,
  isRedsysResponseAuthorized,
  parseRedsysNotification
} from "@/lib/redsys";

// Redsys online notification: a server-to-server POST
// (application/x-www-form-urlencoded) sent once the buyer finishes on the
// Redsys payment page. It is the only signal that grants course access; the
// URLOK redirect the buyer follows is never trusted.
export async function POST(request: Request) {
  const requestHeaders = await headers();
  const notificationLogger = createRequestLogger({
    requestId: getRequestIdFromHeaders(requestHeaders),
    route: "/api/redsys/notification",
    action: "redsysNotification"
  });
  const startedAt = Date.now();
  const redsysState = getRedsysRuntimeState();

  if (redsysState.mode !== "live") {
    notificationLogger.warn("Redsys notification received without a valid configuration.", {
      result: redsysState.mode,
      redsysReason: redsysState.reason,
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Redsys is not configured." }, { status: 503 });
  }

  const body = await request.text();
  const form = new URLSearchParams(body);
  // Base64 never contains spaces: a space can only be a "+" that arrived
  // without URL-encoding and was decoded by URLSearchParams.
  const readBase64Field = (name: string) => (form.get(name) ?? "").replace(/ /g, "+");
  const parsed = parseRedsysNotification({
    secretKey: redsysState.secretKey,
    signatureVersion: form.get("Ds_SignatureVersion") ?? "",
    merchantParameters: readBase64Field("Ds_MerchantParameters"),
    signature: readBase64Field("Ds_Signature")
  });

  if (!parsed.ok) {
    notificationLogger.warn("Redsys notification rejected before processing.", {
      result: parsed.reason,
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Invalid Redsys notification." }, { status: 400 });
  }

  const { notification } = parsed;
  const authorized = isRedsysResponseAuthorized(notification.responseCode);
  // payment_webhook_events is shared with Stripe; Redsys events are namespaced
  // so they can never collide with a Stripe event id. A buyer can retry a
  // denied card on the same Redsys order, so the response code is part of the key.
  const eventId = `redsys:${notification.order}:${notification.responseCode}`;
  const eventType = authorized ? "redsys.payment.authorized" : "redsys.payment.denied";
  const logContext = {
    redsysOrder: notification.order,
    redsysResponse: notification.responseCode,
    redsysEventType: eventType
  };

  const eventLease = await beginPaymentWebhookEventProcessing({
    stripeEventId: eventId,
    type: eventType,
    payload: body
  });

  if (eventLease.duplicate) {
    notificationLogger.info("Redsys notification replay ignored.", {
      ...logContext,
      webhookStatus: eventLease.record.status,
      attemptCount: eventLease.record.attemptCount,
      result: eventLease.exhausted ? "attempts-exhausted" : "duplicate",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const purchase = await getDb().purchase.findUnique({
      where: {
        redsysOrder: notification.order
      },
      select: {
        id: true,
        userId: true,
        totalInCents: true,
        redsysOrder: true,
        courseEditionId: true,
        courseSlugSnapshot: true
      }
    });

    if (!purchase || (notification.merchantData && notification.merchantData !== purchase.id)) {
      await finishPaymentWebhookEventProcessing({
        stripeEventId: eventId,
        status: "REJECTED",
        lastError: "Purchase not found for Redsys order."
      });
      notificationLogger.warn("Redsys notification rejected because the purchase does not exist.", {
        ...logContext,
        result: "rejected-missing-purchase",
        durationMs: Date.now() - startedAt
      });
      return NextResponse.json({ error: "Purchase not found for Redsys order." }, { status: 404 });
    }

    if (!authorized) {
      await markPurchaseFailedByRedsysOrder(notification.order);
      await finishPaymentWebhookEventProcessing({
        stripeEventId: eventId,
        status: "PROCESSED",
        processedAt: new Date(),
        lastError: `Payment denied by Redsys (Ds_Response ${notification.responseCode}).`
      });
      notificationLogger.info("Redsys payment denied; purchase marked as failed.", {
        ...logContext,
        purchaseId: purchase.id,
        result: "denied",
        durationMs: Date.now() - startedAt
      });
      return NextResponse.json({ received: true });
    }

    const validation = validateRedsysNotificationAgainstPurchase({
      purchase,
      notification,
      config: redsysState
    });

    if (!validation.ok) {
      await markPurchaseFailedByRedsysOrder(notification.order);
      await finishPaymentWebhookEventProcessing({
        stripeEventId: eventId,
        status: "REJECTED",
        lastError: validation.reason
      });
      // An authorised charge that does not match the stored purchase needs a
      // human: the money was taken but no access is granted.
      captureOperationalWarning("Authorised Redsys payment did not match the stored purchase.", {
        action: "redsysNotification",
        purchaseId: purchase.id,
        redsysOrder: notification.order,
        reason: validation.reason
      });
      notificationLogger.warn("Redsys notification rejected because purchase validation failed.", {
        ...logContext,
        purchaseId: purchase.id,
        reason: validation.reason,
        result: "rejected-validation",
        durationMs: Date.now() - startedAt
      });
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    await grantCourseAccess({
      userId: purchase.userId,
      courseSlug: purchase.courseSlugSnapshot,
      courseEditionId: purchase.courseEditionId,
      purchaseId: purchase.id,
      grantSource: "redsys-notification",
      redsysOrder: notification.order,
      redsysAuthorisationCode: notification.authorisationCode
    });

    await finishPaymentWebhookEventProcessing({
      stripeEventId: eventId,
      status: "PROCESSED",
      processedAt: new Date(),
      lastError: null
    });

    notificationLogger.info("Redsys notification processed successfully.", {
      ...logContext,
      purchaseId: purchase.id,
      userId: purchase.userId,
      attemptCount: eventLease.record.attemptCount,
      resumedProcessing: eventLease.resumed,
      result: "processed",
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    await finishPaymentWebhookEventProcessing({
      stripeEventId: eventId,
      status: "FAILED",
      lastError: error instanceof Error ? error.message : String(error)
    });

    // Unlike Stripe, Redsys does not keep retrying a failed notification, so
    // an authorised payment that fails here needs a human to grant access.
    captureOperationalWarning("Redsys notification processing failed; the payment may need manual reconciliation.", {
      action: "redsysNotification",
      redsysOrder: notification.order,
      redsysResponse: notification.responseCode,
      authorized,
      error: error instanceof Error ? error.message : String(error)
    });

    notificationLogger.error("Redsys notification processing failed.", {
      ...logContext,
      attemptCount: eventLease.record.attemptCount,
      resumedProcessing: eventLease.resumed,
      result: "failed",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error : new Error(String(error))
    });

    return NextResponse.json({ error: "Redsys notification processing failed." }, { status: 500 });
  }
}
