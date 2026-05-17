import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import { buildCourseContentHref } from "@/lib/course-navigation";
import { getCourseProgressDetailsMapForUser } from "@/lib/course-progress";
import { isStaffCourseRole } from "@/lib/course-roles";

export const metadata: Metadata = {
  title: "Mis cursos",
  robots: {
    index: false,
    follow: false
  }
};

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

  return (
    <div className="pb-20 pt-10">
      <div className="site-container">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Área privada
          </p>
          <h1 className="mt-3 text-display-lg font-semibold text-[var(--color-ink)]">Mis cursos</h1>
          <p className="mt-4 text-body-lg text-[var(--color-muted)]">
            Accede al campus de cada matrícula activa. El progreso y las tareas se gestionan desde el
            espacio de aprendizaje de cada curso.
          </p>
        </header>

        {studentSpaces.length ? (
          <section aria-labelledby="student-courses-heading" className="mt-12">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]" id="student-courses-heading">
              Como alumno
            </h2>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {studentSpaces.map((space) => {
                const progress = progressByCourse.get(space.course.slug);
                const completion = progress?.completionRate ?? 0;

                return (
                  <article
                    className="surface-card overflow-hidden rounded-2xl border border-[rgba(12,113,195,0.12)] bg-white shadow-[var(--shadow-soft)]"
                    key={space.course.slug}
                  >
                    <div className="grid gap-0 sm:grid-cols-[10rem_1fr]">
                      <CourseArtwork className="h-full min-h-[8rem] w-full sm:min-h-full" course={space.course} variant="card" />
                      <div className="flex flex-col p-5">
                        <p className="text-xs font-medium text-[var(--color-muted)]">
                          {space.course.activeEdition?.label ?? "Matrícula activa"}
                        </p>
                        <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                          {space.course.title}
                        </h3>
                        <p className="mt-2 text-sm text-[var(--color-muted)]">
                          Progreso: {Math.round(completion)}% ·{" "}
                          {progress?.completedModules ?? 0}/{progress?.totalModules ?? 0} módulos
                        </p>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                            style={{ width: `${Math.round(completion)}%` }}
                          />
                        </div>
                        <Link
                          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]"
                          href={buildCourseContentHref(space.course.slug)}
                        >
                          Entrar al campus
                          <ArrowRight aria-hidden className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-[rgba(12,113,195,0.2)] bg-white p-8 text-center">
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
            <h2 className="text-lg font-semibold text-[var(--color-ink)]" id="staff-courses-heading">
              Como docente
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {staffSpaces.map((space) => (
                <Link
                  className="surface-card rounded-2xl border border-[rgba(12,113,195,0.12)] bg-white p-5 transition hover:border-[var(--color-primary)]"
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
