import type { AuditAction, AuditEntityType } from "@prisma/client";
import {
  CalendarRange,
  Download,
  Filter,
  Search,
  ShieldCheck,
  UserRoundSearch,
} from "lucide-react";
import { AuditDetailCard } from "@/components/admin/audit/audit-detail-card";
import { AuditLogTableCard } from "@/components/admin/audit/audit-log-table-card";
import { FilterSelect } from "@/components/admin/audit/filter-select";
import { getEntityTypeLabel } from "@/components/admin/audit/audit-utils";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAuditActionLabel, getSearchParamValue } from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { parseAuditMetadata } from "@/lib/audit";
import { demoAdminAuditLogs } from "@/lib/admin-demo";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";

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
  "COURSE_EDITION_TEACHER_ASSIGNED",
  "COURSE_EDITION_TEACHER_UNASSIGNED",
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
  "ENROLLMENT_REACTIVATED",
  "COURSE_RESOURCE_CREATED",
  "COURSE_RESOURCE_UPDATED",
  "COURSE_RESOURCE_DELETED",
  "COURSE_RESOURCE_PUBLISHED",
  "COURSE_RESOURCE_UNPUBLISHED",
  "COURSE_RESOURCE_REORDERED",
  "COURSE_RESOURCE_SUBMISSION_CREATED",
  "COURSE_RESOURCE_SUBMISSION_UPDATED",
  "COURSE_RESOURCE_SUBMISSION_REVIEWED",
  "COURSE_RESOURCE_SUBMISSION_CHANGES_REQUESTED",
];

const entityOptions: AuditEntityType[] = [
  "USER",
  "COURSE",
  "COURSE_EDITION",
  "COURSE_ENROLLMENT",
  "COURSE_RESOURCE",
  "COURSE_RESOURCE_SUBMISSION",
  "PROMOTION",
  "PURCHASE",
  "NOTIFICATION_PREFERENCE",
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
    const selectedDemoLog =
      demoLogs.find((entry) => entry.id === logId) ?? demoLogs[0] ?? null;
    const demoLogRows = demoLogs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt,
      action: log.action as AuditAction,
      entityType: log.entityType as AuditEntityType,
      entityLabel: log.entityLabel,
      actorName: log.actor.name,
      actorEmail: log.actor.email,
      href: "",
      isSelected: selectedDemoLog?.id === log.id,
    }));
    const selectedDemoLogDetail = selectedDemoLog
      ? {
          id: selectedDemoLog.id,
          action: selectedDemoLog.action as AuditAction,
          entityType: selectedDemoLog.entityType as AuditEntityType,
          entityLabel: selectedDemoLog.entityLabel,
          entityId: selectedDemoLog.entityId,
          createdAt: selectedDemoLog.createdAt,
          actorName: selectedDemoLog.actor.name,
          actorEmail: selectedDemoLog.actor.email,
        }
      : null;

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
    const resolvedDemoLogRows = demoLogRows.map((log) => ({
      ...log,
      href: buildDemoQuery(log.id),
    }));

    return (
      <div className="space-y-8">
        <AdminPageHeader
          actions={
            <ButtonLink href="/admin" variant="secondary">
              Volver al panel
            </ButtonLink>
          }
          description="Registro demo para validar la experiencia visual de la auditoria mientras la base real sigue desconectada."
          title="Registro de auditoria"
        />

        <Card className="rounded-[2rem] p-6">
          <form className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_220px_220px_220px_220px]">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#506174]">
                Buscar
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607185]"
                  strokeWidth={1.8}
                />
                <Input
                  className="pl-10"
                  defaultValue={q}
                  name="q"
                  placeholder="Buscar registros..."
                />
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
              <option value="demo-admin">Admin Demo</option>
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
                <select
                  className="h-12 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-ink)]"
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
                <SubmitButton pendingLabel="Filtrando..." variant="secondary">
                  Filtrar
                </SubmitButton>
              </div>
            </div>
          </form>
        </Card>

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <AuditLogTableCard
            countLabel={`${demoLogs.length} registros visibles de demostración`}
            logs={resolvedDemoLogRows}
          />

          {selectedDemoLogDetail ? (
            <AuditDetailCard
              log={selectedDemoLogDetail}
              selectedMetadata={selectedDemoLog.metadata}
            />
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
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.auditLog.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { entityLabel: { contains: q } },
                { entityId: { contains: q } },
                { actor: { name: { contains: q } } },
              ],
            }
          : {}),
        ...(rangeStart
          ? {
              createdAt: {
                gte: rangeStart,
              },
            }
          : {}),
        ...(actorId !== "ALL" ? { actorId } : {}),
        ...(action !== "ALL" ? { action: action as AuditAction } : {}),
        ...(entity !== "ALL" ? { entityType: entity as AuditEntityType } : {}),
      },
      include: {
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),
  ]);

  const selectedLog =
    logs.find((entry) => entry.id === logId) ?? logs[0] ?? null;
  const selectedMetadata = parseAuditMetadata(
    selectedLog?.metadataJson ?? null,
  );

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
  const logRows = logs.map((log) => ({
    id: log.id,
    createdAt: log.createdAt,
    action: log.action,
    entityType: log.entityType,
    entityLabel: log.entityLabel,
    actorName: log.actor?.name ?? "Sistema",
    actorEmail: log.actor?.email ?? "Proceso interno",
    href: buildAuditQuery(log.id),
    isSelected: selectedLog?.id === log.id,
  }));
  const selectedLogDetail = selectedLog
    ? {
        id: selectedLog.id,
        action: selectedLog.action,
        entityType: selectedLog.entityType,
        entityLabel: selectedLog.entityLabel,
        entityId: selectedLog.entityId,
        createdAt: selectedLog.createdAt,
        actorName: selectedLog.actor?.name ?? "Sistema",
        actorEmail: selectedLog.actor?.email ?? "Proceso interno",
      }
    : null;

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
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607185]"
                strokeWidth={1.8}
              />
              <Input
                className="pl-10"
                defaultValue={q}
                name="q"
                placeholder="Buscar registros..."
              />
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
                <Filter
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607185]"
                  strokeWidth={1.8}
                />
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
        <AuditLogTableCard
          countLabel={`${logs.length} registros visibles en el rango seleccionado`}
          logs={logRows}
          rangeLabel={
            range === "ALL"
              ? "Historico completo"
              : range === "30d"
                ? "Ventana 30 dias"
                : "Ventana 7 dias"
          }
        />

        {selectedLogDetail ? (
          <AuditDetailCard
            log={selectedLogDetail}
            selectedMetadata={selectedMetadata ?? {}}
          />
        ) : null}
      </section>
    </div>
  );
}
