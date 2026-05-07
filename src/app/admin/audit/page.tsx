import Link from "next/link";
import type { AuditAction, AuditEntityType } from "@prisma/client";
import { Download } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getAuditActionLabel,
  getAuditActionTone,
  getSearchParamValue
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { parseAuditMetadata } from "@/lib/audit";
import { getDb } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

type AuditPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    range?: string | string[];
    actorId?: string | string[];
    action?: string | string[];
    entity?: string | string[];
    logId?: string | string[];
  }>;
};

const actionOptions: AuditAction[] = [
  "COURSE_CREATED",
  "COURSE_UPDATED",
  "COURSE_CLONED",
  "COURSE_TEACHER_ASSIGNED",
  "COURSE_TEACHER_UNASSIGNED",
  "EDITION_CREATED",
  "EDITION_UPDATED",
  "EDITION_CLOSED",
  "USER_DEACTIVATED",
  "USER_REACTIVATED",
  "USER_ADMIN_GRANTED",
  "USER_ADMIN_REVOKED",
  "PROMOTION_CREATED",
  "PROMOTION_UPDATED",
  "PROMOTION_ACTIVATED",
  "PROMOTION_DEACTIVATED",
  "PURCHASE_CREATED",
  "PURCHASE_PAID",
  "PURCHASE_FAILED",
  "ENROLLMENT_DEACTIVATED",
  "ENROLLMENT_REACTIVATED"
];

const entityOptions: AuditEntityType[] = [
  "USER",
  "COURSE",
  "COURSE_EDITION",
  "COURSE_ENROLLMENT",
  "PROMOTION",
  "PURCHASE",
  "NOTIFICATION_PREFERENCE"
];

export default async function AdminAuditPage({ searchParams }: AuditPageProps) {
  await requireAdminConsoleUser("/admin/audit");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const range = getSearchParamValue(params.range, "7d");
  const actorId = getSearchParamValue(params.actorId, "ALL");
  const action = getSearchParamValue(params.action, "ALL");
  const entity = getSearchParamValue(params.entity, "ALL");
  const logId = getSearchParamValue(params.logId);
  const db = getDb();
  const now = new Date();
  const rangeStart =
    range === "30d"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : range === "7d"
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : null;

  const [actors, logs] = await Promise.all([
    db.user.findMany({
      where: {
        auditLogs: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    }),
    db.auditLog.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { entityLabel: { contains: q } },
                { entityId: { contains: q } },
                { actor: { name: { contains: q } } }
              ]
            }
          : {}),
        ...(rangeStart
          ? {
              createdAt: {
                gte: rangeStart
              }
            }
          : {}),
        ...(actorId !== "ALL" ? { actorId } : {}),
        ...(action !== "ALL" ? { action: action as AuditAction } : {}),
        ...(entity !== "ALL" ? { entityType: entity as AuditEntityType } : {})
      },
      include: {
        actor: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    })
  ]);

  const selectedLog = logs.find((entry) => entry.id === logId) ?? logs[0] ?? null;

  return (
    <div className="space-y-9">
      <AdminPageHeader
        actions={
          <ButtonLink
            href={`/admin/audit/export?range=${range}&actorId=${actorId}&action=${action}&entity=${entity}&q=${encodeURIComponent(q)}`}
            variant="secondary"
          >
            <Download className="mr-2 h-4 w-4" strokeWidth={1.8} />
            Exportar CSV
          </ButtonLink>
        }
        description="Registro cronologico del sistema para acciones administrativas y de negocio con actor, entidad y metadatos."
        title="Auditoria"
      />

      <Card className="rounded-[2rem] p-7">
        <form className="grid gap-3 xl:grid-cols-[1.2fr_220px_220px_220px_220px]">
          <InputAudit defaultValue={q} name="q" placeholder="Buscar logs..." />
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={range}
            name="range"
          >
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
            <option value="ALL">Todo el historico</option>
          </select>
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={actorId}
            name="actorId"
          >
            <option value="ALL">Todos los actores</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={action}
            name="action"
          >
            <option value="ALL">Todas las acciones</option>
            {actionOptions.map((option) => (
              <option key={option} value={option}>
                {getAuditActionLabel(option)}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <select
              className="h-12 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
              defaultValue={entity}
              name="entity"
            >
              <option value="ALL">Todas las entidades</option>
              {entityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              className="rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)]"
              type="submit"
            >
              Filtrar
            </button>
          </div>
        </form>
      </Card>

      <section className="grid gap-6 2xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="overflow-hidden rounded-[2rem]">
          <div className="flex items-center justify-between border-b border-[#dde4ec] px-7 py-6">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Flujo de eventos
              </h2>
              <p className="mt-2 text-sm text-[#52667b]">{logs.length} registros visibles</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-[#dde4ec] text-sm uppercase tracking-[0.16em] text-[#3b4f64]">
                  <th className="px-7 py-4">Fecha</th>
                  <th className="px-4 py-4">Accion</th>
                  <th className="px-4 py-4">Actor</th>
                  <th className="px-7 py-4">Entidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e7ee]">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-7 py-5 text-[#304458]">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-5">
                      <AdminStatusBadge tone={getAuditActionTone(log.action)}>
                        {getAuditActionLabel(log.action)}
                      </AdminStatusBadge>
                    </td>
                    <td className="px-4 py-5 text-[#304458]">{log.actor?.name ?? "Sistema"}</td>
                      <td className="px-7 py-5">
                        <Link className="font-medium text-[var(--color-primary)]" href={`/admin/audit?logId=${log.id}`}>
                          {log.entityLabel ?? log.entityType}
                        </Link>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {selectedLog ? (
          <Card className="rounded-[2rem] p-7">
            <div className="flex items-center justify-between gap-4">
              <AdminStatusBadge tone={getAuditActionTone(selectedLog.action)}>
                {getAuditActionLabel(selectedLog.action)}
              </AdminStatusBadge>
              <p className="text-sm font-semibold text-[#607185]">{selectedLog.entityType}</p>
            </div>

            <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              {selectedLog.entityLabel ?? selectedLog.entityId}
            </h2>
            <p className="mt-2 text-sm text-[#596b7f]">{formatDateTime(selectedLog.createdAt)}</p>

            <div className="mt-6 rounded-[1.5rem] border border-[#d9e1e8] bg-[#fbfcfd] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34475b]">
                Actor
              </p>
              <p className="mt-3 text-[1.12rem] font-semibold text-[var(--color-ink)]">
                {selectedLog.actor?.name ?? "Sistema"}
              </p>
              <p className="mt-1 text-sm text-[#5c6e80]">{selectedLog.actor?.email ?? "Proceso interno"}</p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34475b]">
                Metadatos
              </p>
              <pre className="mt-3 overflow-x-auto rounded-[1.5rem] bg-[#1f252b] p-5 text-sm leading-7 text-[#eaf0f6]">
                {JSON.stringify(parseAuditMetadata(selectedLog.metadataJson) ?? {}, null, 2)}
              </pre>
            </div>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function InputAudit(props: {
  name: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <input
      className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-ink)] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(12,113,195,0.18)]"
      {...props}
    />
  );
}
