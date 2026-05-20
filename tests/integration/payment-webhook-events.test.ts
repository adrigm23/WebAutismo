import { getDb } from "@/lib/prisma";

describe("payment webhook events", () => {
  test("recovers a stale processing event lease", async () => {
    const stripeEventId = `evt_stale_${Date.now()}`;
    const staleDate = new Date(Date.now() - 10 * 60 * 1_000);

    await getDb().paymentWebhookEvent.create({
      data: {
        stripeEventId,
        type: "checkout.session.completed",
        payloadHash: "stale-hash",
        status: "PROCESSING",
        attemptCount: 1,
        processingStartedAt: staleDate,
        lastAttemptAt: staleDate
      }
    });

    const { beginPaymentWebhookEventProcessing } = await import(
      "@/lib/payment-webhook-events"
    );

    const lease = await beginPaymentWebhookEventProcessing({
      stripeEventId,
      type: "checkout.session.completed",
      payload: JSON.stringify({
        id: stripeEventId
      })
    });

    expect(lease.duplicate).toBe(false);
    expect(lease.exhausted).toBe(false);
    expect(lease.resumed).toBe(true);
    expect(lease.record.status).toBe("PROCESSING");
    expect(lease.record.attemptCount).toBe(2);

    await getDb().paymentWebhookEvent.delete({
      where: {
        stripeEventId
      }
    });
  }, 15_000);

  test("marks a stale processing event as failed after max attempts", async () => {
    const stripeEventId = `evt_exhausted_${Date.now()}`;
    const staleDate = new Date(Date.now() - 10 * 60 * 1_000);

    await getDb().paymentWebhookEvent.create({
      data: {
        stripeEventId,
        type: "checkout.session.completed",
        payloadHash: "failed-hash",
        status: "PROCESSING",
        attemptCount: 5,
        processingStartedAt: staleDate,
        lastAttemptAt: staleDate
      }
    });

    const { beginPaymentWebhookEventProcessing } = await import(
      "@/lib/payment-webhook-events"
    );

    const lease = await beginPaymentWebhookEventProcessing({
      stripeEventId,
      type: "checkout.session.completed",
      payload: JSON.stringify({
        id: stripeEventId
      })
    });

    expect(lease.duplicate).toBe(true);
    expect(lease.exhausted).toBe(true);
    expect(lease.record.status).toBe("FAILED");
    expect(lease.record.attemptCount).toBe(5);

    await getDb().paymentWebhookEvent.delete({
      where: {
        stripeEventId
      }
    });
  }, 15_000);
});
