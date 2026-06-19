import Link from "next/link";
import { Info, Layers3, UsersRound } from "lucide-react";
import {
  createCourseEditionAction,
  updateCourseEditionAction
} from "@/actions/admin";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListRow } from "@/components/ui/list-row";
import { SectionHeader } from "@/components/ui/section-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  getEditionStatusLabel,
  getEditionStatusTone,
  getSearchParamValue
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { demoAdminEditions } from "@/lib/admin-demo";
import { resolveEditionAccessUntil } from "@/lib/course-editions";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

type EditionsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    editionId?: string | string[];
    create?: string | string[];
  }>;
};

const selectClassName =
  "h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-canvas)]";

function EditionLifecycleGuide() {
  return (
    <SurfaceCard padding="md">
      <SectionHeader
        description="Referencia rapida para interpretar el estado operativo y la ventana de consulta de cada cohorte."
        eyebrow="Acceso"
        size="md"
        title={
          <span className="inline-flex items-center gap-3">
            <Info className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={1.8} />
            <span>Ciclo de acceso</span>
          </span>
        }
      />
      <div className="mt-5 space-y-3">
        <ListRow
          description="La edicion esta activa y el alumnado interactua con el contenido."
          emphasis="muted"
          eyebrow="Abierta"
          title="Edicion en curso"
        />
        <ListRow
          description="Las fechas oficiales terminaron, pero sigue la ventana de consulta."
          eyebrow="Finalizada con acceso"
          title="Consulta todavia permitida"
        />
        <ListRow
          description="Expira la ventana posterior y el material queda bloqueado."
          emphasis="muted"
          eyebrow="Cerrada"
          title="Acceso finalizado"
        />
      </div>
    </SurfaceCard>
  );
}

export default async function AdminEditionsPage({ searchParams }: EditionsPageProps) {
  const currentUser = await requireAdminConsoleUser("/admin/editions");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const status = getSearchParamValue(params.status, "ALL");
  const editionId = getSearchParamValue(params.editionId);
  const create = getSearchParamValue(params.create);

  if (isDemoUserId(currentUser.id)) {
    const visibleEditions = demoAdminEditions.filter((edition) => {
      const matchesQ =
        !q ||
        edition.label.toLowerCase().includes(q.toLowerCase()) ||
        edition.courseTitle.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = status === "ALL" || edition.status === status;
      return matchesQ && matchesStatus;
    });
    const selectedDemoEdition =
      visibleEditions.find((edition) => edition.id === editionId) ?? visibleEditions[0] ?? null;
    const activeStudents = demoAdminEditions.reduce((sum, edition) => sum + edition.enrollments, 0);
    const activeEditionsCount = demoAdminEditions.filter((edition) => edition.status === "ACTIVE").length;

    return (
      <div className="space-y-9">
        <AdminPageHeader
          actions={
            <ButtonLink href="/admin/courses" variant="neutral">
              Volver a cursos
            </ButtonLink>
          }
          description="Vista demo del calendario de cohortes y ventanas de acceso posteriores."
          title="Ediciones"
        />

        <section className="grid gap-5 xl:grid-cols-[2fr_1fr_1fr]">
          <EditionLifecycleGuide />
          <AdminMetricCard
            accent="primary"
            icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
            label="Alumnado en ediciones"
            meta="Datos simulados"
            value={activeStudents}
          />
          <AdminMetricCard
            accent="neutral"
            icon={<Layers3 className="h-6 w-6" strokeWidth={1.8} />}
            label="Ediciones activas"
            meta="Seguimiento demo"
            value={activeEditionsCount}
          />
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleEditions.length ? (
              visibleEditions.map((edition) => (
                <Link
                  className="ui-card-base ui-card-interactive block p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                  href={`/admin/editions?editionId=${edition.id}`}
                  key={edition.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <AdminStatusBadge tone={getEditionStatusTone(edition.status as never)}>
                      {getEditionStatusLabel(edition.status as never)}
                    </AdminStatusBadge>
                    <span className="text-meta-xs font-semibold text-[var(--color-muted)]">
                      {edition.label}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[1.65rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                    {edition.courseTitle}
                  </h3>
                  <div className="mt-4 grid gap-4 text-sm leading-7 text-[var(--color-ink-soft)] md:grid-cols-2">
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">Calendario</p>
                      <p className="mt-1">
                        {formatDate(edition.startsAt)} - {formatDate(edition.endsAt)}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">Consulta posterior</p>
                      <p className="mt-1">{formatDate(edition.accessUntil)}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-[var(--color-muted)]">
                    {edition.enrollments} alumnos
                  </p>
                </Link>
              ))
            ) : (
              <div className="xl:col-span-2">
                <EmptyState
                  description="No hay ediciones demo visibles para los filtros actuales."
                  title="Sin ediciones"
                  tone="subtle"
                />
              </div>
            )}
          </div>

          {selectedDemoEdition ? (
            <SurfaceCard padding="md">
              <SectionHeader
                description={`${selectedDemoEdition.courseTitle} · ${selectedDemoEdition.label}`}
                eyebrow="Detalle"
                size="md"
                title="Detalle de edicion"
              />
              <div className="mt-5 space-y-3">
                <ListRow emphasis="muted" eyebrow="Estado" title={getEditionStatusLabel(selectedDemoEdition.status as never)} />
                <ListRow emphasis="muted" eyebrow="Inicio" title={formatDate(selectedDemoEdition.startsAt)} />
                <ListRow emphasis="muted" eyebrow="Fin" title={formatDate(selectedDemoEdition.endsAt)} />
                <ListRow emphasis="muted" eyebrow="Acceso hasta" title={formatDate(selectedDemoEdition.accessUntil)} />
                <ListRow emphasis="muted" eyebrow="Alumnado" title={`${selectedDemoEdition.enrollments}`} />
              </div>
            </SurfaceCard>
          ) : null}
        </section>
      </div>
    );
  }

  const db = getDb();

  const [editions, courses] = await Promise.all([
    db.courseEdition.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { label: { contains: q } },
                {
                  course: {
                    title: {
                      contains: q
                    }
                  }
                }
              ]
            }
          : {}),
        ...(status !== "ALL"
          ? {
              status: status as "ACTIVE" | "SCHEDULED" | "CLOSED" | "CANCELLED"
            }
          : {})
      },
      include: {
        course: {
          select: {
            title: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: [
        {
          updatedAt: "desc"
        }
      ]
    }),
    db.course.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        id: true,
        title: true
      },
      orderBy: {
        title: "asc"
      }
    })
  ]);

  const selectedEdition = editions.find((edition) => edition.id === editionId) ?? editions[0] ?? null;
  const activeStudentCount = editions.reduce((sum, edition) => sum + edition._count.enrollments, 0);
  const activeEditionsCount = editions.filter((edition) => edition.status === "ACTIVE").length;

  return (
    <div className="space-y-9">
      <AdminPageHeader
        actions={<ButtonLink href="/admin/editions?create=1#create-edition">Crear edicion</ButtonLink>}
        description="Supervisa calendario de cohortes, estados y ventanas de acceso posteriores a la finalizacion."
        title="Ediciones"
      />

      <section className="grid gap-5 xl:grid-cols-[2fr_1fr_1fr]">
        <EditionLifecycleGuide />
        <AdminMetricCard
          accent="primary"
          icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
          label="Alumnado en ediciones"
          meta="Total matriculas vinculadas"
          value={activeStudentCount}
        />
        <AdminMetricCard
          accent="neutral"
          icon={<Layers3 className="h-6 w-6" strokeWidth={1.8} />}
          label="Ediciones activas"
          meta={`${courses.length} cursos con capacidad de crear cohortes`}
          value={activeEditionsCount}
        />
      </section>

      <SurfaceCard padding="md">
        <form className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <Input defaultValue={q} name="q" placeholder="Buscar ediciones..." />
          <select className={selectClassName} defaultValue={status} name="status">
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Abiertas</option>
            <option value="SCHEDULED">Programadas</option>
            <option value="CLOSED">Cerradas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
          <SubmitButton pendingLabel="Aplicando..." variant="secondary">
            Aplicar
          </SubmitButton>
        </form>
      </SurfaceCard>

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-5 xl:grid-cols-2">
          {editions.length ? (
            editions.map((edition) => {
              const accessUntil = resolveEditionAccessUntil({
                startsAt: edition.startsAt,
                endsAt: edition.endsAt,
                graceAccessDays: edition.graceAccessDays,
                accessUntil: edition.accessUntil
              });

              return (
                <Link
                  className="ui-card-base ui-card-interactive block p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                  href={`/admin/editions?editionId=${edition.id}`}
                  key={edition.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <AdminStatusBadge tone={getEditionStatusTone(edition.status)}>
                      {getEditionStatusLabel(edition.status)}
                    </AdminStatusBadge>
                    <span className="text-meta-xs font-semibold text-[var(--color-muted)]">
                      {edition.label}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[1.65rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                    {edition.course.title}
                  </h3>
                  <div className="mt-4 grid gap-4 text-sm leading-7 text-[var(--color-ink-soft)] md:grid-cols-2">
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">Calendario</p>
                      <p className="mt-1">
                        {edition.startsAt ? formatDate(edition.startsAt) : "Sin inicio"} -{" "}
                        {edition.endsAt ? formatDate(edition.endsAt) : "Sin fin"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">Consulta posterior</p>
                      <p className="mt-1">
                        {accessUntil ? formatDate(accessUntil) : `${edition.graceAccessDays} dias`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-[var(--color-muted)]">
                    {edition._count.enrollments} alumnos
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="xl:col-span-2">
              <EmptyState
                description="No hay ediciones visibles para los filtros actuales."
                title="Sin ediciones"
                tone="subtle"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {create === "1" || editions.length === 0 ? (
            <SurfaceCard id="create-edition" padding="md">
              <SectionHeader
                description="Alta manual de una cohorte sin alterar el flujo actual de cursos y matriculas."
                eyebrow="Creacion"
                size="md"
                title="Nueva edicion"
              />
              <form action={createCourseEditionAction} className="mt-5 space-y-4">
                <select className={selectClassName} name="courseId">
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <Input name="label" placeholder="Etiqueta visible" required />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input name="startsAt" type="datetime-local" />
                  <Input name="endsAt" type="datetime-local" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input name="accessUntil" type="datetime-local" />
                  <Input defaultValue="0" name="graceAccessDays" type="number" />
                  <select className={selectClassName} name="status">
                    <option value="ACTIVE">Activa</option>
                    <option value="SCHEDULED">Programada</option>
                    <option value="CLOSED">Cerrada</option>
                  </select>
                </div>
                <SubmitButton className="w-full" pendingLabel="Creando edicion...">
                  Crear edicion
                </SubmitButton>
              </form>
            </SurfaceCard>
          ) : null}

          {selectedEdition ? (
            <SurfaceCard padding="md">
              <SectionHeader
                description={`${selectedEdition.course.title} · ${selectedEdition.label}`}
                eyebrow="Ajustes"
                size="md"
                title="Ajustar edicion"
              />
              <form action={updateCourseEditionAction} className="mt-5 space-y-4">
                <input name="editionId" type="hidden" value={selectedEdition.id} />
                <Input defaultValue={selectedEdition.label} name="label" required />
                <select className={selectClassName} defaultValue={selectedEdition.status} name="status">
                  <option value="ACTIVE">Activa</option>
                  <option value="SCHEDULED">Programada</option>
                  <option value="CLOSED">Cerrada</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    defaultValue={selectedEdition.startsAt ? new Date(selectedEdition.startsAt).toISOString().slice(0, 16) : ""}
                    name="startsAt"
                    type="datetime-local"
                  />
                  <Input
                    defaultValue={selectedEdition.endsAt ? new Date(selectedEdition.endsAt).toISOString().slice(0, 16) : ""}
                    name="endsAt"
                    type="datetime-local"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    defaultValue={selectedEdition.accessUntil ? new Date(selectedEdition.accessUntil).toISOString().slice(0, 16) : ""}
                    name="accessUntil"
                    type="datetime-local"
                  />
                  <Input
                    defaultValue={String(selectedEdition.graceAccessDays)}
                    name="graceAccessDays"
                    type="number"
                  />
                </div>
                <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
                  <input defaultChecked={selectedEdition.isActive} name="isActive" type="checkbox" value="true" />
                  Mantener visible en el campus
                </label>
                <SubmitButton className="w-full" pendingLabel="Guardando cambios..." variant="secondary">
                  Guardar edicion
                </SubmitButton>
              </form>
            </SurfaceCard>
          ) : null}
        </div>
      </section>
    </div>
  );
}
