import type { Metadata } from "next";
import { AccountAuthHeader } from "@/components/account/account-auth-header";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricPanel } from "@/components/ui/metric-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import {
  buildCourseContentHref,
  buildCourseForumHref,
  buildCourseResourcesHref,
  buildCourseTrackingHref,
} from "@/lib/course-navigation";
import { canViewCourseProgress } from "@/lib/course-permissions";
import { getCourseProgressDetailsMapForUser } from "@/lib/course-progress";
import { isStaffCourseRole } from "@/lib/course-roles";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mis cursos",
  robots: {
    index: false,
    follow: false,
  },
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
    userIsActive: user.isActive,
  });

  const studentSpaces = spaces.filter(
    (space) => !isStaffCourseRole(space.role),
  );
  const staffSpaces = spaces.filter((space) => isStaffCourseRole(space.role));
  const progressByCourse = await getCourseProgressDetailsMapForUser({
    userId: user.id,
    courses: spaces.map((space) => space.course),
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
    progress: progressByCourse.get(space.course.slug) ?? null,
  }));
  const staffCourseEntries = staffSpaces.map((space) => {
    const showTrackingNav = canViewCourseProgress({
      globalRole: user.globalRole,
      viewerRole: space.role,
    });

    return {
      space,
      showTrackingNav,
      teachingHref: showTrackingNav
        ? buildCourseTrackingHref({ courseSlug: space.course.slug })
        : buildCourseContentHref(space.course.slug),
    };
  });
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

      return (
        (right.progress?.completionRate ?? 0) -
        (left.progress?.completionRate ?? 0)
      );
    })[0] ?? null;
  const primaryStaffCourse = staffCourseEntries[0] ?? null;
  const averageCompletion =
    studentCourseEntries.length > 0
      ? Math.round(
          studentCourseEntries.reduce(
            (total, course) => total + (course.progress?.completionRate ?? 0),
            0,
          ) / studentCourseEntries.length,
        )
      : 0;
  const primaryAction = primaryStudentCourse
    ? {
        label: "Continuar leccion",
        href: buildCourseContentHref(primaryStudentCourse.space.course.slug),
      }
    : primaryStaffCourse
      ? {
          label: "Abrir docencia",
          href: primaryStaffCourse.teachingHref,
        }
      : {
          label: "Explorar catalogo",
          href: "/cursos",
        };
  const navItems = [
    { label: "Mi cuenta", href: "/mi-cuenta" },
    { label: "Mis cursos", href: "/mis-cursos", active: true },
  ];
  const studentGridEntries = primaryStudentCourse
    ? studentCourseEntries.filter(
        ({ space }) =>
          space.course.slug !== primaryStudentCourse.space.course.slug,
      )
    : studentCourseEntries;
  const isTeacherOnlyView =
    studentSpaces.length === 0 && staffCourseEntries.length > 0;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#faf7f2_0%,#f5f7fa_48%,#fbf9f5_100%)] pb-20">
      <AccountAuthHeader
        fullName={user.name}
        initials={initials}
        navItems={navItems}
        roleLabel={roleLabel}
      />

      <div className="site-container pt-8">
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div>
            <SectionHeader
              description={
                isTeacherOnlyView
                  ? "Separamos tus cursos como alumno de tus asignaciones docentes para que cada acceso tenga contexto y no haya mensajes contradictorios."
                  : "Retoma la leccion correcta, abre tareas pendientes y revisa tus accesos activos desde un area privada mas clara y continua."
              }
              eyebrow="Area privada"
              title="Mis cursos"
            />

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={primaryAction.href}>
                {primaryAction.label}
              </ButtonLink>
              <ButtonLink href="/mi-cuenta" variant="neutral">
                Volver a mi cuenta
              </ButtonLink>
            </div>

            {primaryStudentCourse ? (
              <SurfaceCard className="mt-8" padding="md" variant="muted">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">Leccion a continuar</Badge>
                  <Badge tone="outline">
                    {primaryStudentCourse.space.course.level}
                  </Badge>
                </div>

                <h2 className="font-premium mt-4 text-display-md font-semibold text-[var(--color-ink)]">
                  {primaryStudentCourse.space.course.title}
                </h2>
                <p className="mt-3 max-w-3xl text-body-md text-[var(--color-ink-soft)]">
                  {primaryStudentCourse.progress
                    ? `${primaryStudentCourse.progress.completedModules} de ${primaryStudentCourse.progress.totalModules} modulos revisados y ${primaryStudentCourse.progress.pendingModules} pendientes.`
                    : "Curso listo para empezar en el campus."}
                </p>
              </SurfaceCard>
            ) : isTeacherOnlyView && primaryStaffCourse ? (
              <SurfaceCard className="mt-8" padding="md" variant="muted">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">Docencia activa</Badge>
                  <Badge tone="outline">Sin cursos como alumno</Badge>
                </div>

                <h2 className="font-premium mt-4 text-display-md font-semibold text-[var(--color-ink)]">
                  {primaryStaffCourse.space.course.title}
                </h2>
                <p className="mt-3 max-w-3xl text-body-md text-[var(--color-ink-soft)]">
                  Tienes cursos asignados como docente. Abre la operativa del
                  curso desde aqui o entra en la seccion docente para ver el
                  resto de asignaciones.
                </p>
              </SurfaceCard>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <MetricPanel
              detail="Matriculas activas listas para continuar."
              label="Como alumno"
              tone="brand"
              value={studentSpaces.length}
            />
            <MetricPanel
              detail="Resumen agregado de tus cursos como alumno."
              label="Progreso medio"
              value={`${averageCompletion}%`}
            />
            <MetricPanel
              detail="Cursos con acceso operativo y de seguimiento."
              label="Como docente"
              value={staffSpaces.length}
            />
          </div>
        </section>

        {primaryStudentCourse ? (
          <section className="mt-10">
            <article className="overflow-hidden" role="presentation">
              <Card className="overflow-hidden p-0" variant="elevated">
                <div className="grid gap-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
                  <div className="bg-[var(--color-primary-strong)] p-4 lg:p-5">
                    <CourseArtwork
                      className="h-full min-h-[15rem] w-full rounded-[var(--radius-lg)] border-0"
                      course={primaryStudentCourse.space.course}
                      variant="hero"
                    />
                  </div>

                  <div className="flex flex-col justify-between p-6 lg:p-7">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
                      <div>
                        <p className="text-meta-xs font-semibold text-[var(--color-primary)]">
                          Continuar aprendizaje
                        </p>
                        <h2 className="font-premium mt-3 text-display-md font-semibold text-[var(--color-ink)]">
                          {primaryStudentCourse.space.course.title}
                        </h2>
                        <p className="mt-3 text-body-md text-[var(--color-muted)]">
                          {primaryStudentCourse.progress?.lastCompletedAt
                            ? `Ultima actividad ${formatRelativeTime(primaryStudentCourse.progress.lastCompletedAt)}.`
                            : "Aun no hay actividad registrada en este curso."}
                        </p>
                      </div>

                      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] p-4">
                        <p className="text-meta-xs font-semibold text-[var(--color-muted)]">
                          Progreso
                        </p>
                        <p className="mt-3 text-heading-lg font-semibold text-[var(--color-ink)]">
                          {primaryStudentCourse.progress?.completionRate ?? 0}%
                          completado
                        </p>
                        <p className="mt-2 text-body-sm text-[var(--color-muted)]">
                          {primaryStudentCourse.progress?.pendingModules ?? 0}{" "}
                          modulos pendientes.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface)]">
                        <div
                          aria-hidden="true"
                          className="h-full rounded-full bg-[var(--color-primary)]"
                          style={{
                            width: `${primaryStudentCourse.progress?.completionRate ?? 0}%`,
                          }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <ButtonLink
                          href={buildCourseContentHref(
                            primaryStudentCourse.space.course.slug,
                          )}
                        >
                          Continuar leccion
                        </ButtonLink>
                        <ButtonLink
                          href={buildCourseResourcesHref(
                            primaryStudentCourse.space.course.slug,
                          )}
                          variant="neutral"
                        >
                          Ver tareas
                        </ButtonLink>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </article>
          </section>
        ) : null}

        {studentSpaces.length ? (
          <section aria-labelledby="student-courses-heading" className="mt-14">
            <SectionHeader
              actions={
                <ButtonLink href="/mi-cuenta" variant="ghost">
                  Ver resumen de cuenta
                </ButtonLink>
              }
              description="Todos tus recorridos activos, con prioridad clara sobre lo que debes retomar."
              eyebrow="Aprendizaje"
              title="Como alumno"
            />

            <div
              className="mt-8 grid gap-5 lg:grid-cols-2"
              id="student-courses-heading"
            >
              {studentGridEntries.length ? (
                studentGridEntries.map(({ space, progress }) => {
                  const completion = progress?.completionRate ?? 0;

                  return (
                    <article key={space.course.slug}>
                      <Card className="overflow-hidden p-0" variant="elevated">
                        <div className="grid gap-0 sm:grid-cols-[10rem_1fr]">
                          <CourseArtwork
                            className="h-full min-h-[9rem] w-full sm:min-h-full"
                            course={space.course}
                            variant="card"
                          />

                          <div className="flex flex-col p-5 lg:p-6">
                            <p className="text-label-sm font-medium text-[var(--color-muted)]">
                              {space.course.activeEdition?.label ??
                                "Matricula activa"}
                            </p>
                            <h3 className="font-premium mt-2 text-heading-lg font-semibold text-[var(--color-ink)]">
                              {space.course.title}
                            </h3>
                            <p className="mt-2 text-body-sm text-[var(--color-muted)]">
                              Progreso: {Math.round(completion)}% ·{" "}
                              {progress?.completedModules ?? 0}/
                              {progress?.totalModules ?? 0} modulos
                            </p>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
                              <div
                                className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                                style={{ width: `${Math.round(completion)}%` }}
                              />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                              <span>
                                {progress?.pendingModules ?? 0} modulos
                                pendientes
                              </span>
                              <span>
                                {progress?.lastCompletedAt
                                  ? `Actividad ${formatRelativeTime(progress.lastCompletedAt)}`
                                  : "Sin actividad registrada"}
                              </span>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                              <ButtonLink
                                href={buildCourseContentHref(space.course.slug)}
                              >
                                {completion > 0
                                  ? "Continuar leccion"
                                  : "Abrir leccion"}
                              </ButtonLink>
                              <ButtonLink
                                href={buildCourseResourcesHref(
                                  space.course.slug,
                                )}
                                variant="neutral"
                              >
                                Ver tareas
                              </ButtonLink>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </article>
                  );
                })
              ) : primaryStudentCourse ? (
                <Card className="p-7 lg:col-span-2" variant="muted">
                  <p className="text-heading-md font-semibold text-[var(--color-ink)]">
                    Este curso ya esta destacado arriba como acceso principal.
                  </p>
                  <p className="mt-2 text-body-sm text-[var(--color-muted)]">
                    Cuando tengas mas matriculas activas, apareceran aqui con
                    progreso, actividad y accesos directos adicionales.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonLink
                      href={buildCourseContentHref(
                        primaryStudentCourse.space.course.slug,
                      )}
                    >
                      Continuar leccion
                    </ButtonLink>
                    <ButtonLink
                      href={buildCourseResourcesHref(
                        primaryStudentCourse.space.course.slug,
                      )}
                      variant="neutral"
                    >
                      Ver tareas
                    </ButtonLink>
                  </div>
                </Card>
              ) : null}
            </div>
          </section>
        ) : staffCourseEntries.length ? (
          <section aria-labelledby="student-courses-heading" className="mt-14">
            <SectionHeader
              actions={
                <ButtonLink href="/cursos" variant="ghost">
                  Ver catalogo
                </ButtonLink>
              }
              description="Tus cursos asignados como docente aparecen separados justo debajo para que el recorrido no mezcle aprendizaje y operativa."
              eyebrow="Aprendizaje"
              title="Como alumno"
            />

            <EmptyState
              action={<ButtonLink href="/cursos">Ver catalogo</ButtonLink>}
              align="center"
              className="mt-8"
              description="Cuando te matricules en un curso, aparecera aqui sin mezclarse con tu espacio docente."
              title="No tienes cursos activos como alumno"
            />
          </section>
        ) : (
          <EmptyState
            action={<ButtonLink href="/cursos">Ver catalogo</ButtonLink>}
            align="center"
            className="mt-12"
            description="Explora el catalogo para inscribirte y activar tu siguiente recorrido."
            title="Todavia no tienes cursos activos"
          />
        )}

        {staffSpaces.length ? (
          <section aria-labelledby="staff-courses-heading" className="mt-14">
            <SectionHeader
              actions={
                <ButtonLink href="/mi-cuenta" variant="subtle">
                  Abrir panel docente
                </ButtonLink>
              }
              description="Accesos operativos separados del recorrido de alumno para abrir campus, seguimiento y foro con el contexto correcto."
              eyebrow="Docencia"
              id="staff-courses-heading"
              title="Cursos asignados como docente"
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {staffCourseEntries.map(
                ({ space, showTrackingNav, teachingHref }) => (
                  <Card
                    className="p-5"
                    key={space.course.slug}
                    variant="elevated"
                  >
                    <div className="flex h-full flex-col gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="info">Docencia</Badge>
                          <Badge tone="outline">
                            {showTrackingNav
                              ? "Seguimiento operativo"
                              : "Campus docente"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-xs font-medium text-[var(--color-muted)]">
                          {space.course.activeEdition?.label ??
                            "Curso asignado"}
                        </p>
                        <p className="mt-2 font-semibold text-[var(--color-ink)]">
                          {space.course.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          {showTrackingNav
                            ? "Abre seguimiento para revisar alumnado y usa campus o foro sin salir del mismo curso."
                            : "Abre el campus docente del curso y manten el acceso operativo separado del area de alumno."}
                        </p>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-3">
                        <ButtonLink href={teachingHref}>
                          {showTrackingNav ? "Abrir docencia" : "Abrir campus"}
                        </ButtonLink>
                        {showTrackingNav ? (
                          <ButtonLink
                            href={buildCourseContentHref(space.course.slug)}
                            variant="neutral"
                          >
                            Abrir campus
                          </ButtonLink>
                        ) : null}
                        <ButtonLink
                          href={buildCourseForumHref(space.course.slug)}
                          variant="ghost"
                        >
                          Abrir foro
                        </ButtonLink>
                      </div>
                    </div>
                  </Card>
                ),
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
