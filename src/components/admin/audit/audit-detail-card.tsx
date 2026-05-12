import type { AuditAction, AuditEntityType } from "@prisma/client";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import {
  getAuditActionLabel,
  getAuditActionTone
} from "@/lib/admin-console";
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
    <Card className="rounded-[2rem] p-7">
      <div className="flex items-center justify-between gap-4">
        <AdminStatusBadge tone={getAuditActionTone(log.action)}>
          {getAuditActionLabel(log.action)}
        </AdminStatusBadge>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#607185]">
          {getEntityTypeLabel(log.entityType)}
        </p>
      </div>

      <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
        {log.entityLabel ?? log.entityId}
      </h2>
      <p className="mt-2 text-sm leading-7 text-[#596b7f]">
        Evento {log.id} registrado el {formatDateTime(log.createdAt)}.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <DetailField label="Actor" value={log.actorName} />
        <DetailField label="Correo" value={log.actorEmail} />
        <DetailField label="Entidad" value={getEntityTypeLabel(log.entityType)} />
        <DetailField label="Registro" value={log.entityId} />
      </div>

      {metadataEntries.length > 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-[#d9e1e8] bg-[#fbfcfd] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34475b]">
            Resumen tecnico
          </p>
          <div className="mt-4 space-y-3">
            {metadataEntries.slice(0, 4).map(([key, value]) => (
              <div
                className="flex items-start justify-between gap-4 border-b border-[#e6ebf0] pb-3 last:border-b-0 last:pb-0"
                key={key}
              >
                <span className="text-sm font-medium text-[#46586d]">
                  {formatMetadataKey(key)}
                </span>
                <span className="max-w-[14rem] text-right text-sm text-[#5c6e80]">
                  {formatMetadataValue(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34475b]">
          Metadata JSON
        </p>
        <pre className="mt-3 overflow-x-auto rounded-[1.5rem] bg-[#1f252b] p-5 text-sm leading-7 text-[#eaf0f6]">
          {JSON.stringify(selectedMetadata, null, 2)}
        </pre>
      </div>
    </Card>
  );
}

function DetailField({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] bg-[#f6fafc] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a6c80]">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
