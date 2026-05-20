import { createHash } from "crypto";
import {
  Prisma,
  type PaymentWebhookEvent,
  type PaymentWebhookEventStatus
} from "@prisma/client";
import { getDb } from "@/lib/prisma";

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1_000;
const MAX_PROCESSING_ATTEMPTS = 5;

function buildPayloadHash(payload: string) {
  return createHash("sha256").update(payload).digest("hex");
}

function isProcessingLeaseExpired(record: {
  processingStartedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
}) {
  const leaseStartedAt =
    record.processingStartedAt?.getTime() ?? record.updatedAt.getTime() ?? record.createdAt.getTime();

  return Date.now() - leaseStartedAt >= PROCESSING_TIMEOUT_MS;
}

export type PaymentWebhookProcessingLease =
  | {
      duplicate: false;
      exhausted: false;
      payloadHash: string;
      record: PaymentWebhookEvent;
      resumed: boolean;
    }
  | {
      duplicate: true;
      exhausted: false;
      payloadHash: string;
      record: PaymentWebhookEvent;
      resumed: false;
    }
  | {
      duplicate: true;
      exhausted: true;
      payloadHash: string;
      record: PaymentWebhookEvent;
      resumed: false;
    };

async function claimExistingPaymentWebhookEvent(input: {
  stripeEventId: string;
  type: string;
  payloadHash: string;
  record: PaymentWebhookEvent;
}) {
  const exhaustedAttempts = input.record.attemptCount >= MAX_PROCESSING_ATTEMPTS;
  const staleProcessing =
    input.record.status === "PROCESSING" && isProcessingLeaseExpired(input.record);
  const canResumeFailed = input.record.status === "FAILED" && !exhaustedAttempts;
  const canResumeStale = staleProcessing && !exhaustedAttempts;

  if (!canResumeFailed && !canResumeStale) {
    if (staleProcessing && exhaustedAttempts) {
      await getDb().paymentWebhookEvent.updateMany({
        where: {
          stripeEventId: input.stripeEventId,
          status: "PROCESSING",
          attemptCount: input.record.attemptCount
        },
        data: {
          status: "FAILED",
          lastError: `Processing lease expired after ${input.record.attemptCount} attempts.`,
          lastAttemptAt: new Date()
        }
      });

      const failedRecord = await getDb().paymentWebhookEvent.findUniqueOrThrow({
        where: {
          stripeEventId: input.stripeEventId
        }
      });

      return {
        duplicate: true,
        exhausted: true,
        payloadHash: input.payloadHash,
        record: failedRecord,
        resumed: false
      } satisfies PaymentWebhookProcessingLease;
    }

    return {
      duplicate: true,
      exhausted: false,
      payloadHash: input.payloadHash,
      record: input.record,
      resumed: false
    } satisfies PaymentWebhookProcessingLease;
  }

  const now = new Date();
  const resumed = await getDb().paymentWebhookEvent.updateMany({
    where: {
      stripeEventId: input.stripeEventId,
      status: input.record.status,
      attemptCount: input.record.attemptCount
    },
    data: {
      type: input.type,
      payloadHash: input.payloadHash,
      status: "PROCESSING",
      processedAt: null,
      processingStartedAt: now,
      lastAttemptAt: now,
      attemptCount: {
        increment: 1
      },
      lastError:
        input.record.status === "FAILED"
          ? null
          : `Recovered stale processing lease after ${input.record.attemptCount} attempts.`
    }
  });

  if (resumed.count !== 1) {
    const latestRecord = await getDb().paymentWebhookEvent.findUniqueOrThrow({
      where: {
        stripeEventId: input.stripeEventId
      }
    });

    return {
      duplicate: true,
      exhausted: false,
      payloadHash: input.payloadHash,
      record: latestRecord,
      resumed: false
    } satisfies PaymentWebhookProcessingLease;
  }

  const record = await getDb().paymentWebhookEvent.findUniqueOrThrow({
    where: {
      stripeEventId: input.stripeEventId
    }
  });

  return {
    duplicate: false,
    exhausted: false,
    payloadHash: input.payloadHash,
    record,
    resumed: true
  } satisfies PaymentWebhookProcessingLease;
}

export async function beginPaymentWebhookEventProcessing(input: {
  stripeEventId: string;
  type: string;
  payload: string;
}) {
  const payloadHash = buildPayloadHash(input.payload);
  const now = new Date();

  try {
    const record = await getDb().paymentWebhookEvent.create({
      data: {
        stripeEventId: input.stripeEventId,
        type: input.type,
        payloadHash,
        status: "PROCESSING",
        attemptCount: 1,
        processingStartedAt: now,
        lastAttemptAt: now
      }
    });

    return {
      duplicate: false,
      exhausted: false,
      payloadHash,
      record,
      resumed: false
    };
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }

    const existing = await getDb().paymentWebhookEvent.findUniqueOrThrow({
      where: {
        stripeEventId: input.stripeEventId
      }
    });

    return claimExistingPaymentWebhookEvent({
      stripeEventId: input.stripeEventId,
      type: input.type,
      payloadHash,
      record: existing
    });
  }
}

export async function finishPaymentWebhookEventProcessing(input: {
  stripeEventId: string;
  status: PaymentWebhookEventStatus;
  processedAt?: Date | null;
  lastError?: string | null;
}) {
  return getDb().paymentWebhookEvent.update({
    where: {
      stripeEventId: input.stripeEventId
    },
    data: {
      status: input.status,
      processedAt: input.processedAt ?? null,
      lastAttemptAt: new Date(),
      lastError: input.lastError ?? null
    }
  });
}

export function getPaymentWebhookProcessingPolicy() {
  return {
    timeoutMs: PROCESSING_TIMEOUT_MS,
    maxAttempts: MAX_PROCESSING_ATTEMPTS
  };
}
