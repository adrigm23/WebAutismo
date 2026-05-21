import Link from "next/link";
import type { AuditAction, AuditEntityType } from "@prisma/client";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { SectionHeader } from "@/components/ui/section-header";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow
} from "@/components/ui/data-table";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getAuditActionLabel, getAuditActionTone } from "@/lib/admin-console";
import { cn, formatDateTime } from "@/lib/utils";
import { getEntityTypeLabel } from "./audit-utils";

type AuditLogRow = {
  id: string;
  createdAt: Date;
  action: AuditAction;
  entityType: AuditEntityType;
  entityLabel: string | null;
  actorName: string;
  actorEmail: string;
  href: string;
  isSelected: boolean;
};

export function AuditLogTableCard({
  logs,
  countLabel,
  rangeLabel
}: {
  logs: AuditLogRow[];
  countLabel: string;
  rangeLabel?: string;
}) {
  return (
    <SurfaceCard className="min-w-0 w-full max-w-full overflow-hidden" padding="md">
      <SectionHeader
        actions={
          rangeLabel ? <AdminStatusBadge tone="neutral">{rangeLabel}</AdminStatusBadge> : null
        }
        description={countLabel}
        eyebrow="Auditoria"
        size="md"
        title="Flujo de eventos"
      />

      <div className="mt-5 min-w-0">
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Fecha y hora</DataTableHead>
              <DataTableHead>Accion</DataTableHead>
              <DataTableHead>Actor</DataTableHead>
              <DataTableHead>Entidad</DataTableHead>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {logs.length ? (
              logs.map((log) => (
                <DataTableRow
                  className={cn(log.isSelected && "bg-[rgba(22,60,88,0.04)]")}
                  key={log.id}
                >
                  <DataTableCell
                    className={cn(
                      log.isSelected &&
                        "border-l-4 border-[var(--color-primary)] pl-4"
                    )}
                  >
                    {formatDateTime(log.createdAt)}
                  </DataTableCell>
                  <DataTableCell>
                    <AdminStatusBadge tone={getAuditActionTone(log.action)}>
                      {getAuditActionLabel(log.action)}
                    </AdminStatusBadge>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="font-medium text-[var(--color-ink)]">{log.actorName}</div>
                    <div className="mt-1 text-sm text-[var(--color-muted)]">{log.actorEmail}</div>
                  </DataTableCell>
                  <DataTableCell>
                    <Link
                      className="font-medium text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-elevated)]"
                      href={log.href}
                    >
                      {log.entityLabel ?? log.entityType}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {getEntityTypeLabel(log.entityType)}
                    </p>
                  </DataTableCell>
                </DataTableRow>
              ))
            ) : (
              <DataTableEmpty
                colSpan={4}
                description="No hay registros visibles para los filtros actuales."
                title="Sin eventos"
              />
            )}
          </DataTableBody>
        </DataTable>
      </div>
    </SurfaceCard>
  );
}
