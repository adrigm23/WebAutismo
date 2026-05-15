import Link from "next/link";
import { Suspense } from "react";
import {
  Bell,
  BookOpenCheck,
  CircleHelp,
  FileClock,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquareText,
  Settings2,
  Users
} from "lucide-react";
import { logoutAction } from "@/actions/session";
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
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  DashboardNotificationSnapshot,
  TeacherDashboardCourseSummary
} from "@/lib/account-dashboard";
import { siteConfig } from "@/lib/site";
import { cn, formatCompactNumber, formatDateTime } from "@/lib/utils";

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
    <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.84)] px-5 py-5 shadow-[0_18px_34px_rgba(34,34,33,0.05)] backdrop-blur-sm">
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-start">
        <aside className="hidden h-screen w-[18.5rem] shrink-0 self-start overflow-y-auto border-r border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.72)] px-6 py-8 backdrop-blur-md xl:sticky xl:top-0 xl:flex xl:flex-col">
          <Link
            className="text-[1.6rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-primary)]"
            href="/mi-cuenta"
          >
            Panel Docente
          </Link>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{siteConfig.name}</p>

          <div className="mt-8 flex items-center gap-4 rounded-[24px] border border-[var(--color-border)] bg-white p-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-primary-soft)] text-lg font-semibold text-[var(--color-primary)]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[var(--color-muted)]">Docencia activa</p>
              <p className="truncate text-lg font-semibold text-[var(--color-ink)]">{fullName}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            {primaryCourse ? (
              <ButtonLink href={paths.trackingHref}>Ver seguimiento</ButtonLink>
            ) : (
              <a
                className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(12,113,195,0.18)] transition hover:bg-[var(--color-primary-strong)]"
                href={`mailto:${siteConfig.supportEmail}`}
              >
                Contactar soporte
              </a>
            )}
          </div>

          <nav aria-label="Navegacion docente" className="mt-8 space-y-2">
            {[
              {
                label: "Dashboard",
                href: "/mi-cuenta",
                icon: LayoutDashboard,
                active: true
              },
              {
                label: "Mis cursos",
                href: "#mis-cursos",
                icon: GraduationCap,
                active: false
              },
              {
                label: "Seguimiento",
                href: paths.trackingHref,
                icon: LineChart,
                active: false
              },
              {
                label: "Foro",
                href: paths.forumHref,
                icon: MessageSquareText,
                active: false
              },
              {
                label: "Recursos",
                href: paths.resourcesHref,
                icon: FolderKanban,
                active: false
              }
            ].map(({ label, href, icon: Icon, active }) => (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-[1rem] font-medium transition",
                  active
                    ? "bg-[rgba(12,113,195,0.14)] text-[var(--color-primary)]"
                    : "text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                )}
                href={href}
                key={label}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-3 border-t border-[rgba(12,113,195,0.12)] pt-6">
            <Link
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[1rem] font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
              href="#preferencias"
            >
              <Settings2 className="h-5 w-5" />
              Ajustes
            </Link>
            <form action={logoutAction}>
              <Button className="w-full justify-start px-4 py-3" type="submit" variant="ghost">
                <LogOut className="mr-3 h-5 w-5" />
                Cerrar sesion
              </Button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.92)] backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)]"
                  href="/mi-cuenta"
                >
                  {siteConfig.shortName}
                </Link>
                <nav aria-label="Navegacion superior docente" className="hidden items-center gap-3 md:flex">
                  <ButtonLink href="/mi-cuenta" variant="ghost">
                    Mi cuenta
                  </ButtonLink>
                  <ButtonLink href={paths.trackingHref} variant="ghost">
                    Seguimiento
                  </ButtonLink>
                  <ButtonLink href={paths.forumHref} variant="ghost">
                    Foro
                  </ButtonLink>
                  <a
                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                    href={`mailto:${siteConfig.supportEmail}`}
                  >
                    Soporte
                  </a>
                </nav>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="#actividad-docente" variant="ghost">
                  <Bell className="mr-2 h-4 w-4" />
                  Avisos
                  <Suspense fallback={null}>
                    <TeacherUnreadBadge notificationSnapshotPromise={notificationSnapshotPromise} />
                  </Suspense>
                </ButtonLink>
                <ButtonLink href="#preferencias" variant="ghost">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Preferencias
                </ButtonLink>
                <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-3 py-2">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
                    {initials}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{fullName}</p>
                    <p className="text-xs text-[var(--color-muted)]">Docente</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-6 py-8 lg:px-10">
            {isDemoUser ? (
              <Card className="mb-8 border-[#f0d098] bg-[#fff1cf] p-6">
                <p className="text-lg font-semibold text-[#7c5300]">Modo demo activo</p>
                <p className="mt-2 text-base leading-7 text-[#805c16]">
                  Estas navegando con una cuenta docente de prueba sin base de datos. Puedes revisar
                  la experiencia, pero los cambios no se guardan.
                </p>
              </Card>
            ) : null}

            <section className="grid gap-8">
              <Card className="overflow-hidden border-[rgba(12,113,195,0.16)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(229,238,248,0.82))] p-8 lg:p-9">
                <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-end">
                  <div className="max-w-4xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
                      Centro docente
                    </p>
                    <h1 className="mt-4 text-[3.45rem] font-semibold leading-[0.98] tracking-[-0.07em] text-[var(--color-ink)]">
                      Hola, {firstName}. Controla cursos, entregas y acompanamiento desde un panel mas operativo.
                    </h1>
                    <p className="mt-5 max-w-3xl text-[1.03rem] leading-8 text-[var(--color-ink)]/84">
                      Tu espacio docente debe permitir priorizar, revisar y publicar sin navegar a ciegas. Aqui concentramos seguimiento, actividad y acceso directo al campus.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                    <TeacherDashboardStat
                      detail={`${formatCompactNumber(globalSummary.activeLearners)} alumnos con actividad en seguimiento.`}
                      label="Alumnado activo"
                      value={formatCompactNumber(globalSummary.activeLearners)}
                    />
                    <TeacherDashboardStat
                      detail={`${primaryCourse?.pendingReviewItems.length ?? 0} entregas del curso prioritario esperan revision.`}
                      label="Pendiente"
                      value={`${primaryCourse?.pendingReviewItems.length ?? 0}`}
                    />
                    <TeacherDashboardStat
                      detail={totalSubmissions ? `${reviewedSubmissions} de ${totalSubmissions} entregas ya gestionadas.` : "Todavia no hay entregas registradas."}
                      label="Revision"
                      value={totalSubmissions > 0 ? `${Math.round((reviewedSubmissions / totalSubmissions) * 100)}%` : "0%"}
                    />
                  </div>
                </div>
              </Card>

              {primaryCourse ? (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_22rem]">
                  <Card className="overflow-hidden border-[rgba(12,113,195,0.2)] p-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1fr)]">
                      <CourseArtwork
                        className="h-full min-h-[18rem] w-full rounded-[28px] border-0"
                        course={primaryCourse.space.course}
                        variant="hero"
                      />

                      <div className="flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge tone="accent">Curso prioritario</Badge>
                            <Badge tone="muted">{primaryCourse.space.role}</Badge>
                          </div>
                          <h2 className="mt-5 text-[3rem] font-semibold leading-[1.04] tracking-[-0.05em] text-[var(--color-ink)]">
                            {primaryCourse.space.course.title}
                          </h2>
                          <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                            {primaryCourse.learnerCount
                              ? `${primaryCourse.learnerCount} alumnos con seguimiento activo y ${primaryCourse.pendingReviewItems.length} entregas pendientes de revision.`
                              : "Todavia no hay alumnado con progreso registrado en este curso."}
                          </p>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                          <div className="rounded-[24px] bg-[var(--color-surface)] p-5">
                            <p className="text-[2rem] font-semibold text-[var(--color-ink)]">
                              {primaryCourse.pendingReviewItems.length}
                            </p>
                            <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                              Entregas pendientes
                            </p>
                          </div>
                          <div className="rounded-[24px] bg-[var(--color-surface)] p-5">
                            <p className="text-[2rem] font-semibold text-[var(--color-ink)]">
                              {primaryCourse.managedResourceCount}
                            </p>
                            <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                              Recursos gestionados
                            </p>
                          </div>
                          <div className="rounded-[24px] bg-[var(--color-surface)] p-5">
                            <p className="text-[2rem] font-semibold text-[var(--color-ink)]">
                              {primaryCourse.averageCompletionRate}%
                            </p>
                            <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                              Progreso medio
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
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

                  <div className="space-y-6">
                    <Card className="p-6">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-[var(--color-primary)]" />
                        <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                          Seguimiento global
                        </h2>
                      </div>

                      <div className="mt-6 space-y-5 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[var(--color-muted)]">Alumnos activos</span>
                          <span className="text-xl font-semibold text-[var(--color-ink)]">
                            {formatCompactNumber(globalSummary.activeLearners)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[var(--color-muted)]">Entregas revisadas</span>
                          <span className="text-xl font-semibold text-[var(--color-ink)]">
                            {totalSubmissions > 0
                              ? `${Math.round((reviewedSubmissions / totalSubmissions) * 100)}%`
                              : "0%"}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
                          <div
                            aria-hidden="true"
                            className="h-full rounded-full bg-[var(--color-primary)]"
                            style={{
                              width: `${totalSubmissions > 0 ? Math.round((reviewedSubmissions / totalSubmissions) * 100) : 0}%`
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[var(--color-muted)]">Progreso medio</span>
                          <span className="text-xl font-semibold text-[var(--color-ink)]">
                            {globalSummary.averageCompletionRate}%
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
                          <div
                            aria-hidden="true"
                            className="h-full rounded-full bg-[var(--color-primary)]"
                            style={{ width: `${globalSummary.averageCompletionRate}%` }}
                          />
                        </div>
                      </div>
                    </Card>

                    <Suspense fallback={<TeacherSectionSkeleton lines={3} title="Actividad reciente" />}>
                      <TeacherRecentActivitySection
                        courses={teacherCourses}
                        notificationSnapshotPromise={notificationSnapshotPromise}
                      />
                    </Suspense>
                  </div>
                </div>
              ) : (
                <Card className="overflow-hidden border-[rgba(12,113,195,0.18)] p-8 lg:p-10">
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
                    <div>
                      <Badge tone="teacher">Estado actual</Badge>
                      <h2 className="mt-6 text-[3.3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                        Aun no tienes cursos asignados
                      </h2>
                      <p className="mt-4 max-w-2xl text-[1.08rem] leading-8 text-[var(--color-muted)]">
                        Tu panel de docencia esta listo. En cuanto se te asigne un curso o una
                        edicion, aqui aparecera tu centro de control, seguimiento y entregas.
                      </p>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <a
                          className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(12,113,195,0.18)] transition hover:bg-[var(--color-primary-strong)]"
                          href={`mailto:${siteConfig.supportEmail}`}
                        >
                          Contactar con administracion
                        </a>
                        <a
                          className="inline-flex items-center justify-center rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                          href={`mailto:${siteConfig.supportEmail}`}
                        >
                          Ir a soporte
                        </a>
                      </div>
                    </div>

                    <div className="grid place-items-center">
                      <div className="grid h-56 w-56 place-items-center rounded-full bg-[radial-gradient(circle,rgba(229,238,248,0.95)_0%,rgba(248,246,241,0.45)_70%)] text-[var(--color-primary)]">
                        <BookOpenCheck className="h-20 w-20" />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_22rem]">
                <Card className="p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileClock className="h-5 w-5 text-[var(--color-primary)]" />
                      <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                        Pendiente de revisar
                      </h2>
                    </div>
                    {primaryCourse ? (
                      <ButtonLink href={paths.trackingHref} variant="ghost">
                        Ver seguimiento
                      </ButtonLink>
                    ) : null}
                  </div>

                  <div className="mt-6 space-y-4">
                    {pendingReviewItems.length ? (
                      pendingReviewItems.map((item) => (
                        <Link
                          className="block rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)]"
                          href={item.href}
                          key={item.id}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-lg font-semibold leading-tight text-[var(--color-ink)]">
                                {item.resourceTitle}
                              </p>
                              <p className="mt-2 text-sm text-[var(--color-muted)]">
                                {item.learnerName} · {item.courseTitle}
                              </p>
                              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                Entregada {formatDateTime(item.submittedAt)}
                              </p>
                            </div>
                            <Badge tone="muted">{item.statusLabel}</Badge>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
                        No hay entregas pendientes por revisar en este momento.
                      </div>
                    )}
                  </div>
                </Card>

                <Suspense fallback={<TeacherSectionSkeleton lines={2} title="Foro y comunidad" />}>
                  <TeacherCommunityCard
                    notificationSnapshotPromise={notificationSnapshotPromise}
                    paths={paths}
                    resources={globalSummary.resources}
                  />
                </Suspense>
              </div>

              <section id="mis-cursos">
                <div className="mb-6 flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-[var(--color-primary)]" />
                  <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                    Tus cursos
                  </h2>
                </div>

                {secondaryCourses.length ? (
                  <div className="grid gap-6 xl:grid-cols-2">
                    {secondaryCourses.map((course) => (
                      <Card className="overflow-hidden p-0" key={`teacher-course-${course.space.course.slug}`}>
                        <CourseArtwork
                          className="h-52 w-full rounded-none border-0"
                          course={course.space.course}
                        />
                        <div className="p-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge tone="teacher">{course.space.role}</Badge>
                            <Badge tone="muted">{course.space.course.level}</Badge>
                            <Badge tone="muted">{course.space.course.format}</Badge>
                          </div>

                          <h3 className="mt-4 text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-ink)]">
                            {course.space.course.title}
                          </h3>
                          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                            {course.learnerCount
                              ? `${course.learnerCount} alumnos, ${course.pendingReviewItems.length} entregas pendientes y ${course.managedResourceCount} recursos gestionados.`
                              : "Todavia no hay seguimiento registrado para este curso."}
                          </p>

                          <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-[20px] bg-[var(--color-surface)] p-4">
                              <p className="text-lg font-semibold text-[var(--color-ink)]">
                                {course.learnerCount}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                Alumnos
                              </p>
                            </div>
                            <div className="rounded-[20px] bg-[var(--color-surface)] p-4">
                              <p className="text-lg font-semibold text-[var(--color-ink)]">
                                {course.pendingReviewItems.length}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                Pendientes
                              </p>
                            </div>
                            <div className="rounded-[20px] bg-[var(--color-surface)] p-4">
                              <p className="text-lg font-semibold text-[var(--color-ink)]">
                                {course.exerciseCount}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                Ejercicios
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 flex flex-wrap gap-3">
                            <ButtonLink href={`/mis-cursos/${course.space.course.slug}`} prefetch>
                              Entrar al campus
                            </ButtonLink>
                            <ButtonLink
                              href={`/mis-cursos/${course.space.course.slug}/seguimiento`}
                              prefetch
                              variant="secondary"
                            >
                              Ver seguimiento
                            </ButtonLink>
                            <ButtonLink
                              href={`/mis-cursos/${course.space.course.slug}/foro`}
                              prefetch
                              variant="ghost"
                            >
                              Foro
                            </ButtonLink>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : primaryCourse ? (
                  <Card className="p-8">
                    <p className="text-[1.6rem] font-semibold text-[var(--color-ink)]">
                      Este es tu curso docente principal
                    </p>
                    <p className="mt-3 max-w-3xl text-[1rem] leading-8 text-[var(--color-muted)]">
                      Cuando tengas mas asignaciones activas, apareceran aqui con su acceso directo
                      a campus, seguimiento y foro.
                    </p>
                  </Card>
                ) : hasTeacherRoleWithoutCourses ? (
                  <Card className="p-8">
                    <p className="text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                      Aun no hay cursos asignados a tu cuenta docente.
                    </p>
                  </Card>
                ) : null}
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]" id="preferencias">
                <Card className="p-8">
                  <div className="flex items-center gap-3">
                    <CircleHelp className="h-5 w-5 text-[var(--color-primary)]" />
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                      Soporte docente
                    </h2>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Operativa
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                        Usa el seguimiento para revisar progreso del alumnado y el campus del curso
                        para gestionar recursos y ejercicios.
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Contacto
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                        Si necesitas soporte organizativo o acceso a nuevas ediciones, escribe a{" "}
                        {siteConfig.supportEmail}.
                      </p>
                    </div>
                  </div>

                  <a
                    className="mt-6 inline-flex items-center rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                    href={`mailto:${siteConfig.supportEmail}`}
                  >
                    Contactar soporte
                  </a>
                </Card>

                <Suspense fallback={<TeacherSectionSkeleton lines={3} title="Preferencias" />}>
                  <TeacherPreferencesCard
                    notificationSnapshotPromise={notificationSnapshotPromise}
                  />
                </Suspense>
              </section>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
