import Link from "next/link";
import { Suspense } from "react";
import {
  Bell,
  BookOpenCheck,
  CircleHelp,
  FileClock,
  FolderKanban,
  GraduationCap,
  LineChart,
  MessageSquareText,
  Settings2,
} from "lucide-react";
import { AccountAuthHeader } from "@/components/account/account-auth-header";
import {
  getPrimaryTeacherCourse,
  getReviewedSubmissionsCount,
  getTeacherCoursePaths,
  getTeacherDashboardInitials,
  getTeacherGlobalSummary,
  getTotalSubmissionsCount,
  TeacherCommunityCard,
  TeacherPreferencesCard,
  TeacherRecentActivitySection,
  TeacherSectionSkeleton,
  TeacherUnreadBadge
} from "@/components/account/teacher-dashboard-shared";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateBanner } from "@/components/ui/state-banner";
import type {
  DashboardNotificationSnapshot,
  TeacherDashboardCourseSummary
} from "@/lib/account-dashboard";
import {
  buildCourseContentHref,
  buildCourseForumHref,
  buildCourseResourcesHref,
  buildCourseTrackingHref
} from "@/lib/course-navigation";
import { siteConfig } from "@/lib/site";
import { formatCompactNumber, formatDateTime } from "@/lib/utils";

type TeacherAccountDashboardProps = {
  fullName: string;
  firstName: string;
  isDemoUser: boolean;
  hasTeacherRoleWithoutCourses: boolean;
  teacherCourses: TeacherDashboardCourseSummary[];
  notificationSnapshotPromise: Promise<DashboardNotificationSnapshot>;
};

function TeacherDashboardStat(input: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="ui-card-base bg-[rgba(255,255,255,0.84)] px-5 py-5 backdrop-blur-sm">
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

function TeacherQuickLinkCard(input: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  badge?: string | null;
}) {
  const Icon = input.icon;

  return (
    <Link
      className="ui-card-base block rounded-[var(--radius-lg)] p-5 transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-medium)]"
      href={input.href}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Icon className="h-5 w-5" />
        </div>
        {input.badge ? <Badge tone="outline">{input.badge}</Badge> : null}
      </div>
      <p className="mt-4 text-lg font-semibold leading-tight text-[var(--color-ink)]">
        {input.title}
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{input.body}</p>
    </Link>
  );
}

export function TeacherAccountDashboard({
  fullName,
  firstName,
  isDemoUser,
  hasTeacherRoleWithoutCourses,
  teacherCourses,
  notificationSnapshotPromise
}: TeacherAccountDashboardProps) {
  const primaryCourse = getPrimaryTeacherCourse(teacherCourses);
  const secondaryCourses = primaryCourse
    ? teacherCourses.filter((course) => course.space.course.slug !== primaryCourse.space.course.slug)
    : teacherCourses;
  const initials = getTeacherDashboardInitials(fullName);
  const paths = getTeacherCoursePaths(primaryCourse);
  const globalSummary = getTeacherGlobalSummary(teacherCourses);
  const pendingReviewItems = teacherCourses
    .flatMap((course) => course.pendingReviewItems)
    .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime())
    .slice(0, 6);
  const reviewedSubmissions = getReviewedSubmissionsCount(teacherCourses);
  const totalSubmissions = getTotalSubmissionsCount(teacherCourses);
  const reviewRate =
    totalSubmissions > 0 ? Math.round((reviewedSubmissions / totalSubmissions) * 100) : 0;
  const primaryAction = primaryCourse
    ? {
        label:
          primaryCourse.pendingReviewItems.length > 0 ? "Revisar entregas" : "Ver seguimiento",
        href: paths.trackingHref
      }
    : null;
  const navItems = [
    { label: "Mi cuenta", href: "/mi-cuenta", active: true },
    { label: "Mis cursos", href: "/mis-cursos" },
    ...(primaryCourse
      ? [
          { label: "Seguimiento", href: paths.trackingHref },
          { label: "Foro", href: paths.forumHref }
        ]
      : [])
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)] pb-24">
      <AccountAuthHeader
        fullName={fullName}
        initials={initials}
        navItems={navItems}
        contextAction={primaryAction}
        roleLabel="Docente"
        contextItems={[
          {
            label: "Avisos",
            href: "#actividad-docente",
            icon: <Bell className="h-4 w-4" />,
            badge: (
              <Suspense fallback={null}>
                <TeacherUnreadBadge notificationSnapshotPromise={notificationSnapshotPromise} />
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
          <StateBanner
            className="mb-6"
            description="Estas navegando con una cuenta docente de prueba sin base de datos. Puedes revisar la experiencia, pero los cambios no se guardan."
            title="Modo demo activo"
            tone="warning"
          />
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_22rem]">
          <Card className="overflow-hidden border-[rgba(12,113,195,0.18)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(229,238,248,0.82))] p-7 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
              Hub docente
            </p>
            <h1 className="mt-4 text-display-lg font-semibold leading-[0.98] text-[var(--color-ink)]">
              Hola, {firstName}. Prioriza revisiones, seguimiento y acompañamiento desde un solo lugar.
            </h1>
            <p className="mt-4 max-w-3xl text-body-lg text-[var(--color-ink)]/82">
              Este panel debe decirte qué requiere atención ahora, qué curso conviene abrir y cómo
              llegar a seguimiento, recursos y foro sin sensación de backoffice separado.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {primaryCourse ? (
                <>
                  <ButtonLink href={paths.trackingHref}>
                    {primaryCourse.pendingReviewItems.length > 0
                      ? "Revisar entregas"
                      : "Ver seguimiento"}
                  </ButtonLink>
                  <ButtonLink href="/mis-cursos" variant="secondary">
                    Ver mis cursos
                  </ButtonLink>
                  <ButtonLink href={paths.forumHref} prefetch variant="ghost">
                    Abrir foro
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href="/mis-cursos">Ver mis cursos</ButtonLink>
                  <ButtonLink href={`mailto:${siteConfig.supportEmail}`} variant="secondary">
                    Contactar soporte
                  </ButtonLink>
                </>
              )}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <TeacherDashboardStat
              detail="Entregas abiertas o con prioridad de revisión."
              label="Pendientes"
              value={`${globalSummary.pendingReviews}`}
            />
            <TeacherDashboardStat
              detail={`${formatCompactNumber(globalSummary.activeLearners)} alumnos con trazabilidad activa.`}
              label="Alumnado activo"
              value={formatCompactNumber(globalSummary.activeLearners)}
            />
            <TeacherDashboardStat
              detail={`${teacherCourses.length} cursos con acceso operativo.`}
              label="Cursos activos"
              value={`${teacherCourses.length}`}
            />
            <TeacherDashboardStat
              detail={
                totalSubmissions
                  ? `${reviewedSubmissions} de ${totalSubmissions} entregas ya gestionadas.`
                  : "Todavía no hay entregas registradas."
              }
              label="Revisión"
              value={`${reviewRate}%`}
            />
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_20rem]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <FileClock className="h-5 w-5 text-[var(--color-primary)]" />
                  <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    Qué revisar ahora
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Cola prioritaria de entregas y accesos al seguimiento del curso.
                </p>
              </div>

              {primaryCourse ? (
                <ButtonLink href={paths.trackingHref} variant="ghost">
                  Ver seguimiento
                </ButtonLink>
              ) : null}
            </div>

            <div className="mt-5 space-y-3">
              {pendingReviewItems.length ? (
                pendingReviewItems.slice(0, 4).map((item) => (
                  <Link
                    className="block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:bg-white hover:shadow-[var(--shadow-medium)]"
                    href={item.href}
                    key={item.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold leading-tight text-[var(--color-ink)]">
                          {item.resourceTitle}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          {item.learnerName} · {item.courseTitle}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Entregada {formatDateTime(item.submittedAt)}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">
                          Abrir revisión
                        </p>
                      </div>
                      <Badge tone="warning">Pendiente</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="ui-empty-state px-5 py-6 text-sm leading-7 text-[var(--color-muted)]">
                  No hay entregas pendientes por revisar ahora mismo. Este espacio queda preparado
                  para una futura cola docente más completa sin cambiar todavía el flujo actual.
                </div>
              )}

              {pendingReviewItems.length > 4 && primaryCourse ? (
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-5 py-4 text-sm text-[var(--color-muted)]">
                  Quedan {pendingReviewItems.length - 4} entregas más en la cola actual.
                  <ButtonLink className="ml-3" href={paths.trackingHref} variant="ghost">
                    Ver cola completa
                  </ButtonLink>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {primaryCourse ? (
              <>
                <TeacherQuickLinkCard
                  badge={`${primaryCourse.pendingReviewItems.length} pendientes`}
                  body="Abre el curso con más presión operativa y entra directamente al seguimiento."
                  href={paths.trackingHref}
                  icon={LineChart}
                  title="Seguimiento"
                />
                <TeacherQuickLinkCard
                  badge={`${teacherCourses.length} cursos`}
                  body="Recorre tus asignaciones activas y cambia de curso sin perder contexto."
                  href="/mis-cursos"
                  icon={GraduationCap}
                  title="Mis cursos"
                />
                <TeacherQuickLinkCard
                  badge={`${primaryCourse.managedResourceCount} recursos`}
                  body="Gestiona materiales y ejercicios del curso prioritario desde el campus."
                  href={paths.resourcesHref}
                  icon={FolderKanban}
                  title="Recursos y entregas"
                />
                <TeacherQuickLinkCard
                  badge={`${primaryCourse.learnerCount} alumnos`}
                  body="Consulta anuncios, dudas y actividad comunitaria del curso prioritario."
                  href={paths.forumHref}
                  icon={MessageSquareText}
                  title="Foro del curso"
                />
              </>
            ) : (
              <Card className="p-5 sm:col-span-2 xl:col-span-1">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Atajos del curso
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Cuando tengas un curso docente prioritario, este bloque mostrara accesos directos
                  a seguimiento, recursos, campus y foro sin enviarte a rutas de relleno.
                </p>
              </Card>
            )}
          </div>
        </section>

        {primaryCourse ? (
          <section className="mt-10">
            <Card className="overflow-hidden border-[rgba(12,113,195,0.18)] p-6 lg:p-7">
              <div className="grid gap-5 lg:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1fr)]">
                <CourseArtwork
                  className="h-full min-h-[15rem] w-full rounded-[var(--radius-lg)] border-0"
                  course={primaryCourse.space.course}
                  variant="hero"
                />

                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">Curso prioritario</Badge>
                      <Badge tone="info">{primaryCourse.space.role}</Badge>
                    </div>

                    <h2 className="mt-4 text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--color-ink)]">
                      {primaryCourse.space.course.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      {primaryCourse.learnerCount
                        ? `${primaryCourse.learnerCount} alumnos con seguimiento activo y ${primaryCourse.pendingReviewItems.length} entregas pendientes de revisión.`
                        : "Todavía no hay alumnado con progreso registrado para este curso."}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
                      <p className="text-[1.75rem] font-semibold text-[var(--color-ink)]">
                        {primaryCourse.pendingReviewItems.length}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        Entregas pendientes
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
                      <p className="text-[1.75rem] font-semibold text-[var(--color-ink)]">
                        {primaryCourse.managedResourceCount}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        Recursos gestionados
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
                      <p className="text-[1.75rem] font-semibold text-[var(--color-ink)]">
                        {primaryCourse.averageCompletionRate}%
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        Progreso medio
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <ButtonLink href={paths.campusHref} prefetch>
                      Entrar al campus
                    </ButtonLink>
                    <ButtonLink href={paths.trackingHref} prefetch variant="secondary">
                      Ver seguimiento
                    </ButtonLink>
                    <ButtonLink href={paths.forumHref} prefetch variant="ghost">
                      Abrir foro
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        ) : (
          <section className="mt-10">
            <Card className="overflow-hidden border-[rgba(12,113,195,0.18)] p-6 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
                <div>
                  <Badge tone="info">Estado actual</Badge>
                  <h2 className="mt-5 text-[2.6rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                    Aún no tienes cursos asignados
                  </h2>
                  <p className="mt-3 max-w-2xl text-[1rem] leading-7 text-[var(--color-muted)]">
                    Tu hub docente queda preparado. En cuanto se te asigne una edición, aquí
                    aparecerán la cola de revisión, el curso prioritario y los accesos rápidos.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <ButtonLink href="/mis-cursos">Ver mis cursos</ButtonLink>
                    <ButtonLink href={`mailto:${siteConfig.supportEmail}`} variant="secondary">
                      Contactar soporte
                    </ButtonLink>
                  </div>
                </div>

                <div className="grid place-items-center">
                  <div className="grid h-44 w-44 place-items-center rounded-full bg-[radial-gradient(circle,rgba(229,238,248,0.95)_0%,rgba(248,246,241,0.45)_70%)] text-[var(--color-primary)]">
                    <BookOpenCheck className="h-14 w-14" />
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        <section className="mt-10" id="mis-cursos">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="text-[2.2rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                Tus cursos
              </h2>
            </div>

            <ButtonLink href="/mis-cursos" variant="ghost">
              Abrir listado completo
            </ButtonLink>
          </div>

          {secondaryCourses.length ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {secondaryCourses.map((course) => (
                <Card className="overflow-hidden p-0" key={`teacher-course-${course.space.course.slug}`}>
                  <CourseArtwork
                    className="h-44 w-full rounded-none border-0"
                    course={course.space.course}
                  />
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">{course.space.role}</Badge>
                      <Badge tone="outline">{course.space.course.level}</Badge>
                      <Badge tone="outline">{course.space.course.format}</Badge>
                    </div>

                    <h3 className="mt-3 text-[1.7rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-ink)]">
                      {course.space.course.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-6 text-[var(--color-muted)]">
                      {course.learnerCount
                        ? `${course.learnerCount} alumnos, ${course.pendingReviewItems.length} entregas pendientes y ${course.managedResourceCount} recursos gestionados.`
                        : "Todavía no hay seguimiento registrado para este curso."}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
                        <p className="text-lg font-semibold text-[var(--color-ink)]">
                          {course.learnerCount}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Alumnos
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
                        <p className="text-lg font-semibold text-[var(--color-ink)]">
                          {course.pendingReviewItems.length}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Pendientes
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
                        <p className="text-lg font-semibold text-[var(--color-ink)]">
                          {course.exerciseCount}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Ejercicios
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <ButtonLink href={buildCourseContentHref(course.space.course.slug)} prefetch>
                        Entrar al campus
                      </ButtonLink>
                      <ButtonLink
                        href={buildCourseTrackingHref({
                          courseSlug: course.space.course.slug,
                          submissionId: course.pendingReviewItems[0]?.id ?? null
                        })}
                        prefetch
                        variant="secondary"
                      >
                        {course.pendingReviewItems.length ? "Revisar entregas" : "Ver seguimiento"}
                      </ButtonLink>
                      <ButtonLink
                        href={
                          course.pendingReviewItems.length
                            ? buildCourseResourcesHref(course.space.course.slug, "resource-manager-top")
                            : buildCourseForumHref(course.space.course.slug)
                        }
                        prefetch
                        variant="ghost"
                      >
                        {course.pendingReviewItems.length ? "Gestionar recursos" : "Foro"}
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : primaryCourse ? (
            <Card className="p-6">
              <p className="text-[1.5rem] font-semibold text-[var(--color-ink)]">
                Este es tu curso docente principal
              </p>
              <p className="mt-2.5 max-w-3xl text-[1rem] leading-7 text-[var(--color-muted)]">
                Cuando tengas más asignaciones activas, aparecerán aquí con acceso directo a
                campus, seguimiento y foro.
              </p>
            </Card>
          ) : hasTeacherRoleWithoutCourses ? (
            <div className="ui-empty-state px-5 py-6 text-sm leading-7 text-[var(--color-muted)]">
              Aún no hay cursos asignados a tu cuenta docente.
            </div>
          ) : null}
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Suspense fallback={<TeacherSectionSkeleton lines={3} title="Actividad reciente" />}>
            <TeacherRecentActivitySection
              courses={teacherCourses}
              notificationSnapshotPromise={notificationSnapshotPromise}
            />
          </Suspense>

          <Suspense fallback={<TeacherSectionSkeleton lines={2} title="Foro y comunidad" />}>
            <TeacherCommunityCard
              hasCourseContext={Boolean(primaryCourse)}
              notificationSnapshotPromise={notificationSnapshotPromise}
              paths={paths}
              resources={globalSummary.resources}
            />
          </Suspense>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]" id="preferencias">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <CircleHelp className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                Soporte docente
              </h2>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Operativa
                </p>
                <p className="mt-2.5 text-sm leading-6 text-[var(--color-ink)]">
                  Usa seguimiento para priorizar revisiones y el campus del curso para gestionar
                  materiales y ejercicios.
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Contacto
                </p>
                <p className="mt-2.5 text-sm leading-6 text-[var(--color-ink)]">
                  Si necesitas soporte organizativo o acceso a nuevas ediciones, escribe a{" "}
                  {siteConfig.supportEmail}.
                </p>
              </div>
            </div>

            <ButtonLink className="mt-5" href={`mailto:${siteConfig.supportEmail}`} variant="secondary">
              Contactar soporte
            </ButtonLink>
          </Card>

          <Suspense fallback={<TeacherSectionSkeleton lines={3} title="Preferencias" />}>
            <TeacherPreferencesCard notificationSnapshotPromise={notificationSnapshotPromise} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
