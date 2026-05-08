import type { ReactNode } from "react";
import Link from "next/link";
import type { AuditAction, AuditEntityType } from "@prisma/client";
import { CalendarRange, Download, Filter, Search, ShieldCheck, UserRoundSearch } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getAuditActionLabel,
  getAuditActionTone,
  getSearchParamValue
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { parseAuditMetadata } from "@/lib/audit";
import { demoAdminAuditLogs } from "@/lib/admin-demo";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";
import { cn, formatDateTime } from "@/lib/utils";

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
  const currentUser = await requireAdminConsoleUser("/admin/audit");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const range = getSearchParamValue(params.range, "7d");
  const actorId = getSearchParamValue(params.actorId, "ALL");
  const action = getSearchParamValue(params.action, "ALL");
  const entity = getSearchParamValue(params.entity, "ALL");
  const logId = getSearchParamValue(params.logId);

  if (isDemoUserId(currentUser.id)) {
    const demoLogs = demoAdminAuditLogs.filter((log) => {
      const matchesQ =
        !q ||
        log.entityLabel.toLowerCase().includes(q.toLowerCase()) ||
        log.actor.name.toLowerCase().includes(q.toLowerCase());
      const matchesAction = action === "ALL" || log.action === action;
      const matchesEntity = entity === "ALL" || log.entityType === entity;

      return matchesQ && matchesAction && matchesEntity;
    });
    const selectedDemoLog = demoLogs.find((entry) => entry.id === logId) ?? demoLogs[0] ?? null;

    const buildDemoQuery = (nextLogId?: string) => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (range !== "7d") qs.set("range", range);
      if (actorId !== "ALL") qs.set("actorId", actorId);
      if (action !== "ALL") qs.set("action", action);
      if (entity !== "ALL") qs.set("entity", entity);
      if (nextLogId) qs.set("logId", nextLogId);
      return `/admin/audit${qs.size > 0 ? `?${qs.toString()}` : ""}`;
    };

    return (
      <div className="space-y-8">
        <AdminPageHeader
          actions={<ButtonLink href="/admin" variant="secondary">Volver al panel</ButtonLink>}
          description="Registro demo para validar la experiencia visual de la auditoria mientras la base real sigue desconectada."
          title="Registro de auditoria"
        />

        <Card className="rounded-[2rem] p-6">
          <form className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_220px_220px_220px_220px]">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#506174]">Buscar</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607185]" strokeWidth={1.8} />
                <Input className="pl-10" defaultValue={q} name="q" placeholder="Buscar registros..." />
              </div>
            </div>
            <FilterSelect defaultValue={range} icon={<CalendarRange className="h-4 w-4" strokeWidth={1.8} />} label="Rango" name="range">
              <option value="7d">Ultimos 7 dias</option>
              <option value="30d">Ultimos 30 dias</option>
              <option value="ALL">Todo el historico</option>
            </FilterSelect>
            <FilterSelect defaultValue={actorId} icon={<UserRoundSearch className="h-4 w-4" strokeWidth={1.8} />} label="Actor" name="actorId">
              <option value="ALL">Todos los actores</option>
              <option value="demo-admin">Admin Demo</option>
            </FilterSelect>
            <FilterSelect defaultValue={action} icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.8} />} label="Accion" name="action">
              <option value="ALL">Todas las acciones</option>
              {actionOptions.map((option) => (
                <option key={option} value={option}>{getAuditActionLabel(option)}</option>
              ))}
            </FilterSelect>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#506174]">Entidad</label>
              <div className="flex gap-3">
                <select className="h-12 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-ink)]" defaultValue={entity} name="entity">
                  <option value="ALL">Todas las entidades</option>
                  {entityOptions.map((option) => (
                    <option key={option} value={option}>{getEntityTypeLabel(option)}</option>
                  ))}
                </select>
                <SubmitButton pendingLabel="Filtrando..." variant="secondary">Filtrar</SubmitButton>
              </div>
            </div>
          </form>
        </Card>

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <Card className="overflow-hidden rounded-[2rem]">
            <div className="border-b border-[#dde4ec] px-7 py-6">
              <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">Flujo de eventos</h2>
              <p className="mt-2 text-sm text-[#52667b]">{demoLogs.length} registros visibles de demostracion</p>
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
                  {demoLogs.map((log) => (
                    <tr className={cn(selectedDemoLog?.id === log.id && "bg-[#f5f9ff]")} key={log.id}>
                      <td className="px-7 py-5 text-[#304458]">{formatDateTime(log.createdAt)}</td>
                      <td className="px-4 py-5">
                        <AdminStatusBadge tone={getAuditActionTone(log.action as AuditAction)}>
                          {getAuditActionLabel(log.action as AuditAction)}
                        </AdminStatusBadge>
                      </td>
                      <td className="px-4 py-5 text-[#304458]">
                        <div className="font-medium text-[var(--color-ink)]">{log.actor.name}</div>
                        <div className="mt-1 text-sm text-[#5f7184]">{log.actor.email}</div>
                      </td>
                      <td className="px-7 py-5">
                        <Link className="block font-medium text-[var(--color-primary)]" href={buildDemoQuery(log.id)}>
                          {log.entityLabel}
                        </Link>
                        <p className="mt-1 text-sm text-[#607185]">{getEntityTypeLabel(log.entityType as AuditEntityType)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {selectedDemoLog ? (
            <Card className="rounded-[2rem] p-7">
              <div className="flex items-center justify-between gap-4">
                <AdminStatusBadge tone={getAuditActionTone(selectedDemoLog.action as AuditAction)}>
                  {getAuditActionLabel(selectedDemoLog.action as AuditAction)}
                </AdminStatusBadge>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#607185]">
                  {getEntityTypeLabel(selectedDemoLog.entityType as AuditEntityType)}
                </p>
              </div>
              <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">{selectedDemoLog.entityLabel}</h2>
              <p className="mt-2 text-sm leading-7 text-[#596b7f]">Evento {selectedDemoLog.id} registrado el {formatDateTime(selectedDemoLog.createdAt)}.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DetailField label="Actor" value={selectedDemoLog.actor.name} />
                <DetailField label="Correo" value={selectedDemoLog.actor.email} />
                <DetailField label="Entidad" value={getEntityTypeLabel(selectedDemoLog.entityType as AuditEntityType)} />
                <DetailField label="Registro" value={selectedDemoLog.entityId} />
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34475b]">Metadata JSON</p>
                <pre className="mt-3 overflow-x-auto rounded-[1.5rem] bg-[#1f252b] p-5 text-sm leading-7 text-[#eaf0f6]">
                  {JSON.stringify(selectedDemoLog.metadata, null, 2)}
                </pre>
              </div>
            </Card>
          ) : null}
        </section>
      </div>
    );
  }

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
  const selectedMetadata = parseAuditMetadata(selectedLog?.metadataJson ?? null);
  const metadataEntries = selectedMetadata ? Object.entries(selectedMetadata) : [];

  const buildAuditQuery = (nextLogId?: string) => {
    const qs = new URLSearchParams();

    if (q) {
      qs.set("q", q);
    }

    if (range !== "7d") {
      qs.set("range", range);
    }

    if (actorId !== "ALL") {
      qs.set("actorId", actorId);
    }

    if (action !== "ALL") {
      qs.set("action", action);
    }

    if (entity !== "ALL") {
      qs.set("entity", entity);
    }

    if (nextLogId) {
      qs.set("logId", nextLogId);
    }

    return `/admin/audit${qs.size > 0 ? `?${qs.toString()}` : ""}`;
  };

  return (
    <div className="space-y-8">
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
        description="Traza operativa del campus con actor, entidad, resumen tecnico y metadatos de cada evento."
        title="Registro de auditoria"
      />

      <Card className="rounded-[2rem] p-6">
        <form className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_220px_220px_220px_220px]">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#506174]">
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607185]" strokeWidth={1.8} />
              <Input className="pl-10" defaultValue={q} name="q" placeholder="Buscar registros..." />
            </div>
          </div>

          <FilterSelect
            defaultValue={range}
            icon={<CalendarRange className="h-4 w-4" strokeWidth={1.8} />}
            label="Rango"
            name="range"
          >
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
            <option value="ALL">Todo el historico</option>
          </FilterSelect>

          <FilterSelect
            defaultValue={actorId}
            icon={<UserRoundSearch className="h-4 w-4" strokeWidth={1.8} />}
            label="Actor"
            name="actorId"
          >
            <option value="ALL">Todos los actores</option>
            {actors.map((actorOption) => (
              <option key={actorOption.id} value={actorOption.id}>
                {actorOption.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            defaultValue={action}
            icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.8} />}
            label="Accion"
            name="action"
          >
            <option value="ALL">Todas las acciones</option>
            {actionOptions.map((option) => (
              <option key={option} value={option}>
                {getAuditActionLabel(option)}
              </option>
            ))}
          </FilterSelect>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#506174]">
              Entidad
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607185]" strokeWidth={1.8} />
                <select
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm text-[var(--color-ink)]"
                  defaultValue={entity}
                  name="entity"
                >
                  <option value="ALL">Todas las entidades</option>
                  {entityOptions.map((option) => (
                    <option key={option} value={option}>
                      {getEntityTypeLabel(option)}
                    </option>
                  ))}
                </select>
              </div>
              <SubmitButton pendingLabel="Filtrando..." variant="secondary">
                Filtrar
              </SubmitButton>
            </div>
          </div>
        </form>
      </Card>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <Card className="overflow-hidden rounded-[2rem]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dde4ec] px-7 py-6">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Flujo de eventos
              </h2>
              <p className="mt-2 text-sm text-[#52667b]">
                {logs.length} registros visibles en el rango seleccionado
              </p>
            </div>
            <div className="rounded-full bg-[#eef3f8] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4e6276]">
              {range === "ALL" ? "Historico completo" : range === "30d" ? "Ventana 30 dias" : "Ventana 7 dias"}
            </div>
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
                {logs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;

                  return (
                    <tr
                      className={cn(
                        "align-top transition hover:bg-[#f8fbfe]",
                        isSelected && "bg-[#f5f9ff]"
                      )}
                      key={log.id}
                    >
                      <td
                        className={cn(
                          "px-7 py-5 text-[#304458]",
                          isSelected && "border-l-4 border-[var(--color-primary)] pl-6"
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
                        <div className="font-medium text-[var(--color-ink)]">
                          {log.actor?.name ?? "Sistema"}
                        </div>
                        <div className="mt-1 text-sm text-[#5f7184]">
                          {log.actor?.email ?? "Proceso interno"}
                        </div>
                      </td>
                      <td className="px-7 py-5">
                        <Link
                          className="block font-medium text-[var(--color-primary)]"
                          href={buildAuditQuery(log.id)}
                        >
                          {log.entityLabel ?? log.entityType}
                        </Link>
                        <p className="mt-1 text-sm text-[#607185]">
                          {getEntityTypeLabel(log.entityType)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
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
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#607185]">
                {getEntityTypeLabel(selectedLog.entityType)}
              </p>
            </div>

            <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              {selectedLog.entityLabel ?? selectedLog.entityId}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#596b7f]">
              Evento {selectedLog.id} registrado el {formatDateTime(selectedLog.createdAt)}.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DetailField
                label="Actor"
                value={selectedLog.actor?.name ?? "Sistema"}
              />
              <DetailField
                label="Correo"
                value={selectedLog.actor?.email ?? "Proceso interno"}
              />
              <DetailField
                label="Entidad"
                value={getEntityTypeLabel(selectedLog.entityType)}
              />
              <DetailField
                label="Registro"
                value={selectedLog.entityId}
              />
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
                      <span className="text-sm font-medium text-[#46586d]">{formatMetadataKey(key)}</span>
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
                {JSON.stringify(selectedMetadata ?? {}, null, 2)}
              </pre>
            </div>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function FilterSelect(props: {
  defaultValue: string;
  icon: ReactNode;
  label: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#506174]">
        {props.label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#607185]">
          {props.icon}
        </div>
        <select
          className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm text-[var(--color-ink)]"
          defaultValue={props.defaultValue}
          name={props.name}
        >
          {props.children}
        </select>
      </div>
    </div>
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

function getEntityTypeLabel(entityType: AuditEntityType) {
  switch (entityType) {
    case "USER":
      return "Usuario";
    case "COURSE":
      return "Curso";
    case "COURSE_EDITION":
      return "Edicion";
    case "COURSE_ENROLLMENT":
      return "Matricula";
    case "PROMOTION":
      return "Promocion";
    case "PURCHASE":
      return "Compra";
    case "NOTIFICATION_PREFERENCE":
      return "Preferencias";
    default:
      return entityType;
  }
}

function formatMetadataKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMetadataValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} elementos`;
  }

  if (value && typeof value === "object") {
    return `${Object.keys(value).length} claves`;
  }

  return "Sin datos";
}
