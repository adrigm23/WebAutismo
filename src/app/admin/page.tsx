import { AlertTriangle, BookCopy, Layers3, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { getAuditActionLabel } from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { isDemoUserId } from "@/lib/demo-auth";
import { parseAuditMetadata } from "@/lib/audit";
import { resolveEditionAccessUntil } from "@/lib/course-editions";
import { getDb } from "@/lib/prisma";
import { formatCompactNumber, formatRelativeTime } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const user = await requireAdminConsoleUser("/admin");

  if (isDemoUserId(user.id)) {
    return (
      <div className="space-y-9">
        <AdminPageHeader
          actions={
            <>
              <ButtonLink href="/admin/users" variant="secondary">
                Ver usuarios demo
              </ButtonLink>
              <ButtonLink href="/mi-cuenta">Volver a mi cuenta</ButtonLink>
            </>
          }
          description="Modo demo sin base de datos. Las metricas y alertas de esta vista son simuladas para revisar la interfaz."
          title="Dashboard general"
        />

        <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr_1fr]">
          <AdminMetricCard
            accent="primary"
            icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
            label="Usuarios activos"
            meta={
              <div>
                <div>
                  <strong>1</strong> admin
                </div>
                <div>
                  <strong>1</strong> docente
                </div>
                <div>
                  <strong>1</strong> alumno
                </div>
              </div>
            }
            value="3"
          />
          <AdminMetricCard
            accent="neutral"
            icon={<BookCopy className="h-6 w-6" strokeWidth={1.8} />}
            label="Cursos activos"
            meta="Catálogo de demostración"
            value="3"
          />
          <AdminMetricCard
            accent="primary"
            icon={<Layers3 className="h-6 w-6" strokeWidth={1.8} />}
            label="Ediciones abiertas"
            meta="1 matricula demo activa"
            value="1"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.25fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className="h-6 w-6 text-[#c43a2f]"
                strokeWidth={1.9}
              />
              <h2 className="text-[2.1rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Alertas operativas
              </h2>
            </div>

            <Card className="rounded-[1.9rem] border-[#f3b8b2] bg-[#fff0ee] p-6 shadow-none">
              <p className="text-lg font-semibold text-[#a72b20]">
                Conexion de base pendiente
              </p>
              <p className="mt-2 text-base leading-7 text-[#a6473f]">
                Esta administracion se esta mostrando con datos simulados hasta
                conectar la base de datos definitiva.
              </p>
            </Card>

            <Card className="rounded-[1.9rem] border-[#f0d098] bg-[#fff1cf] p-6 shadow-none">
              <p className="text-lg font-semibold text-[#7c5300]">
                Acciones deshabilitadas
              </p>
              <p className="mt-2 text-base leading-7 text-[#805c16]">
                En modo demo puedes recorrer la interfaz, pero las altas,
                cambios de rol y auditorias no se guardan.
              </p>
            </Card>
          </div>

          <Card className="overflow-hidden rounded-[1.9rem] border-[#cfd8e2]">
            <div className="flex items-center justify-between gap-4 border-b border-[#d9e0e8] px-7 py-6">
              <div>
                <h2 className="text-[2.1rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                  Actividad reciente
                </h2>
                <p className="mt-2 text-[1rem] text-[#4c6075]">
                  Registro de ejemplo para validar la experiencia visual.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#dde4eb]">
              {[
                {
                  id: "demo-audit-1",
                  actor: "Admin Demo",
                  action: "USER_ADMIN_GRANTED",
                  entityLabel: "admin.demo@autismo.local",
                  createdAt: new Date("2026-05-07T09:10:00.000Z"),
                },
                {
                  id: "demo-audit-2",
                  actor: "Admin Demo",
                  action: "COURSE_CREATED",
                  entityLabel: "Curso de demostración",
                  createdAt: new Date("2026-05-07T09:05:00.000Z"),
                },
              ].map((log) => (
                <div
                  className="flex flex-wrap items-start gap-5 px-7 py-6"
                  key={log.id}
                >
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
                    AD
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-[1.18rem] font-semibold text-[var(--color-ink)]">
                        {log.actor}
                      </p>
                      <AdminStatusBadge tone="primary">
                        {getAuditActionLabel(log.action as never)}
                      </AdminStatusBadge>
                    </div>
                    <p className="mt-2 text-[1.02rem] leading-7 text-[#394d61]">
                      {log.entityLabel}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#68788a]">
                      {formatRelativeTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    );
  }

  const now = new Date();
  const db = getDb();
  const [
    activeUsers,
    adminsCount,
    teachersCount,
    studentsCount,
    activeCoursesCount,
    openEditionsCount,
    activeEnrollmentsCount,
    activePromotionsCount,
    coursesWithoutTeachers,
    editionsForReview,
    auditLogs,
  ] = await Promise.all([
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { isActive: true, globalRole: "ADMIN" } }),
    db.user.count({ where: { isActive: true, globalRole: "TEACHER" } }),
    db.user.count({ where: { isActive: true, globalRole: "STUDENT" } }),
    db.course.count({ where: { status: "ACTIVE" } }),
    db.courseEdition.count({
      where: {
        isActive: true,
        status: {
          in: ["ACTIVE", "SCHEDULED"],
        },
      },
    }),
    db.courseEnrollment.count({ where: { status: "ACTIVE" } }),
    db.promotion.count({ where: { isActive: true } }),
    db.course.findMany({
      where: {
        status: "ACTIVE",
        teacherAssignments: {
          none: {},
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 4,
    }),
    db.courseEdition.findMany({
      where: {
        isActive: true,
        status: {
          in: ["ACTIVE", "CLOSED"],
        },
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    db.auditLog.findMany({
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
      take: 5,
    }),
  ]);

  const postAccessEditions = editionsForReview.filter((edition) => {
    const accessUntil = resolveEditionAccessUntil({
      startsAt: edition.startsAt,
      endsAt: edition.endsAt,
      graceAccessDays: edition.graceAccessDays,
      accessUntil: edition.accessUntil,
    });

    return (
      edition.status === "CLOSED" ||
      (edition.endsAt !== null &&
        edition.endsAt.getTime() <= now.getTime() &&
        accessUntil !== null &&
        accessUntil.getTime() > now.getTime())
    );
  });

  return (
    <div className="space-y-9">
      <AdminPageHeader
        actions={
          <>
            <ButtonLink
              href="/admin/teachers#create-teacher"
              variant="secondary"
            >
              Crear docente
            </ButtonLink>
            <ButtonLink href="/admin/editions#create-edition">
              Crear edicion
            </ButtonLink>
          </>
        }
        description="Metricas de plataforma, alertas operativas y trazabilidad reciente del campus."
        title="Dashboard general"
      />

      <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr_1fr]">
        <AdminMetricCard
          accent="primary"
          icon={<UsersRound className="h-6 w-6" strokeWidth={1.8} />}
          label="Usuarios activos"
          meta={
            <div>
              <div>
                <strong>{adminsCount}</strong> admins
              </div>
              <div>
                <strong>{teachersCount}</strong> docentes
              </div>
              <div>
                <strong>{studentsCount}</strong> alumnos
              </div>
            </div>
          }
          value={formatCompactNumber(activeUsers)}
        />
        <AdminMetricCard
          accent="neutral"
          icon={<BookCopy className="h-6 w-6" strokeWidth={1.8} />}
          label="Cursos activos"
          meta="Catálogo operativo"
          value={activeCoursesCount}
        />
        <AdminMetricCard
          accent="primary"
          icon={<Layers3 className="h-6 w-6" strokeWidth={1.8} />}
          label="Ediciones abiertas"
          meta={`${activeEnrollmentsCount} matriculas activas · ${activePromotionsCount} promociones activas`}
          value={openEditionsCount}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.25fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle
              className="h-6 w-6 text-[#c43a2f]"
              strokeWidth={1.9}
            />
            <h2 className="text-[2.1rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
              Alertas operativas
            </h2>
          </div>

          <Card className="rounded-[1.9rem] border-[#f3b8b2] bg-[#fff0ee] p-6 shadow-none">
            <p className="text-lg font-semibold text-[#a72b20]">
              Cursos sin docentes asignados
            </p>
            <p className="mt-2 text-base leading-7 text-[#a6473f]">
              {coursesWithoutTeachers.length === 0
                ? "No hay cursos activos sin profesorado asignado."
                : `${coursesWithoutTeachers.length} cursos activos necesitan al menos un docente.`}
            </p>
            {coursesWithoutTeachers.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {coursesWithoutTeachers.map((course) => (
                  <ButtonLink
                    href={`/admin/courses?courseId=${course.id}`}
                    key={course.id}
                    variant="ghost"
                  >
                    {course.title}
                  </ButtonLink>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="rounded-[1.9rem] border-[#f0d098] bg-[#fff1cf] p-6 shadow-none">
            <p className="text-lg font-semibold text-[#7c5300]">
              Revision de acceso post-edicion
            </p>
            <p className="mt-2 text-base leading-7 text-[#805c16]">
              {postAccessEditions.length === 0
                ? "No hay ediciones cerradas con acceso de consulta todavía vigente."
                : `${postAccessEditions.length} ediciones ya finalizaron y siguen dentro de su ventana de consulta.`}
            </p>
            {postAccessEditions.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {postAccessEditions.slice(0, 4).map((edition) => (
                  <ButtonLink
                    href={`/admin/editions?editionId=${edition.id}`}
                    key={edition.id}
                    variant="ghost"
                  >
                    {edition.course.title}
                  </ButtonLink>
                ))}
              </div>
            ) : null}
          </Card>
        </div>

        <Card className="overflow-hidden rounded-[1.9rem] border-[#cfd8e2]">
          <div className="flex items-center justify-between gap-4 border-b border-[#d9e0e8] px-7 py-6">
            <div>
              <h2 className="text-[2.1rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Actividad reciente
              </h2>
              <p className="mt-2 text-[1rem] text-[#4c6075]">
                Eventos administrativos y de negocio con trazabilidad completa.
              </p>
            </div>
            <ButtonLink href="/admin/audit" variant="ghost">
              Ver auditoria
            </ButtonLink>
          </div>

          <div className="divide-y divide-[#dde4eb]">
            {auditLogs.map((log) => {
              const metadata = parseAuditMetadata(log.metadataJson);

              return (
                <div
                  className="flex flex-wrap items-start gap-5 px-7 py-6"
                  key={log.id}
                >
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(12,113,195,0.12)] text-base font-semibold text-[var(--color-primary)]">
                    {(log.actor?.name ?? "SYS")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((chunk) => chunk[0]?.toUpperCase())
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-[1.18rem] font-semibold text-[var(--color-ink)]">
                        {log.actor?.name ?? "Sistema"}
                      </p>
                      <AdminStatusBadge tone="primary">
                        {getAuditActionLabel(log.action)}
                      </AdminStatusBadge>
                    </div>
                    <p className="mt-2 text-[1.02rem] leading-7 text-[#394d61]">
                      {log.entityLabel ?? log.entityType}
                      {metadata?.nextRole
                        ? ` · Rol destino: ${String(metadata.nextRole)}`
                        : ""}
                      {metadata?.sourceCourseSlug
                        ? ` · Origen: ${String(metadata.sourceCourseSlug)}`
                        : ""}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#68788a]">
                      {formatRelativeTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
