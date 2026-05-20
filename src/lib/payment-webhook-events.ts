import { createHash } from "crypto";
import { Prisma, type PaymentWebhookEventStatus } from "@prisma/client";
import { getDb } from "@/lib/prisma";

function buildPayloadHash(payload: string) {
  return createHash("sha256").update(payload).digest("hex");
}

export async function beginPaymentWebhookEventProcessing(input: {
  stripeEventId: string;
  type: string;
  payload: string;
}) {
  const payloadHash = buildPayloadHash(input.payload);

  try {
    const record = await getDb().paymentWebhookEvent.create({
      data: {
        stripeEventId: input.stripeEventId,
        type: input.type,
        payloadHash,
        status: "PROCESSING"
      }
    });

    return {
      duplicate: false,
      payloadHash,
      record
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

    if (existing.status === "FAILED") {
      const resumed = await getDb().paymentWebhookEvent.updateMany({
        where: {
          stripeEventId: input.stripeEventId,
          status: "FAILED"
        },
        data: {
          type: input.type,
          payloadHash,
          status: "PROCESSING",
          processedAt: null
        }
      });

      if (resumed.count === 1) {
        const record = await getDb().paymentWebhookEvent.findUniqueOrThrow({
          where: {
            stripeEventId: input.stripeEventId
          }
        });

        return {
          duplicate: false,
          payloadHash,
          record
        };
      }
    }

    return {
      duplicate: true,
      payloadHash,
      record: existing
    };
  }
}

export async function finishPaymentWebhookEventProcessing(input: {
  stripeEventId: string;
  status: PaymentWebhookEventStatus;
  processedAt?: Date | null;
}) {
  return getDb().paymentWebhookEvent.update({
    where: {
      stripeEventId: input.stripeEventId
    },
    data: {
      status: input.status,
      processedAt: input.processedAt ?? null
    }
  });
}
