import Link from "next/link";
import { Suspense } from "react";
import {
  Bell,
  CircleHelp,
  Compass,
  FileCheck2,
  GraduationCap,
  MessageSquareText,
  Settings2,
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
  StudentUnreadBadge,
} from "@/components/account/student-dashboard-shared";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListRow } from "@/components/ui/list-row";
import { MetricPanel } from "@/components/ui/metric-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import type {
  DashboardNotificationSnapshot,
  StudentDashboardPendingSource,
} from "@/lib/account-dashboard";
import {
  buildCourseContentHref,
  buildCourseForumHref,
  buildCourseResourcesHref,
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
  tone?: "default" | "brand" | "warning";
}) {
  return (
    <MetricPanel
      detail={input.detail}
      label={input.label}
      tone={input.tone ?? "default"}
      value={input.value}
    />
  );
}

export function StudentAccountDashboard({
  firstName,
  fullName,
  isDemoUser,
  studentCourses,
  pendingSources,
  notificationSnapshotPromise,
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
    ...(primaryCourse ? [{ label: "Foro", href: forumHref }] : []),
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#faf7f2_0%,#f5f7fa_48%,#fbf9f5_100%)] pb-24">
      <AccountAuthHeader
        contextAction={
          primaryCourse
            ? {
                label: "Continuar leccion",
                href: buildCourseContentHref(primaryCourse.space.course.slug),
              }
            : null
        }
        contextItems={[
          {
            label: "Avisos",
            href: "#actividad-reciente",
            icon: <Bell className="h-4 w-4" />,
            badge: (
              <Suspense fallback={null}>
                <StudentUnreadBadge notificationSnapshotPromise={notificationSnapshotPromise} />
              </Suspense>
            ),
          },
          {
            label: "Preferencias",
            href: "#preferencias",
            icon: <Settings2 className="h-4 w-4" />,
          },
          {
            label: "Soporte",
            href: `mailto:${siteConfig.supportEmail}`,
            icon: <CircleHelp className="h-4 w-4" />,
            external: true,
          },
        ]}
        fullName={fullName}
        initials={initials}
        navItems={navItems}
        roleLabel="Alumno"
      />

      <main className="site-container pt-8">
        {isDemoUser ? (
          <StateBanner
            className="mb-8"
            description="Estas navegando con una cuenta de prueba sin base de datos. Puedes revisar la experiencia del alumno, pero los cambios no se guardan."
            title="Modo demo activo"
            tone="warning"
          />
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)]">
          <div className="space-y-8">
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div>
                <SectionHeader
                  description="Retoma la leccion activa, localiza tus tareas abiertas y mantente en el hilo correcto del curso sin saltar entre paneles pesados."
                  eyebrow="Espacio de aprendizaje"
                  title={`Hola, ${firstName}.`}
                />

                <div className="mt-6 flex flex-wrap gap-3">
                  {primaryCourse ? (
                    <>
                      <ButtonLink href={buildCourseContentHref(primaryCourse.space.course.slug)}>
                        Continuar leccion
                      </ButtonLink>
                      <ButtonLink href={resourcesHref} variant="secondary">
                        Ver tareas
                      </ButtonLink>
                    </>
                  ) : (
                    <ButtonLink href="/cursos">Explorar catalogo</ButtonLink>
                  )}
                  <ButtonLink href="/mis-cursos" variant="ghost">
                    Ver todos mis cursos
                  </ButtonLink>
                </div>

                {primaryCourse ? (
                  <div className="mt-8 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,rgba(255,253,250,0.96),rgba(223,234,243,0.44))] p-5 lg:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">Curso activo</Badge>
                      <Badge tone="muted">{primaryCourse.space.course.level}</Badge>
                      <Badge tone="muted">{primaryCourse.space.course.format}</Badge>
                    </div>

                    <h2 className="font-premium mt-4 text-display-lg font-semibold text-[var(--color-ink)]">
                      {primaryCourse.space.course.title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-body-md text-[var(--color-ink-soft)]">
                      {getNextStudentModuleLabel(primaryCourse)}
                    </p>

                    <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/84">
                          <div
                            aria-hidden="true"
                            className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                            style={{ width: `${primaryCourse.progress.completionRate}%` }}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                          <span>
                            {primaryCourse.progress.completedModules} de{" "}
                            {primaryCourse.progress.totalModules} modulos revisados
                          </span>
                          <span>
                            {primaryCourse.progress.lastCompletedAt
                              ? `Actividad ${formatRelativeTime(primaryCourse.progress.lastCompletedAt)}`
                              : "Aun no has registrado progreso"}
                          </span>
                        </div>
                      </div>
                      <ButtonLink href={buildCourseContentHref(primaryCourse.space.course.slug)}>
                        Abrir campus
                      </ButtonLink>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <StudentDashboardStat
                  detail={
                    primaryCourse
                      ? "Curso principal listo para retomar."
                      : "Sin cursos activos ahora mismo."
                  }
                  label="Cursos activos"
                  tone="brand"
                  value={`${activeCoursesCount}`}
                />
                <StudentDashboardStat
                  detail={
                    primaryCourse
                      ? `${completedModules} de ${totalModules} modulos revisados.`
                      : "Aun no has empezado el recorrido."
                  }
                  label="Progreso"
                  value={`${completionRate}%`}
                />
                <StudentDashboardStat
                  detail={
                    pendingCount ? "Acciones que requieren tu atencion." : "Sin bloqueos inmediatos."
                  }
                  label="Pendientes"
                  tone={pendingCount ? "warning" : "default"}
                  value={`${pendingCount}`}
                />
              </div>
            </section>

            {primaryCourse ? (
              <Card className="overflow-hidden border-[rgba(22,60,88,0.14)] p-0" variant="elevated">
                <div className="grid gap-0 lg:grid-cols-[19rem_minmax(0,1fr)]">
                  <div className="bg-[#132835] p-4 lg:p-5">
                    <CourseArtwork
                      className="h-full min-h-[17rem] w-full rounded-[var(--radius-lg)] border-0"
                      course={primaryCourse.space.course}
                      variant="hero"
                    />
                  </div>

                  <div className="flex flex-col justify-between p-6 lg:p-7">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
                      <div>
                        <p className="text-meta-xs font-semibold text-[var(--color-primary)]">
                          Continuar aprendiendo
                        </p>
                        <h3 className="font-premium mt-3 text-display-md font-semibold text-[var(--color-ink)]">
                          {primaryCourse.space.course.title}
                        </h3>
                        <p className="mt-3 text-body-sm text-[var(--color-ink-soft)]">
                          {primaryCourse.progress.hasStarted
                            ? `${primaryCourse.progress.pendingModules} modulos pendientes hasta completar este recorrido.`
                            : "Curso listo para empezar desde el campus privado."}
                        </p>
                      </div>

                      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-4">
                        <p className="text-meta-xs font-semibold text-[var(--color-muted)]">
                          Proximo foco
                        </p>
                        <p className="mt-3 text-heading-md font-semibold text-[var(--color-ink)]">
                          {getNextStudentModuleLabel(primaryCourse)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <ButtonLink href={buildCourseContentHref(primaryCourse.space.course.slug)}>
                        Continuar leccion
                      </ButtonLink>
                      <ButtonLink href={resourcesHref} variant="secondary">
                        Ver tareas
                      </ButtonLink>
                      <ButtonLink href="/mis-cursos" variant="ghost">
                        Ver area completa
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="overflow-hidden p-8 lg:p-10" variant="muted">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                    <GraduationCap className="h-10 w-10" />
                  </div>
                  <h2 className="font-premium mt-8 text-display-lg font-semibold text-[var(--color-ink)]">
                    Aun no tienes cursos activos
                  </h2>
                  <p className="mt-4 text-body-lg text-[var(--color-muted)]">
                    Explora el catalogo y accede a tus proximas formaciones desde un campus
                    privado con recursos, ejercicios y comunidad por curso.
                  </p>
                  <ButtonLink className="mt-8" href="/cursos">
                    Explorar catalogo
                  </ButtonLink>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6 lg:p-7" variant="muted">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-warning)]">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <SectionHeader
                  className="gap-0"
                  description="Entregas, revisiones y siguientes acciones para no perder continuidad."
                  size="md"
                  title="Pendiente para ti"
                />
              </div>

              <div className="mt-6 space-y-3">
                {pendingItems.length ? (
                  pendingItems.map((item) => (
                    <Link
                      className="block rounded-[var(--radius-md)] transition hover:-translate-y-[1px]"
                      href={item.href}
                      key={item.id}
                    >
                      <ListRow
                        description={
                          <>
                            <span>{item.description}</span>
                            <span className="mt-2 block text-meta-xs text-[var(--color-muted)]">
                              {item.meta}
                            </span>
                          </>
                        }
                        title={item.title}
                        trailing={
                          <div className="flex flex-col items-end gap-2">
                            <Badge className="shrink-0" tone={item.badgeTone}>
                              {item.badgeLabel}
                            </Badge>
                            <span className="text-sm font-semibold text-[var(--color-primary)]">
                              Abrir tarea
                            </span>
                          </div>
                        }
                      />
                    </Link>
                  ))
                ) : (
                  <div className="ui-empty-state p-5 text-sm leading-7 text-[var(--color-muted)]">
                    No hay entregas pendientes ahora mismo. Cuando se publique un nuevo ejercicio o
                    necesites responder a una revision, aparecera aqui.
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

        <section className="mt-16" id="mis-cursos">
          <SectionHeader
            actions={
              <>
                <ButtonLink href="/mis-cursos" variant="secondary">
                  Ver area completa
                </ButtonLink>
                <ButtonLink href="/cursos" variant="ghost">
                  Explorar catalogo
                </ButtonLink>
              </>
            }
            description="Accesos activos, progreso y continuidad de lectura en cada recorrido."
            eyebrow="Aprendizaje"
            title="Mis cursos"
          />

          {studentCourses.length ? (
            <div className="mt-8 grid gap-5 xl:grid-cols-3">
              {secondaryCourses.length ? (
                secondaryCourses.map((course) => (
                  <Card
                    className="overflow-hidden p-0"
                    key={`student-course-${course.space.course.slug}`}
                    variant="elevated"
                  >
                    <CourseArtwork
                      className="h-40 w-full rounded-none border-0"
                      course={course.space.course}
                    />
                    <div className="p-5 lg:p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="student">{course.space.course.level}</Badge>
                        <Badge tone="muted">{course.progress.completionRate}% progreso</Badge>
                      </div>

                      <h3 className="font-premium mt-4 text-heading-lg font-semibold text-[var(--color-ink)]">
                        {course.space.course.title}
                      </h3>
                      <p className="mt-3 text-body-sm text-[var(--color-muted)]">
                        {course.progress.isCompleted
                          ? "Curso completado en tu seguimiento manual."
                          : course.progress.hasStarted
                            ? `${course.progress.pendingModules} modulos pendientes por revisar.`
                            : "Aun no has empezado este curso en el campus."}
                      </p>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
                        <div
                          aria-hidden="true"
                          className="h-full rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${course.progress.completionRate}%` }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                        <span>
                          {course.progress.completedModules} de {course.progress.totalModules} modulos
                        </span>
                        <span>
                          {course.progress.lastCompletedAt
                            ? `Actividad ${formatRelativeTime(course.progress.lastCompletedAt)}`
                            : "Sin actividad registrada"}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <ButtonLink href={buildCourseContentHref(course.space.course.slug)}>
                          Abrir leccion
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
                <Card className="xl:col-span-3 p-7" variant="muted">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-heading-md font-semibold text-[var(--color-ink)]">
                        Este es tu curso activo principal
                      </p>
                      <p className="mt-2 max-w-3xl text-body-sm text-[var(--color-muted)]">
                        Cuando tengas mas matriculas activas, apareceran aqui con su progreso y
                        acceso directo al campus.
                      </p>
                    </div>
                    <ButtonLink
                      href={buildCourseContentHref(primaryCourse.space.course.slug)}
                      variant="secondary"
                    >
                      Abrir campus
                    </ButtonLink>
                  </div>
                </Card>
              ) : null}
            </div>
          ) : (
            <Card className="ui-empty-state mt-8 p-8">
              <p className="text-body-md text-[var(--color-ink)]/84">
                Todavia no tienes cursos asociados. Cuando completes una compra o te asignen un
                curso, apareceran aqui con su estado de acceso real.
              </p>
              <ButtonLink className="mt-6" href="/cursos">
                Explorar cursos
              </ButtonLink>
            </Card>
          )}
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <Card className="p-6 lg:p-7" variant="muted">
            <SectionHeader
              description="Foro privado, ayuda y orientacion de cuenta sin salir del entorno del alumno."
              eyebrow="Acompanamiento"
              size="md"
              title="Comunidad y soporte"
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card className="p-5" variant="elevated">
                <p className="text-meta-xs font-semibold text-[var(--color-muted)]">Foro privado</p>
                <p className="mt-3 text-heading-md font-semibold text-[var(--color-ink)]">
                  Participa en el curso desde tu comunidad privada
                </p>
                <p className="mt-2 text-body-sm text-[var(--color-muted)]">
                  Consulta anuncios, dudas y respuestas del equipo docente asociadas a tu
                  matricula. Las tareas viven dentro del campus.
                </p>
                <ButtonLink className="mt-5" href={forumHref} variant="secondary">
                  Abrir foro
                </ButtonLink>
              </Card>

              <Card className="p-5" variant="elevated">
                <p className="text-meta-xs font-semibold text-[var(--color-muted)]">Soporte</p>
                <p className="mt-3 text-heading-md font-semibold text-[var(--color-ink)]">
                  Resuelve dudas de acceso y organizacion
                </p>
                <p className="mt-2 text-body-sm text-[var(--color-muted)]">
                  Escribe a {siteConfig.supportEmail} si necesitas ayuda con tu cuenta, acceso al
                  campus o incidencias del curso.
                </p>
                <a
                  className="mt-5 inline-flex items-center rounded-[var(--radius-md)] border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                  href={`mailto:${siteConfig.supportEmail}`}
                >
                  <CircleHelp className="mr-2 h-4 w-4" />
                  Contactar soporte
                </a>
              </Card>
            </div>
          </Card>

          <Suspense fallback={<StudentSectionSkeleton lines={3} title="Preferencias" />}>
            <StudentPreferencesCard notificationSnapshotPromise={notificationSnapshotPromise} />
          </Suspense>
        </section>

        <section className="mt-16">
          <Card className="p-6 lg:p-7" variant="muted">
            <SectionHeader
              description="Tu progreso se registra de forma manual y verificable dentro del campus."
              eyebrow="Claridad"
              size="md"
              title="Transparencia del campus"
            />

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ListRow
                description="El progreso se guarda cuando marcas modulos como revisados dentro del campus."
                leading={
                  <div className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                    <Compass className="h-5 w-5" />
                  </div>
                }
                title="Seguimiento"
              />
              <ListRow
                description="Las entregas muestran estado, nota, feedback y si necesitas hacer cambios."
                leading={
                  <div className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-warning)]">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                }
                title="Ejercicios"
              />
              <ListRow
                description="Tu matricula controla recursos, campus y foro privado segun la ventana de acceso."
                leading={
                  <div className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-ink)]">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                }
                title="Acceso"
              />
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
