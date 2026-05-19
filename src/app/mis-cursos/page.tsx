import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CircleHelp, Settings2 } from "lucide-react";
import { AccountAuthHeader } from "@/components/account/account-auth-header";
import { CourseArtwork } from "@/components/course-artwork";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import {
  buildCourseContentHref,
  buildCourseForumHref,
  buildCourseResourcesHref
} from "@/lib/course-navigation";
import { getCourseProgressDetailsMapForUser } from "@/lib/course-progress";
import { isStaffCourseRole } from "@/lib/course-roles";
import { siteConfig } from "@/lib/site";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mis cursos",
  robots: {
    index: false,
    follow: false
  }
};

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

export default async function MyCoursesPage() {
  const user = await requireUser("/mis-cursos");
  const spaces = await getUserCourseSpaces({
    userId: user.id,
    email: user.email,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive
  });

  const studentSpaces = spaces.filter((space) => !isStaffCourseRole(space.role));
  const staffSpaces = spaces.filter((space) => isStaffCourseRole(space.role));
  const progressByCourse = await getCourseProgressDetailsMapForUser({
    userId: user.id,
    courses: spaces.map((space) => space.course)
  });
  const initials = getInitials(user.name);
  const roleLabel =
    studentSpaces.length && staffSpaces.length
      ? "Alumno y docente"
      : staffSpaces.length
        ? "Docente"
        : "Alumno";
  const studentCourseEntries = studentSpaces.map((space) => ({
    space,
    progress: progressByCourse.get(space.course.slug) ?? null
  }));
  const primaryStudentCourse =
    [...studentCourseEntries].sort((left, right) => {
      const leftStarted =
        left.progress?.hasStarted && !left.progress.isCompleted
          ? 3
          : left.progress?.hasStarted
            ? 2
            : 1;
      const rightStarted =
        right.progress?.hasStarted && !right.progress.isCompleted
          ? 3
          : right.progress?.hasStarted
            ? 2
            : 1;

      if (leftStarted !== rightStarted) {
        return rightStarted - leftStarted;
      }

      return (right.progress?.completionRate ?? 0) - (left.progress?.completionRate ?? 0);
    })[0] ?? null;
  const averageCompletion =
    studentCourseEntries.length > 0
      ? Math.round(
          studentCourseEntries.reduce(
            (total, course) => total + (course.progress?.completionRate ?? 0),
            0
          ) / studentCourseEntries.length
        )
      : 0;
  const primaryAction = primaryStudentCourse
    ? {
        label: "Continuar lección",
        href: buildCourseContentHref(primaryStudentCourse.space.course.slug)
      }
    : staffSpaces[0]
      ? {
          label: "Abrir docencia",
          href: buildCourseContentHref(staffSpaces[0].course.slug)
        }
      : {
          label: "Explorar catálogo",
          href: "/cursos"
        };
  const forumHref = primaryStudentCourse
    ? buildCourseForumHref(primaryStudentCourse.space.course.slug)
    : staffSpaces[0]
      ? buildCourseForumHref(staffSpaces[0].course.slug)
      : "/cursos";
  const activityHref = studentSpaces.length
    ? "#student-courses-heading"
    : staffSpaces.length
      ? "#staff-courses-heading"
      : "/mis-cursos";
  const navItems = [
    { label: "Mi cuenta", href: "/mi-cuenta" },
    { label: "Mis cursos", href: "/mis-cursos", active: true },
    ...((primaryStudentCourse || staffSpaces[0]) ? [{ label: "Foro", href: forumHref }] : [])
  ];
  const studentGridEntries = primaryStudentCourse
    ? studentCourseEntries.filter(
        ({ space }) => space.course.slug !== primaryStudentCourse.space.course.slug
      )
    : studentCourseEntries;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f9f6f1_0%,#f6f8fb_52%,#fbfaf7_100%)] pb-20">
      <AccountAuthHeader
        fullName={user.name}
        initials={initials}
        navItems={navItems}
        primaryAction={primaryAction}
        roleLabel={roleLabel}
        utilityItems={[
          {
            label: "Actividad",
            href: activityHref,
            icon: <Bell className="h-4 w-4" />
          },
          {
            label: "Preferencias",
            href: "/mi-cuenta#preferencias",
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

      <div className="site-container pt-8">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_20rem]">
          <div className="rounded-[var(--radius-xl)] border border-[rgba(12,113,195,0.18)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(234,241,249,0.82))] p-7 shadow-[var(--shadow-soft)] lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
              Área privada
            </p>
            <h1 className="mt-4 text-display-lg font-semibold text-[var(--color-ink)]">
              Mis cursos
            </h1>
            <p className="mt-4 max-w-3xl text-body-lg text-[var(--color-muted)]">
              Entra en la lección correcta, retoma tu progreso y localiza tus accesos activos sin
              perderte entre listados planos.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={primaryAction.href}>{primaryAction.label}</ButtonLink>
              <ButtonLink href="/mi-cuenta" variant="secondary">
                Volver a mi cuenta
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="ui-card-base bg-[rgba(255,255,255,0.86)] px-5 py-5 backdrop-blur-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Como alumno
              </p>
              <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)]">
                {studentSpaces.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Matrículas activas listas para continuar.
              </p>
            </div>

            <div className="ui-card-base bg-[rgba(255,255,255,0.86)] px-5 py-5 backdrop-blur-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Progreso medio
              </p>
              <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)]">
                {averageCompletion}%
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Resumen agregado de tus cursos como alumno.
              </p>
            </div>

            <div className="ui-card-base bg-[rgba(255,255,255,0.86)] px-5 py-5 backdrop-blur-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Como docente
              </p>
              <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)]">
                {staffSpaces.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Cursos con acceso operativo y de seguimiento.
              </p>
            </div>
          </div>
        </section>

        {primaryStudentCourse ? (
          <section className="mt-10">
            <article className="ui-card-base overflow-hidden border-[rgba(12,113,195,0.18)]">
              <div className="grid gap-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <div className="bg-[#122733] p-5">
                  <CourseArtwork
                    className="h-full min-h-[15rem] w-full rounded-[var(--radius-lg)] border-0"
                    course={primaryStudentCourse.space.course}
                    variant="hero"
                  />
                </div>

                <div className="flex flex-col justify-between p-6 lg:p-7">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                        Lección a continuar
                      </span>
                      <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
                        {primaryStudentCourse.space.course.level}
                      </span>
                    </div>

                    <h2 className="mt-4 text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--color-ink)]">
                      {primaryStudentCourse.space.course.title}
                    </h2>
                    <p className="mt-3 text-base leading-8 text-[var(--color-muted)]">
                      {primaryStudentCourse.progress
                        ? `${primaryStudentCourse.progress.completedModules} de ${primaryStudentCourse.progress.totalModules} módulos revisados y ${primaryStudentCourse.progress.pendingModules} pendientes.`
                        : "Curso listo para empezar en el campus."}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
                      <div
                        aria-hidden="true"
                        className="h-full rounded-full bg-[var(--color-primary)]"
                        style={{
                          width: `${primaryStudentCourse.progress?.completionRate ?? 0}%`
                        }}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                      <span>
                        {primaryStudentCourse.progress?.completionRate ?? 0}% completado
                      </span>
                      <span>
                        {primaryStudentCourse.progress?.lastCompletedAt
                          ? `Actividad ${formatRelativeTime(primaryStudentCourse.progress.lastCompletedAt)}`
                          : "Sin actividad registrada"}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <ButtonLink href={buildCourseContentHref(primaryStudentCourse.space.course.slug)}>
                        Continuar lección
                      </ButtonLink>
                      <ButtonLink
                        href={buildCourseResourcesHref(primaryStudentCourse.space.course.slug)}
                        variant="secondary"
                      >
                        Ver tareas
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </section>
        ) : null}

        {studentSpaces.length ? (
          <section aria-labelledby="student-courses-heading" className="mt-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Aprendizaje
                </p>
                <h2
                  className="mt-2 text-[2.35rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]"
                  id="student-courses-heading"
                >
                  Como alumno
                </h2>
              </div>

              <ButtonLink href="/mi-cuenta" variant="ghost">
                Ver resumen de cuenta
              </ButtonLink>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {studentGridEntries.length ? studentGridEntries.map(({ space, progress }) => {
                const completion = progress?.completionRate ?? 0;

                return (
                  <article
                    className="ui-card-base overflow-hidden transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-medium)]"
                    key={space.course.slug}
                  >
                    <div className="grid gap-0 sm:grid-cols-[10rem_1fr]">
                      <CourseArtwork
                        className="h-full min-h-[8rem] w-full sm:min-h-full"
                        course={space.course}
                        variant="card"
                      />

                      <div className="flex flex-col p-5">
                        <p className="text-xs font-medium text-[var(--color-muted)]">
                          {space.course.activeEdition?.label ?? "Matrícula activa"}
                        </p>
                        <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                          {space.course.title}
                        </h3>
                        <p className="mt-2 text-sm text-[var(--color-muted)]">
                          Progreso: {Math.round(completion)}% · {progress?.completedModules ?? 0}/
                          {progress?.totalModules ?? 0} módulos
                        </p>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                            style={{ width: `${Math.round(completion)}%` }}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                          <span>{progress?.pendingModules ?? 0} módulos pendientes</span>
                          <span>
                            {progress?.lastCompletedAt
                              ? `Actividad ${formatRelativeTime(progress.lastCompletedAt)}`
                              : "Sin actividad registrada"}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <ButtonLink href={buildCourseContentHref(space.course.slug)}>
                            {completion > 0 ? "Continuar lección" : "Abrir lección"}
                          </ButtonLink>
                          <Link
                            className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-[var(--color-primary)]"
                            href="/mi-cuenta"
                          >
                            Ver resumen
                            <ArrowRight aria-hidden className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }) : primaryStudentCourse ? (
                <article className="ui-card-base p-6 lg:col-span-2">
                  <p className="text-[1.4rem] font-semibold text-[var(--color-ink)]">
                    Este curso ya está destacado arriba como acceso principal.
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    Cuando tengas más matrículas activas, aparecerán aquí con progreso, actividad y
                    accesos directos adicionales.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonLink href={buildCourseContentHref(primaryStudentCourse.space.course.slug)}>
                      Continuar lección
                    </ButtonLink>
                    <ButtonLink
                      href={buildCourseResourcesHref(primaryStudentCourse.space.course.slug)}
                      variant="secondary"
                    >
                      Ver tareas
                    </ButtonLink>
                  </div>
                </article>
              ) : null}
            </div>
          </section>
        ) : (
          <div className="ui-empty-state mt-12 p-8 text-center">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Todavía no tienes cursos activos. Explora el catálogo para inscribirte.
            </p>
            <ButtonLink className="mt-6" href="/cursos">
              Ver catálogo
            </ButtonLink>
          </div>
        )}

        {staffSpaces.length ? (
          <section aria-labelledby="staff-courses-heading" className="mt-14">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Docencia
                </p>
                <h2
                  className="mt-2 text-[2.35rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]"
                  id="staff-courses-heading"
                >
                  Como docente
                </h2>
              </div>

              <ButtonLink href="/mi-cuenta" variant="ghost">
                Abrir panel docente
              </ButtonLink>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {staffSpaces.map((space) => (
                <Link
                  className="ui-card-base rounded-[var(--radius-lg)] p-5 transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-medium)]"
                  href={buildCourseContentHref(space.course.slug)}
                  key={space.course.slug}
                >
                  <p className="text-xs font-medium text-[var(--color-muted)]">Gestión docente</p>
                  <p className="mt-2 font-semibold text-[var(--color-ink)]">{space.course.title}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
