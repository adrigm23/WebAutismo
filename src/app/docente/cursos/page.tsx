import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen, ClipboardList, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import { isStaffCourseRole } from "@/lib/course-roles";
import { getTeacherDashboardCourseSummaries, getDashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { TeacherShell } from "@/components/docente/teacher-shell";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mis Cursos — Portal Docente",
  robots: { index: false, follow: false },
};

export default async function DocenteCursosPage() {
  const user = await requireUser("/docente/cursos");
  if (user.globalRole !== "TEACHER" && user.globalRole !== "ADMIN") {
    redirect("/mis-cursos");
  }

  // FIX #5: pasar email para resolver acceso por allowlist consistentemente con otras páginas
  const spaces = await getUserCourseSpaces({
    userId: user.id,
    email: user.email,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });
  const staffSpaces = spaces.filter((s) => isStaffCourseRole(s.role));
  const courseSlugs = staffSpaces.map((s) => s.course.slug);

  const [teacherSummaries, notificationSnapshot] = await Promise.all([
    getTeacherDashboardCourseSummaries({ spaces: staffSpaces, learnerSummariesByCourse: new Map() }),
    getDashboardNotificationSnapshot({ userId: user.id, courseSlugs }),
  ]);

  const viewerName = user.name ?? user.email;

  return (
    <TeacherShell
      viewerName={viewerName}
      viewerInitials={getInitials(viewerName)}
      roleLabel="Docente"
      notificationsCount={notificationSnapshot.unreadCount}
    >
      <div className="px-5 sm:px-8 xl:px-10 py-8 sm:py-10 pb-20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-premium text-display-md font-semibold text-[var(--color-ink)]">
              Mis cursos
            </h1>
            <p className="mt-1 text-body-md text-[var(--color-ink-soft)]">
              Gestiona tus cursos asignados.
            </p>
          </div>
          <Badge tone="outline">{staffSpaces.length} curso{staffSpaces.length !== 1 ? "s" : ""}</Badge>
        </div>

        {teacherSummaries.length > 0 ? (
          <div className="mt-8 space-y-5">
            {teacherSummaries.map((summary) => {
              const course = summary.space.course;
              return (
                <article
                  key={course.slug}
                  className="overflow-hidden rounded-xl border border-[rgba(22,60,88,0.09)] bg-white shadow-[var(--shadow-soft)]"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Artwork */}
                    <div className="sm:h-auto sm:w-52 sm:shrink-0">
                      <CourseArtwork
                        course={course}
                        className="h-36 w-full rounded-none border-0 sm:h-full sm:rounded-none"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <div>
                        <div className="flex flex-wrap items-start gap-2">
                          <h2 className="flex-1 text-lg font-bold text-[var(--color-ink)]">
                            {course.title}
                          </h2>
                          <Badge tone={course.activeEdition?.status === "ACTIVE" ? "success" : "outline"}>
                            {course.activeEdition?.status === "ACTIVE" ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        {course.activeEdition && (
                          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                            {course.activeEdition.label}
                          </p>
                        )}
                      </div>

                      {/* Métricas */}
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--color-ink-soft)]">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {summary.learnerCount} alumno{summary.learnerCount !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          {summary.managedResourceCount} recurso{summary.managedResourceCount !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ClipboardList className="h-4 w-4" />
                          {summary.pendingReviewItems.length} pendiente{summary.pendingReviewItems.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Botones */}
                      <div className="flex flex-wrap gap-2">
                        <ButtonLink href={`/docente/cursos/${course.slug}`} variant="primary" size="sm">
                          Gestionar
                        </ButtonLink>
                        <ButtonLink href={`/mis-cursos/${course.slug}/seguimiento`} variant="neutral" size="sm">
                          Seguimiento
                        </ButtonLink>
                        <ButtonLink href={`/docente/cursos/${course.slug}/constructor`} variant="neutral" size="sm">
                          Constructor
                        </ButtonLink>
                        <ButtonLink href={`/mis-cursos/${course.slug}/recursos`} variant="subtle" size="sm">
                          Recursos
                        </ButtonLink>
                        <ButtonLink href={`/mis-cursos/${course.slug}/foro`} variant="subtle" size="sm">
                          Comunidad
                        </ButtonLink>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/60 px-6 py-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-[var(--color-primary)] opacity-40" />
            <p className="mt-4 font-semibold text-[var(--color-ink)]">No tienes cursos asignados</p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Contacta con el administrador para que te asigne cursos.
            </p>
          </div>
        )}
      </div>
    </TeacherShell>
  );
}
