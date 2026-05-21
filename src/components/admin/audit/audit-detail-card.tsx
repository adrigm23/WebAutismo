import type { AuditAction, AuditEntityType } from "@prisma/client";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ListRow } from "@/components/ui/list-row";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getAuditActionLabel, getAuditActionTone } from "@/lib/admin-console";
import { formatDateTime } from "@/lib/utils";
import {
  formatMetadataKey,
  formatMetadataValue,
  getEntityTypeLabel
} from "./audit-utils";

export function AuditDetailCard({
  log,
  selectedMetadata
}: {
  log: {
    id: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityLabel: string | null;
    entityId: string;
    createdAt: Date;
    actorName: string;
    actorEmail: string;
  };
  selectedMetadata: Record<string, unknown>;
}) {
  const metadataEntries = Object.entries(selectedMetadata);

  return (
    <SurfaceCard padding="md">
      <SectionHeader
        actions={
          <AdminStatusBadge tone={getAuditActionTone(log.action)}>
            {getAuditActionLabel(log.action)}
          </AdminStatusBadge>
        }
        description={`Evento ${log.id} registrado el ${formatDateTime(log.createdAt)}.`}
        eyebrow={getEntityTypeLabel(log.entityType)}
        size="md"
        title={log.entityLabel ?? log.entityId}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ListRow emphasis="muted" eyebrow="Actor" title={log.actorName} />
        <ListRow emphasis="muted" eyebrow="Correo" title={log.actorEmail} />
        <ListRow emphasis="muted" eyebrow="Entidad" title={getEntityTypeLabel(log.entityType)} />
        <ListRow emphasis="muted" eyebrow="Registro" title={log.entityId} />
      </div>

      {metadataEntries.length > 0 ? (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5">
          <p className="text-meta-xs font-semibold text-[var(--color-muted)]">Resumen tecnico</p>
          <div className="mt-4 space-y-3">
            {metadataEntries.slice(0, 4).map(([key, value]) => (
              <div
                className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-3 last:border-b-0 last:pb-0"
                key={key}
              >
                <span className="text-sm font-medium text-[var(--color-ink-soft)]">
                  {formatMetadataKey(key)}
                </span>
                <span className="max-w-[14rem] text-right text-sm text-[var(--color-muted)]">
                  {formatMetadataValue(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <p className="text-meta-xs font-semibold text-[var(--color-muted)]">Metadata JSON</p>
        <pre className="mt-3 overflow-x-auto rounded-[var(--radius-lg)] bg-[#1f252b] p-5 text-sm leading-7 text-[#eaf0f6]">
          {JSON.stringify(selectedMetadata, null, 2)}
        </pre>
      </div>
    </SurfaceCard>
  );
}
