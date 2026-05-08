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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getEditionStatusLabel,
  getEditionStatusTone,
  getSearchParamValue
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { demoAdminEditions } from "@/lib/admin-demo";
import { isDemoUserId } from "@/lib/demo-auth";
import { resolveEditionAccessUntil } from "@/lib/course-editions";
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
          actions={<ButtonLink href="/admin/courses" variant="secondary">Volver a cursos</ButtonLink>}
          description="Vista demo del calendario de cohortes y ventanas de acceso posteriores."
          title="Ediciones"
        />
        <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr_1fr]">
          <Card className="rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={1.8} />
              <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">Ciclo de acceso</h2>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.2rem] bg-[#f6fafc] px-4 py-4 text-sm leading-7 text-[#394d61]"><strong>Abierta:</strong> la edicion esta activa y el alumnado interactua con el contenido.</div>
              <div className="rounded-[1.2rem] border border-[#f0d098] bg-[#fff1cf] px-4 py-4 text-sm leading-7 text-[#7d5a14]"><strong>Finalizada con acceso:</strong> la convocatoria termino, pero la consulta sigue abierta.</div>
              <div className="rounded-[1.2rem] bg-[#f1f4f7] px-4 py-4 text-sm leading-7 text-[#4a5d71]"><strong>Cerrada:</strong> ya no se puede acceder al material.</div>
            </div>
          </Card>
          <AdminMetricCard accent="primary" icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />} label="Alumnado en ediciones" meta="Datos simulados" value={activeStudents} />
          <AdminMetricCard accent="neutral" icon={<Layers3 className="h-6 w-6" strokeWidth={1.8} />} label="Ediciones activas" meta="Seguimiento demo" value={activeEditionsCount} />
        </section>
        <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleEditions.map((edition) => (
              <Link className="block rounded-[2rem] border border-[#d5dee7] bg-white p-6 text-left shadow-[0_16px_36px_rgba(15,44,76,0.05)]" href={`/admin/editions?editionId=${edition.id}`} key={edition.id}>
                <div className="flex items-center justify-between gap-3">
                  <AdminStatusBadge tone={getEditionStatusTone(edition.status as never)}>{getEditionStatusLabel(edition.status as never)}</AdminStatusBadge>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68798b]">{edition.label}</span>
                </div>
                <h3 className="mt-5 text-[1.65rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">{edition.courseTitle}</h3>
                <div className="mt-4 grid gap-4 text-sm leading-7 text-[#46586c] md:grid-cols-2">
                  <div><p className="font-semibold text-[#25384b]">Calendario</p><p className="mt-1">{formatDate(edition.startsAt)} - {formatDate(edition.endsAt)}</p></div>
                  <div><p className="font-semibold text-[#25384b]">Consulta posterior</p><p className="mt-1">{formatDate(edition.accessUntil)}</p></div>
                </div>
                <p className="mt-5 text-sm text-[#5f7083]">{edition.enrollments} alumnos</p>
              </Link>
            ))}
          </div>
          {selectedDemoEdition ? (
            <Card className="rounded-[2rem] p-7">
              <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">Detalle de edicion</h2>
              <p className="mt-2 text-sm leading-7 text-[#5a6d80]">{selectedDemoEdition.courseTitle} - {selectedDemoEdition.label}</p>
              <div className="mt-5 space-y-4 rounded-[1.4rem] border border-[#d9e1e8] bg-[#fbfcfd] p-5 text-sm leading-7 text-[#44586d]">
                <div><strong>Estado:</strong> {getEditionStatusLabel(selectedDemoEdition.status as never)}</div>
                <div><strong>Inicio:</strong> {formatDate(selectedDemoEdition.startsAt)}</div>
                <div><strong>Fin:</strong> {formatDate(selectedDemoEdition.endsAt)}</div>
                <div><strong>Acceso hasta:</strong> {formatDate(selectedDemoEdition.accessUntil)}</div>
                <div><strong>Alumnado:</strong> {selectedDemoEdition.enrollments}</div>
              </div>
            </Card>
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

      <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr_1fr]">
        <Card className="rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={1.8} />
            <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
              Ciclo de acceso
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.2rem] bg-[#f6fafc] px-4 py-4 text-sm leading-7 text-[#394d61]">
              <strong>Abierta:</strong> la edicion esta activa y el alumnado interactua con el contenido.
            </div>
            <div className="rounded-[1.2rem] border border-[#f0d098] bg-[#fff1cf] px-4 py-4 text-sm leading-7 text-[#7d5a14]">
              <strong>Finalizada con acceso:</strong> las fechas oficiales terminaron, pero sigue la ventana de consulta.
            </div>
            <div className="rounded-[1.2rem] bg-[#f1f4f7] px-4 py-4 text-sm leading-7 text-[#4a5d71]">
              <strong>Cerrada:</strong> expiro la ventana posterior y el material queda bloqueado.
            </div>
          </div>
        </Card>
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

      <Card className="rounded-[2rem] p-6">
        <form className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <Input defaultValue={q} name="q" placeholder="Buscar ediciones..." />
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={status}
            name="status"
          >
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
      </Card>

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-5 xl:grid-cols-2">
          {editions.map((edition) => {
            const accessUntil = resolveEditionAccessUntil({
              startsAt: edition.startsAt,
              endsAt: edition.endsAt,
              graceAccessDays: edition.graceAccessDays,
              accessUntil: edition.accessUntil
            });

            return (
              <Link
                className="block rounded-[2rem] border border-[#d5dee7] bg-white p-6 text-left shadow-[0_16px_36px_rgba(15,44,76,0.05)]"
                href={`/admin/editions?editionId=${edition.id}`}
                key={edition.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <AdminStatusBadge tone={getEditionStatusTone(edition.status)}>
                    {getEditionStatusLabel(edition.status)}
                  </AdminStatusBadge>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68798b]">
                    {edition.label}
                  </span>
                </div>
                <h3 className="mt-5 text-[1.65rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                  {edition.course.title}
                </h3>
                <div className="mt-4 grid gap-4 text-sm leading-7 text-[#46586c] md:grid-cols-2">
                  <div>
                    <p className="font-semibold text-[#25384b]">Calendario</p>
                    <p className="mt-1">
                      {edition.startsAt ? formatDate(edition.startsAt) : "Sin inicio"} -{" "}
                      {edition.endsAt ? formatDate(edition.endsAt) : "Sin fin"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#25384b]">Consulta posterior</p>
                    <p className="mt-1">
                      {accessUntil ? formatDate(accessUntil) : `${edition.graceAccessDays} dias`}
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-sm text-[#5f7083]">{edition._count.enrollments} alumnos</p>
              </Link>
            );
          })}
        </div>

        <div className="space-y-6">
          {(create === "1" || editions.length === 0) ? (
            <Card className="rounded-[2rem] p-7" id="create-edition">
              <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Nueva edicion
              </h2>
              <form action={createCourseEditionAction} className="mt-5 space-y-4">
                <select
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                  name="courseId"
                >
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
                  <select
                    className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                    name="status"
                  >
                    <option value="ACTIVE">Activa</option>
                    <option value="SCHEDULED">Programada</option>
                    <option value="CLOSED">Cerrada</option>
                  </select>
                </div>
                <SubmitButton className="w-full" pendingLabel="Creando edicion...">
                  Crear edicion
                </SubmitButton>
              </form>
            </Card>
          ) : null}

          {selectedEdition ? (
            <Card className="rounded-[2rem] p-7">
              <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Ajustar edicion
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#5a6d80]">
                {selectedEdition.course.title} · {selectedEdition.label}
              </p>
              <form action={updateCourseEditionAction} className="mt-5 space-y-4">
                <input name="editionId" type="hidden" value={selectedEdition.id} />
                <Input defaultValue={selectedEdition.label} name="label" required />
                <select
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
                  defaultValue={selectedEdition.status}
                  name="status"
                >
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
                  <Input defaultValue={String(selectedEdition.graceAccessDays)} name="graceAccessDays" type="number" />
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-[#d8e0e8] bg-[#f7fafc] px-4 py-3 text-sm text-[#44586d]">
                  <input defaultChecked={selectedEdition.isActive} name="isActive" type="checkbox" value="true" />
                  Mantener visible en el campus
                </label>
                <SubmitButton className="w-full" pendingLabel="Guardando cambios..." variant="secondary">
                  Guardar edicion
                </SubmitButton>
              </form>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
