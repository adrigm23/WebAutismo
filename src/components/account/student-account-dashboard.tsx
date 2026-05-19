import Link from "next/link";
import { Suspense } from "react";
import {
  Bell,
  CircleHelp,
  Compass,
  FileCheck2,
  GraduationCap,
  MessageSquareText,
  Settings2
} from "lucide-react";
import { AccountAuthHeader } from "@/components/account/account-auth-header";
import {
  buildStudentPendingItems,
  getNextStudentModuleLabel,
  getPrimaryStudentCourse,
  getStudentDashboardInitials,
  type StudentDashboardCourse,
  StudentPreferencesCard,
  StudentRecentActivitySection,
  StudentSectionSkeleton,
  StudentUnreadBadge
} from "@/components/account/student-dashboard-shared";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardNotificationSnapshot, StudentDashboardPendingSource } from "@/lib/account-dashboard";
import {
  buildCourseContentHref,
  buildCourseForumHref,
  buildCourseResourcesHref
} from "@/lib/course-navigation";
import { siteConfig } from "@/lib/site";
import { formatRelativeTime } from "@/lib/utils";

type StudentAccountDashboardProps = {
  firstName: string;
  fullName: string;
  isDemoUser: boolean;
  studentCourses: StudentDashboardCourse[];
  pendingSources: StudentDashboardPendingSource[];
  notificationSnapshotPromise: Promise<DashboardNotificationSnapshot>;
};

function StudentDashboardStat(input: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.82)] px-5 py-5 shadow-[0_18px_34px_rgba(34,34,33,0.05)] backdrop-blur-sm">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)]">
        {input.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{input.detail}</p>
    </div>
  );
}

export function StudentAccountDashboard({
  firstName,
  fullName,
  isDemoUser,
  studentCourses,
  pendingSources,
  notificationSnapshotPromise
}: StudentAccountDashboardProps) {
  const primaryCourse = getPrimaryStudentCourse(studentCourses);
  const secondaryCourses = primaryCourse
    ? studentCourses.filter((course) => course.space.course.slug !== primaryCourse.space.course.slug)
    : studentCourses;
  const pendingItems = buildStudentPendingItems(pendingSources);
  const initials = getStudentDashboardInitials(fullName);
  const forumHref = primaryCourse ? buildCourseForumHref(primaryCourse.space.course.slug) : "/cursos";
  const resourcesHref =
    pendingItems[0]?.href ??
    (primaryCourse ? buildCourseResourcesHref(primaryCourse.space.course.slug) : "/cursos");
  const completionRate = primaryCourse?.progress.completionRate ?? 0;
  const completedModules = primaryCourse?.progress.completedModules ?? 0;
  const totalModules = primaryCourse?.progress.totalModules ?? 0;
  const pendingCount = pendingItems.length;
  const activeCoursesCount = studentCourses.length;
  const navItems = [
    { label: "Mi cuenta", href: "/mi-cuenta", active: true },
    { label: "Mis cursos", href: "/mis-cursos" },
    ...(primaryCourse ? [{ label: "Foro", href: forumHref }] : [])
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f9f6f1_0%,#f6f8fb_52%,#fbfaf7_100%)] pb-24">
      <AccountAuthHeader
        fullName={fullName}
        initials={initials}
        navItems={navItems}
        primaryAction={
          primaryCourse
            ? {
                label: "Continuar lección",
                href: buildCourseContentHref(primaryCourse.space.course.slug)
              }
            : null
        }
        roleLabel="Alumno"
        utilityItems={[
          {
            label: "Avisos",
            href: "#actividad-reciente",
            icon: <Bell className="h-4 w-4" />,
            badge: (
              <Suspense fallback={null}>
                <StudentUnreadBadge notificationSnapshotPromise={notificationSnapshotPromise} />
              </Suspense>
            )
          },
          {
            label: "Preferencias",
            href: "#preferencias",
            icon: <Settings2 className="h-4 w-4" />
          },
          {
            label: "Soporte",
            href: `mailto:${siteConfig.supportEmail}`,
            icon: <CircleHelp className="h-4 w-4" />,
            external: true
          }
        ]}
      />

      <main className="site-container pt-8">
        {isDemoUser ? (
          <Card className="mb-8 border-[#f0d098] bg-[#fff1cf] p-6">
            <p className="text-lg font-semibold text-[#7c5300]">Modo demo activo</p>
            <p className="mt-2 text-base leading-7 text-[#805c16]">
              Estás navegando con una cuenta de prueba sin base de datos. Puedes revisar la
              experiencia del alumno, pero los cambios no se guardan.
            </p>
          </Card>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-[rgba(12,113,195,0.18)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(234,241,249,0.82))] p-7 lg:p-8">
              <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
                    Espacio de aprendizaje
                  </p>
                  <h1 className="mt-4 text-[3.55rem] font-semibold leading-[0.98] tracking-[-0.08em] text-[var(--color-ink)]">
                    Hola, {firstName}
                  </h1>
                  <p className="mt-4 max-w-3xl text-[1.03rem] leading-8 text-[var(--color-ink)]/82">
                    Entra aquí para retomar tu lección activa, abrir tus tareas pendientes y seguir
                    el curso sin navegar a ciegas entre pantallas.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {primaryCourse ? (
                      <>
                        <ButtonLink href={buildCourseContentHref(primaryCourse.space.course.slug)}>
                          Continuar lección
                        </ButtonLink>
                        <ButtonLink href={resourcesHref} variant="secondary">
                          Ver tareas
                        </ButtonLink>
                      </>
                    ) : (
                      <ButtonLink href="/cursos">Explorar catálogo</ButtonLink>
                    )}
                    <ButtonLink href="/mis-cursos" variant="ghost">
                      Ver todos mis cursos
                    </ButtonLink>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                  <StudentDashboardStat
                    detail={primaryCourse ? "Curso principal listo para retomar." : "Sin cursos activos ahora mismo."}
                    label="Cursos activos"
                    value={`${activeCoursesCount}`}
                  />
                  <StudentDashboardStat
                    detail={primaryCourse ? `${completedModules} de ${totalModules} módulos revisados.` : "Aún no has empezado el recorrido."}
                    label="Progreso"
                    value={`${completionRate}%`}
                  />
                  <StudentDashboardStat
                    detail={pendingCount ? "Acciones que requieren tu atencion." : "Sin bloqueos inmediatos."}
                    label="Pendientes"
                    value={`${pendingCount}`}
                  />
                </div>
              </div>
            </Card>

            {primaryCourse ? (
              <Card className="overflow-hidden border-[rgba(12,113,195,0.18)]">
                <div className="grid gap-0 lg:grid-cols-[21rem_minmax(0,1fr)]">
                  <div className="relative bg-[#122733] p-5">
                    <CourseArtwork
                      className="h-full min-h-[17rem] w-full rounded-[24px] border-0"
                      course={primaryCourse.space.course}
                      variant="hero"
                    />
                    <Badge className="absolute left-9 top-9" tone="teacher">
                      Curso activo
                    </Badge>
                  </div>

                  <div className="flex flex-col justify-between p-7 lg:p-8">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge tone="brand">Curso actual</Badge>
                        <Badge tone="student">Acceso {primaryCourse.space.accessState}</Badge>
                        <Badge tone="muted">{primaryCourse.space.course.level}</Badge>
                        <Badge tone="muted">{primaryCourse.space.course.format}</Badge>
                      </div>

                      <h2 className="mt-5 text-[3rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--color-ink)]">
                        {primaryCourse.space.course.title}
                      </h2>
                      <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                        {getNextStudentModuleLabel(primaryCourse)}
                      </p>

                      <div className="mt-8 rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)]/72 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                            Progreso general
                          </p>
                          <p className="text-[1.8rem] font-semibold text-[var(--color-primary)]">
                            {primaryCourse.progress.completionRate}%
                          </p>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                          <div
                            aria-hidden="true"
                            className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                            style={{ width: `${primaryCourse.progress.completionRate}%` }}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                          <span>
                            {primaryCourse.progress.completedModules} de {primaryCourse.progress.totalModules} módulos
                            marcados
                          </span>
                          <span>
                            {primaryCourse.progress.lastCompletedAt
                              ? `Última actividad ${formatRelativeTime(primaryCourse.progress.lastCompletedAt)}`
                              : "Aún no has registrado progreso"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <ButtonLink href={buildCourseContentHref(primaryCourse.space.course.slug)}>
                        Continuar lección
                      </ButtonLink>
                      <ButtonLink href={resourcesHref} variant="secondary">
                        Ver tareas
                      </ButtonLink>
                      <ButtonLink href="/mis-cursos" variant="ghost">
                        Ver todos mis cursos
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="overflow-hidden border-[rgba(12,113,195,0.18)] p-8 lg:p-10">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <GraduationCap className="h-12 w-12" />
                  </div>
                  <h2 className="mt-8 text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                    Aún no tienes cursos activos
                  </h2>
                  <p className="mt-4 text-lg leading-9 text-[var(--color-muted)]">
                    Explora el catálogo y accede a tus próximas formaciones desde un campus
                    privado con recursos, ejercicios y comunidad por curso.
                  </p>
                  <ButtonLink className="mt-8" href="/cursos">
                    Explorar catálogo
                  </ButtonLink>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(255,182,6,0.16)] text-[#8c5b00]">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    Pendiente para ti
                  </h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    Entregas, revisiones y siguientes acciones.
                  </p>
                </div>
              </div>

                <div className="mt-6 space-y-3">
                  {pendingItems.length ? (
                    pendingItems.map((item) => (
                    <Link
                      className="block rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)]"
                      href={item.href}
                      key={item.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold leading-tight text-[var(--color-ink)]">
                            {item.title}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                            {item.description}
                          </p>
                          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            {item.meta}
                          </p>
                          <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">
                            Abrir tarea
                          </p>
                        </div>
                        <Badge className="shrink-0" tone={item.badgeTone}>
                          {item.badgeLabel}
                        </Badge>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
                    No hay entregas pendientes ahora mismo. Cuando se publique un nuevo ejercicio o
                    necesites responder a una revisión, aparecerá aquí.
                  </div>
                )}
              </div>
            </Card>

            <Suspense fallback={<StudentSectionSkeleton lines={3} title="Actividad reciente" />}>
              <StudentRecentActivitySection
                notificationSnapshotPromise={notificationSnapshotPromise}
              />
            </Suspense>
          </div>
        </section>

        <section className="mt-14" id="mis-cursos">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Aprendizaje
              </p>
              <h2 className="mt-2 text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Mis cursos
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/mis-cursos" variant="secondary">
                Ver area completa
              </ButtonLink>
              <ButtonLink href="/cursos" variant="ghost">
                Explorar catálogo
              </ButtonLink>
            </div>
          </div>

          {studentCourses.length ? (
            <div className="grid gap-6 xl:grid-cols-3">
              {secondaryCourses.length ? (
                secondaryCourses.map((course) => (
                  <Card className="overflow-hidden p-0" key={`student-course-${course.space.course.slug}`}>
                    <CourseArtwork
                      className="h-44 w-full rounded-none border-0"
                      course={course.space.course}
                    />
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-3">
                          <Badge tone="student">{course.space.course.level}</Badge>
                        <Badge tone="muted">{course.progress.completionRate}% progreso</Badge>
                      </div>

                      <h3 className="mt-4 text-[1.9rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-ink)]">
                        {course.space.course.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                        {course.progress.isCompleted
                          ? "Curso completado en tu seguimiento manual."
                          : course.progress.hasStarted
                            ? `${course.progress.pendingModules} módulos pendientes por revisar.`
                            : "Aún no has empezado este curso en el campus."}
                      </p>

                      <div className="mt-6 h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
                        <div
                          aria-hidden="true"
                          className="h-full rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${course.progress.completionRate}%` }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                        <span>
                          {course.progress.completedModules} de {course.progress.totalModules} módulos
                        </span>
                        <span>
                          {course.progress.lastCompletedAt
                            ? `Actividad ${formatRelativeTime(course.progress.lastCompletedAt)}`
                            : "Sin actividad registrada"}
                        </span>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <ButtonLink href={buildCourseContentHref(course.space.course.slug)}>
                          Abrir lección
                        </ButtonLink>
                        <ButtonLink
                          href={buildCourseResourcesHref(course.space.course.slug)}
                          variant="secondary"
                        >
                          Ver tareas
                        </ButtonLink>
                      </div>
                    </div>
                  </Card>
                ))
              ) : primaryCourse ? (
              <Card className="xl:col-span-3 p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                      <p className="text-[1.6rem] font-semibold text-[var(--color-ink)]">
                        Este es tu curso activo principal
                      </p>
                      <p className="mt-2 max-w-3xl text-[1rem] leading-8 text-[var(--color-muted)]">
                      Cuando tengas más matrículas activas, aparecerán aquí con su progreso y
                      acceso directo al campus.
                    </p>
                  </div>
                    <ButtonLink href={buildCourseContentHref(primaryCourse.space.course.slug)} variant="secondary">
                      Abrir campus
                    </ButtonLink>
                </div>
                </Card>
              ) : null}
            </div>
          ) : (
            <Card className="ui-empty-state p-8">
              <p className="text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                Todavía no tienes cursos asociados. Cuando completes una compra o te asignen un
                curso, aparecerán aquí con su estado de acceso real.
              </p>
              <ButtonLink className="mt-6" href="/cursos">
                Explorar cursos
              </ButtonLink>
            </Card>
          )}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <Card className="p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(12,113,195,0.1)] text-[var(--color-primary)]">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  Comunidad y soporte
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Foro privado, ayuda y orientacion de cuenta.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Foro privado
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
                  Participa en el curso desde tu comunidad privada
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Consulta anuncios, dudas y respuestas del equipo docente asociadas a tu
                  matrícula. Las tareas viven dentro del campus.
                </p>
                <ButtonLink className="mt-5" href={forumHref} variant="secondary">
                  Abrir foro
                </ButtonLink>
              </div>

              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Soporte
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
                  Resuelve dudas de acceso y organizacion
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Escribe a {siteConfig.supportEmail} si necesitas ayuda con tu cuenta, acceso al
                  campus o incidencias del curso.
                </p>
                <a
                  className="mt-5 inline-flex items-center rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                  href={`mailto:${siteConfig.supportEmail}`}
                >
                  <CircleHelp className="mr-2 h-4 w-4" />
                  Contactar soporte
                </a>
              </div>
            </div>
          </Card>

          <Suspense fallback={<StudentSectionSkeleton lines={3} title="Preferencias" />}>
            <StudentPreferencesCard notificationSnapshotPromise={notificationSnapshotPromise} />
          </Suspense>
        </section>

        <section className="mt-14">
          <Card className="p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  Transparencia del campus
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Tu progreso se registra de forma manual y verificable.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Seguimiento
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                  El progreso se guarda cuando marcas módulos como revisados dentro del campus.
                </p>
              </div>
              <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Ejercicios
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                  Las entregas muestran estado, nota, feedback y si necesitas hacer cambios.
                </p>
              </div>
              <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Acceso
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                  Tu matrícula controla recursos, campus y foro privado según la ventana de acceso.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
