import { type AuditAction, type AuditEntityType } from "@prisma/client";
import { createLogger } from "@/lib/logger";
import { captureOperationalWarning } from "@/lib/monitoring";
import { getDb } from "@/lib/prisma";

type WriteAuditLogInput = {
  actorId?: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel?: string | null;
  metadata?: Record<string, unknown> | null;
};

const auditLogger = createLogger({
  route: "audit",
  action: "writeAuditLog"
});

export async function writeAuditLog(input: WriteAuditLogInput) {
  try {
    await getDb().auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        entityLabel: input.entityLabel ?? null,
        metadataJson: input.metadata ? JSON.stringify(input.metadata) : null
      }
    });
    auditLogger.info("Audit log written.", {
      userId: input.actorId ?? null,
      result: "written",
      auditAction: input.action,
      entityType: input.entityType,
      entityId: input.entityId
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Data truncated for column 'action'") ||
        error.message.includes("Data truncated for column 'entityType'"))
    ) {
      captureOperationalWarning("Audit schema drift detected while writing audit log.", {
        error: error.message
      });
      auditLogger.warn("Audit log skipped because of schema drift.", {
        userId: input.actorId ?? null,
        result: "schema-drift",
        auditAction: input.action,
        entityType: input.entityType,
        entityId: input.entityId
      });
      return;
    }

    auditLogger.error("Audit log write failed.", {
      userId: input.actorId ?? null,
      result: "failed",
      auditAction: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      error: error instanceof Error ? error : new Error(String(error))
    });
    throw error;
  }
}

export function parseAuditMetadata(metadataJson: string | null) {
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
