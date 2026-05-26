import Link from "next/link";
import { Suspense, type ComponentType } from "react";
import {
  BookOpenCheck,
  CircleHelp,
  FileClock,
  FolderKanban,
  GraduationCap,
  LineChart,
  MessageSquareText,
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
} from "@/components/account/teacher-dashboard-shared";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { MetricPanel } from "@/components/ui/metric-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
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

function TeacherQuickLinkCard(input: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  badge?: string | null;
}) {
  const Icon = input.icon;

  return (
    <Link
      className="ui-card-base ui-card-interactive block rounded-[var(--radius-lg)] p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
      href={input.href}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
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
  const navItems = [
    { label: "Mi cuenta", href: "/mi-cuenta", active: true },
    { label: "Mis cursos", href: "/mis-cursos" },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)] pb-24">
      <AccountAuthHeader
        fullName={fullName}
        initials={initials}
        navItems={navItems}
        roleLabel="Docente"
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
          <SurfaceCard
            className="overflow-hidden border-[rgba(22,60,88,0.16)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(223,234,243,0.74))]"
            padding="lg"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
              Hub docente
            </p>
            <h1 className="mt-4 text-display-lg font-semibold leading-[0.98] text-[var(--color-ink)]">
              Hola, {firstName}. Prioriza revisiones, seguimiento y acompanamiento desde un solo lugar.
            </h1>
            <p className="mt-4 max-w-3xl text-body-lg text-[var(--color-ink)]/82">
              Este panel debe decirte que requiere atencion ahora, que curso conviene abrir y como
              llegar a seguimiento, recursos y foro sin sensacion de backoffice separado.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {primaryCourse ? (
                <>
                  <ButtonLink href={paths.trackingHref}>
                    {primaryCourse.pendingReviewItems.length > 0
                      ? "Revisar entregas"
                      : "Ver seguimiento"}
                  </ButtonLink>
                  <ButtonLink href="/mis-cursos" variant="neutral">
                    Ver mis cursos
                  </ButtonLink>
                  <ButtonLink href={paths.forumHref} prefetch variant="subtle">
                    Abrir foro
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href="/mis-cursos">Ver mis cursos</ButtonLink>
                  <ButtonLink href={`mailto:${siteConfig.supportEmail}`} variant="neutral">
                    Contactar soporte
                  </ButtonLink>
                </>
              )}
            </div>
          </SurfaceCard>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <MetricPanel
              detail="Entregas abiertas o con prioridad de revision."
              label="Pendientes"
              tone="warning"
              value={globalSummary.pendingReviews}
            />
            <MetricPanel
              detail={`${formatCompactNumber(globalSummary.activeLearners)} alumnos con trazabilidad activa.`}
              label="Alumnado activo"
              tone="brand"
              value={formatCompactNumber(globalSummary.activeLearners)}
            />
            <MetricPanel
              detail={`${teacherCourses.length} cursos con acceso operativo.`}
              label="Cursos activos"
              value={teacherCourses.length}
            />
            <MetricPanel
              detail={
                totalSubmissions
                  ? `${reviewedSubmissions} de ${totalSubmissions} entregas ya gestionadas.`
                  : "Todavia no hay entregas registradas."
              }
              label="Revision"
              value={`${reviewRate}%`}
            />
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_20rem]">
          <SurfaceCard padding="md">
            <SectionHeader
              actions={
                primaryCourse ? (
                  <ButtonLink href={paths.trackingHref} variant="subtle">
                    Ver seguimiento
                  </ButtonLink>
                ) : null
              }
              description="Cola prioritaria de entregas y accesos al seguimiento del curso."
              eyebrow="Revision"
              size="md"
              title={
                <span className="inline-flex items-center gap-3">
                  <FileClock className="h-5 w-5 text-[var(--color-primary)]" />
                  <span>Que revisar ahora</span>
                </span>
              }
            />

            <div className="mt-5 space-y-3">
              {pendingReviewItems.length ? (
                pendingReviewItems.slice(0, 4).map((item) => (
                  <Link
                    className="block rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-5 py-4 transition duration-[var(--motion-duration-base)] hover:-translate-y-[1px] hover:border-[var(--color-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
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
                          Abrir revision
                        </p>
                      </div>
                      <Badge tone="warning">Pendiente</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState
                  description="Este espacio queda preparado para una futura cola docente mas completa sin cambiar todavia el flujo actual."
                  title="No hay entregas pendientes por revisar"
                  tone="subtle"
                />
              )}

              {pendingReviewItems.length > 4 && primaryCourse ? (
                <StateBanner
                  actions={
                    <ButtonLink href={paths.trackingHref} variant="neutral">
                      Ver cola completa
                    </ButtonLink>
                  }
                  description={`Quedan ${pendingReviewItems.length - 4} entregas mas en la cola actual.`}
                  tone="info"
                />
              ) : null}
            </div>
          </SurfaceCard>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {primaryCourse ? (
              <>
                <TeacherQuickLinkCard
                  badge={`${primaryCourse.pendingReviewItems.length} pendientes`}
                  body="Abre el curso con mas presion operativa y entra directamente al seguimiento."
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
              <SurfaceCard className="sm:col-span-2 xl:col-span-1" padding="md" variant="muted">
                <EmptyState
                  description="Cuando tengas un curso docente prioritario, este bloque mostrara accesos directos a seguimiento, recursos, campus y foro sin enviarte a rutas de relleno."
                  title="Atajos del curso"
                  tone="subtle"
                />
              </SurfaceCard>
            )}
          </div>
        </section>

        {primaryCourse ? (
          <section className="mt-10">
            <SurfaceCard className="overflow-hidden border-[rgba(22,60,88,0.16)]" padding="md">
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
                        ? `${primaryCourse.learnerCount} alumnos con seguimiento activo y ${primaryCourse.pendingReviewItems.length} entregas pendientes de revision.`
                        : "Todavia no hay alumnado con progreso registrado para este curso."}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <MetricPanel
                      detail="Entregas pendientes"
                      label="Revision"
                      tone="warning"
                      value={primaryCourse.pendingReviewItems.length}
                    />
                    <MetricPanel
                      detail="Recursos gestionados"
                      label="Recursos"
                      value={primaryCourse.managedResourceCount}
                    />
                    <MetricPanel
                      detail="Progreso medio"
                      label="Progreso"
                      tone="brand"
                      value={`${primaryCourse.averageCompletionRate}%`}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <ButtonLink href={paths.campusHref} prefetch>
                      Entrar al campus
                    </ButtonLink>
                    <ButtonLink href={paths.trackingHref} prefetch variant="neutral">
                      Ver seguimiento
                    </ButtonLink>
                    <ButtonLink href={paths.forumHref} prefetch variant="subtle">
                      Abrir foro
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </section>
        ) : (
          <section className="mt-10">
            <SurfaceCard className="overflow-hidden border-[rgba(22,60,88,0.16)]" padding="lg">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
                <div>
                  <Badge tone="info">Estado actual</Badge>
                  <h2 className="mt-5 text-[2.6rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                    Aun no tienes cursos asignados
                  </h2>
                  <p className="mt-3 max-w-2xl text-[1rem] leading-7 text-[var(--color-muted)]">
                    Tu hub docente queda preparado. En cuanto se te asigne una edicion, aqui
                    apareceran la cola de revision, el curso prioritario y los accesos rapidos.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <ButtonLink href="/mis-cursos">Ver mis cursos</ButtonLink>
                    <ButtonLink href={`mailto:${siteConfig.supportEmail}`} variant="neutral">
                      Contactar soporte
                    </ButtonLink>
                  </div>
                </div>

                <div className="grid place-items-center">
                  <div className="grid h-44 w-44 place-items-center rounded-full bg-[radial-gradient(circle,rgba(223,234,243,0.95)_0%,rgba(248,246,241,0.45)_70%)] text-[var(--color-primary)]">
                    <BookOpenCheck className="h-14 w-14" />
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </section>
        )}

        <section className="mt-10" id="mis-cursos">
          <SectionHeader
            actions={
              <ButtonLink href="/mis-cursos" variant="subtle">
                Abrir listado completo
              </ButtonLink>
            }
            eyebrow="Asignaciones"
            size="md"
            title={
              <span className="inline-flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-[var(--color-primary)]" />
                <span>Tus cursos</span>
              </span>
            }
          />

          {secondaryCourses.length ? (
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {secondaryCourses.map((course) => (
                <Card
                  className="overflow-hidden p-0"
                  key={`teacher-course-${course.space.course.slug}`}
                >
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
                        : "Todavia no hay seguimiento registrado para este curso."}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <MetricPanel
                        detail="Alumnos"
                        label="Alumnado"
                        value={course.learnerCount}
                      />
                      <MetricPanel
                        detail="Pendientes"
                        label="Revision"
                        tone="warning"
                        value={course.pendingReviewItems.length}
                      />
                      <MetricPanel
                        detail="Ejercicios"
                        label="Recursos"
                        value={course.exerciseCount}
                      />
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
                        variant="neutral"
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
                        variant="subtle"
                      >
                        {course.pendingReviewItems.length ? "Gestionar recursos" : "Foro"}
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : primaryCourse ? (
            <SurfaceCard className="mt-5" padding="md" variant="muted">
              <EmptyState
                description="Cuando tengas mas asignaciones activas, apareceran aqui con acceso directo a campus, seguimiento y foro."
                title="Este es tu curso docente principal"
                tone="subtle"
              />
            </SurfaceCard>
          ) : hasTeacherRoleWithoutCourses ? (
            <div className="mt-5">
              <EmptyState
                description="Aun no hay cursos asignados a tu cuenta docente."
                title="Sin cursos asignados"
                tone="subtle"
              />
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
          <SurfaceCard padding="md">
            <SectionHeader
              description="Pautas operativas y canal de contacto para mantener el trabajo docente dentro del mismo lenguaje del campus."
              eyebrow="Soporte"
              size="md"
              title={
                <span className="inline-flex items-center gap-3">
                  <CircleHelp className="h-5 w-5 text-[var(--color-primary)]" />
                  <span>Soporte docente</span>
                </span>
              }
            />

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <ListRow
                description="Usa seguimiento para priorizar revisiones y el campus del curso para gestionar materiales y ejercicios."
                eyebrow="Operativa"
                title="Revision, campus y recursos en el mismo flujo"
              />
              <ListRow
                description={`Si necesitas soporte organizativo o acceso a nuevas ediciones, escribe a ${siteConfig.supportEmail}.`}
                eyebrow="Contacto"
                title="Canal directo con soporte"
              />
            </div>

            <ButtonLink className="mt-5" href={`mailto:${siteConfig.supportEmail}`} variant="neutral">
              Contactar soporte
            </ButtonLink>
          </SurfaceCard>

          <Suspense fallback={<TeacherSectionSkeleton lines={3} title="Preferencias" />}>
            <TeacherPreferencesCard notificationSnapshotPromise={notificationSnapshotPromise} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
