import { type AuditAction, type AuditEntityType } from "@prisma/client";
import { getDb } from "@/lib/prisma";

type WriteAuditLogInput = {
  actorId?: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel?: string | null;
  metadata?: Record<string, unknown> | null;
};

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
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Data truncated for column 'action'") ||
        error.message.includes("Data truncated for column 'entityType'"))
    ) {
      console.error("Audit schema drift detected while writing audit log:", error.message);
      return;
    }

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
