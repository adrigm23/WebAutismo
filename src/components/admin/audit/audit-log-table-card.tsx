import Link from "next/link";
import type { AuditAction, AuditEntityType } from "@prisma/client";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import {
  getAuditActionLabel,
  getAuditActionTone
} from "@/lib/admin-console";
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
    <Card className="overflow-hidden rounded-[2rem]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dde4ec] px-7 py-6">
        <div>
          <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
            Flujo de eventos
          </h2>
          <p className="mt-2 text-sm text-[#52667b]">{countLabel}</p>
        </div>
        {rangeLabel ? (
          <div className="rounded-full bg-[#eef3f8] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4e6276]">
            {rangeLabel}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-[#dde4ec] text-sm uppercase tracking-[0.16em] text-[#3b4f64]">
              <th className="px-7 py-4">Fecha y hora</th>
              <th className="px-4 py-4">Accion</th>
              <th className="px-4 py-4">Actor</th>
              <th className="px-7 py-4">Entidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e7ee]">
            {logs.map((log) => (
              <tr
                className={cn(
                  "align-top transition hover:bg-[#f8fbfe]",
                  log.isSelected && "bg-[#f5f9ff]"
                )}
                key={log.id}
              >
                <td
                  className={cn(
                    "px-7 py-5 text-[#304458]",
                    log.isSelected && "border-l-4 border-[var(--color-primary)] pl-6"
                  )}
                >
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-5">
                  <AdminStatusBadge tone={getAuditActionTone(log.action)}>
                    {getAuditActionLabel(log.action)}
                  </AdminStatusBadge>
                </td>
                <td className="px-4 py-5 text-[#304458]">
                  <div className="font-medium text-[var(--color-ink)]">{log.actorName}</div>
                  <div className="mt-1 text-sm text-[#5f7184]">{log.actorEmail}</div>
                </td>
                <td className="px-7 py-5">
                  <Link className="block font-medium text-[var(--color-primary)]" href={log.href}>
                    {log.entityLabel ?? log.entityType}
                  </Link>
                  <p className="mt-1 text-sm text-[#607185]">{getEntityTypeLabel(log.entityType)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
