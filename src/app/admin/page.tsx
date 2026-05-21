import { AlertTriangle, BookCopy, Layers3, UsersRound } from "lucide-react";
import Link from "next/link";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getAuditActionLabel } from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { parseAuditMetadata } from "@/lib/audit";
import { resolveEditionAccessUntil } from "@/lib/course-editions";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";
import { formatCompactNumber, formatRelativeTime } from "@/lib/utils";

function buildActorInitials(name: string | null | undefined) {
  return (name ?? "SYS")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("");
}

export default async function AdminDashboardPage() {
  const user = await requireAdminConsoleUser("/admin");

  if (isDemoUserId(user.id)) {
    const demoLogs = [
      {
        id: "demo-audit-1",
        actor: "Admin Demo",
        action: "USER_ADMIN_GRANTED",
        entityLabel: "admin.demo@autismo.local",
        createdAt: new Date("2026-05-07T09:10:00.000Z")
      },
      {
        id: "demo-audit-2",
        actor: "Admin Demo",
        action: "COURSE_CREATED",
        entityLabel: "Curso de demostracion",
        createdAt: new Date("2026-05-07T09:05:00.000Z")
      }
    ];

    return (
      <div className="space-y-9">
        <AdminPageHeader
          actions={
            <>
              <ButtonLink href="/admin/users" variant="neutral">
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
            meta="Catalogo de demostracion"
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
            <SectionHeader
              eyebrow="Estado"
              size="md"
              title={
                <span className="inline-flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-[var(--color-danger)]" strokeWidth={1.9} />
                  <span>Alertas operativas</span>
                </span>
              }
            />

            <StateBanner
              description="Esta administracion se esta mostrando con datos simulados hasta conectar la base de datos definitiva."
              title="Conexion de base pendiente"
              tone="danger"
            />

            <StateBanner
              description="En modo demo puedes recorrer la interfaz, pero las altas, cambios de rol y auditorias no se guardan."
              title="Acciones deshabilitadas"
              tone="warning"
            />
          </div>

          <SurfaceCard padding="md">
            <SectionHeader
              description="Registro de ejemplo para validar la experiencia visual."
              eyebrow="Auditoria"
              size="md"
              title="Actividad reciente"
            />

            <div className="mt-5 divide-y divide-[var(--color-border-subtle)]">
              {demoLogs.map((log) => (
                <div className="flex flex-wrap items-start gap-5 py-5 first:pt-0 last:pb-0" key={log.id}>
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-brand-soft)] text-base font-semibold text-[var(--color-primary)]">
                    AD
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-[1.12rem] font-semibold text-[var(--color-ink)]">{log.actor}</p>
                      <AdminStatusBadge tone="primary">
                        {getAuditActionLabel(log.action as never)}
                      </AdminStatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">
                      {log.entityLabel}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-muted)]">
                      {formatRelativeTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
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
    auditLogs
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
          in: ["ACTIVE", "SCHEDULED"]
        }
      }
    }),
    db.courseEnrollment.count({ where: { status: "ACTIVE" } }),
    db.promotion.count({ where: { isActive: true } }),
    db.course.findMany({
      where: {
        status: "ACTIVE",
        teacherAssignments: {
          none: {}
        }
      },
      select: {
        id: true,
        title: true,
        slug: true
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 4
    }),
    db.courseEdition.findMany({
      where: {
        isActive: true,
        status: {
          in: ["ACTIVE", "CLOSED"]
        }
      },
      include: {
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    }),
    db.auditLog.findMany({
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
      take: 5
    })
  ]);

  const postAccessEditions = editionsForReview.filter((edition) => {
    const accessUntil = resolveEditionAccessUntil({
      startsAt: edition.startsAt,
      endsAt: edition.endsAt,
      graceAccessDays: edition.graceAccessDays,
      accessUntil: edition.accessUntil
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
            <ButtonLink href="/admin/teachers#create-teacher" variant="neutral">
              Crear docente
            </ButtonLink>
            <ButtonLink href="/admin/editions#create-edition">Crear edicion</ButtonLink>
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
          meta="Catalogo operativo"
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
          <SectionHeader
            eyebrow="Estado"
            size="md"
            title={
              <span className="inline-flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-[var(--color-danger)]" strokeWidth={1.9} />
                <span>Alertas operativas</span>
              </span>
            }
          />

          <StateBanner
            actions={
              coursesWithoutTeachers.length > 0 ? (
                <div className="grid w-full gap-2 sm:w-64">
                  {coursesWithoutTeachers.map((course) => (
                    <Link
                      className="inline-flex min-w-0 items-center justify-start rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm font-medium text-[var(--color-danger)] transition-colors duration-[var(--motion-duration-fast)] hover:bg-white/55 hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2"
                      href={`/admin/courses?courseId=${course.id}`}
                      key={course.id}
                    >
                      <span className="truncate">{course.title}</span>
                    </Link>
                  ))}
                </div>
              ) : null
            }
            description={
              coursesWithoutTeachers.length === 0
                ? "No hay cursos activos sin profesorado asignado."
                : `${coursesWithoutTeachers.length} cursos activos necesitan al menos un docente.`
            }
            title="Cursos sin docentes asignados"
            tone="danger"
          />

          <StateBanner
            actions={
              postAccessEditions.length > 0 ? (
                <div className="grid w-full gap-2 sm:w-64">
                  {postAccessEditions.slice(0, 4).map((edition) => (
                    <Link
                      className="inline-flex min-w-0 items-center justify-start rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm font-medium text-[var(--color-warning)] transition-colors duration-[var(--motion-duration-fast)] hover:bg-white/55 hover:text-[var(--color-warning)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warning)] focus-visible:ring-offset-2"
                      href={`/admin/editions?editionId=${edition.id}`}
                      key={edition.id}
                    >
                      <span className="truncate">{edition.course.title}</span>
                    </Link>
                  ))}
                </div>
              ) : null
            }
            description={
              postAccessEditions.length === 0
                ? "No hay ediciones cerradas con acceso de consulta todavia vigente."
                : `${postAccessEditions.length} ediciones ya finalizaron y siguen dentro de su ventana de consulta.`
            }
            title="Revision de acceso post-edicion"
            tone="warning"
          />
        </div>

        <SurfaceCard padding="md">
          <SectionHeader
            actions={
              <ButtonLink href="/admin/audit" variant="subtle">
                Ver auditoria
              </ButtonLink>
            }
            description="Eventos administrativos y de negocio con trazabilidad completa."
            eyebrow="Auditoria"
            size="md"
            title="Actividad reciente"
          />

          <div className="mt-5 divide-y divide-[var(--color-border-subtle)]">
            {auditLogs.length ? (
              auditLogs.map((log) => {
                const metadata = parseAuditMetadata(log.metadataJson);

                return (
                  <div
                    className="flex flex-wrap items-start gap-5 py-5 first:pt-0 last:pb-0"
                    key={log.id}
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-brand-soft)] text-base font-semibold text-[var(--color-primary)]">
                      {buildActorInitials(log.actor?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-[1.12rem] font-semibold text-[var(--color-ink)]">
                          {log.actor?.name ?? "Sistema"}
                        </p>
                        <AdminStatusBadge tone="primary">
                          {getAuditActionLabel(log.action)}
                        </AdminStatusBadge>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">
                        {log.entityLabel ?? log.entityType}
                        {metadata?.nextRole ? ` · Rol destino: ${String(metadata.nextRole)}` : ""}
                        {metadata?.sourceCourseSlug
                          ? ` · Origen: ${String(metadata.sourceCourseSlug)}`
                          : ""}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-muted)]">
                        {formatRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                description="No hay eventos recientes que mostrar en esta ventana."
                title="Sin actividad reciente"
                tone="subtle"
              />
            )}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
