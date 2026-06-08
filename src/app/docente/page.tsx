import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, GraduationCap, Users, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import { isStaffCourseRole } from "@/lib/course-roles";
import { getTeacherDashboardCourseSummaries, getDashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { MetricPanel } from "@/components/ui/metric-panel";
import { TeacherShell } from "@/components/docente/teacher-shell";
import { getInitials, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard Docente",
  robots: { index: false, follow: false },
};

export default async function DocenteDashboardPage() {
  const user = await requireUser("/docente");
  if (user.globalRole !== "TEACHER" && user.globalRole !== "ADMIN") {
    redirect("/mis-cursos");
  }

  const spaces = await getUserCourseSpaces({
    userId: user.id,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });
  const staffSpaces = spaces.filter((s) => isStaffCourseRole(s.role));
  const courseSlugs = staffSpaces.map((s) => s.course.slug);

  const [teacherSummaries, notificationSnapshot] = await Promise.all([
    getTeacherDashboardCourseSummaries({ spaces: staffSpaces, learnerSummariesByCourse: new Map() }),
    getDashboardNotificationSnapshot({ userId: user.id, courseSlugs }),
  ]);

  const totalPendingReviews = teacherSummaries.reduce((sum, s) => sum + s.pendingReviewItems.length, 0);
  const totalLearners = teacherSummaries.reduce((sum, s) => sum + s.learnerCount, 0);
  const firstName = user.name.split(" ")[0] || user.name;
  const viewerName = user.name ?? user.email;

  // Collect all pending review items across summaries
  const allPendingItems = teacherSummaries.flatMap((s) => s.pendingReviewItems).slice(0, 5);

  return (
    <TeacherShell
      viewerName={viewerName}
      viewerInitials={getInitials(viewerName)}
      roleLabel="Docente"
      notificationsCount={notificationSnapshot.unreadCount}
    >
      <div className="px-5 sm:px-8 xl:px-10 py-8 sm:py-10 pb-12">

        {/* Header */}
        <section>
          <h1 className="font-premium text-display-lg font-semibold text-[var(--color-ink)]">
            Bienvenido, {firstName}.
          </h1>
          <p className="mt-2 text-body-md text-[var(--color-ink-soft)]">
            Tienes {staffSpaces.length} curso{staffSpaces.length !== 1 ? "s" : ""} asignado{staffSpaces.length !== 1 ? "s" : ""}
            {totalPendingReviews > 0 ? ` y ${totalPendingReviews} entrega${totalPendingReviews !== 1 ? "s" : ""} pendiente${totalPendingReviews !== 1 ? "s" : ""} de revisión.` : "."}
          </p>
        </section>

        {/* Métricas rápidas */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricPanel
            label="Cursos"
            value={staffSpaces.length}
            detail="Cursos asignados"
            icon={<GraduationCap className="h-5 w-5" strokeWidth={1.8} />}
          />
          <MetricPanel
            label="Revisiones"
            value={totalPendingReviews}
            detail="Pendientes de revisión"
            icon={<ClipboardList className="h-5 w-5" strokeWidth={1.8} />}
            tone={totalPendingReviews > 0 ? "warning" : "default"}
          />
          <MetricPanel
            label="Alumnos"
            value={totalLearners}
            detail="Alumnos activos"
            icon={<Users className="h-5 w-5" strokeWidth={1.8} />}
            tone="brand"
          />
        </section>

        {/* Revisiones urgentes */}
        {totalPendingReviews > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-[var(--color-ink)]">Revisiones pendientes</h2>
            <div className="mt-4 space-y-2">
              {allPendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning-soft)]">
                      <ClipboardList className="h-3.5 w-3.5 text-[var(--color-warning)]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                        {item.learnerName}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {item.resourceTitle} · {item.courseTitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(item.submittedAt)}
                    </span>
                    <ButtonLink href={item.href} variant="primary" size="sm">
                      Revisar
                    </ButtonLink>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Grid de cursos */}
        {staffSpaces.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--color-ink)]">Mis cursos</h2>
              <Link
                href="/docente/cursos"
                className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:opacity-75"
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {teacherSummaries.map((summary) => {
                const course = summary.space.course;
                return (
                  <article
                    key={course.slug}
                    className="overflow-hidden rounded-xl border border-[rgba(22,60,88,0.09)] bg-white shadow-[var(--shadow-soft)]"
                  >
                    <CourseArtwork
                      course={course}
                      className="h-32 w-full rounded-none border-0"
                    />
                    <div className="p-5">
                      <div className="flex flex-wrap items-start gap-2">
                        <h3 className="flex-1 text-base font-bold text-[var(--color-ink)]">
                          {course.title}
                        </h3>
                        <Badge tone={course.activeEdition?.status === "ACTIVE" ? "success" : "outline"}>
                          {course.activeEdition?.status === "ACTIVE" ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--color-ink-soft)]">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {summary.learnerCount} alumno{summary.learnerCount !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" />
                          {summary.pendingReviewItems.length} pendiente{summary.pendingReviewItems.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <ButtonLink href={`/docente/cursos/${course.slug}`} variant="primary" size="sm">
                          Gestionar
                        </ButtonLink>
                        <ButtonLink href={`/mis-cursos/${course.slug}/seguimiento`} variant="neutral" size="sm">
                          Seguimiento
                        </ButtonLink>
                        <ButtonLink href={`/docente/cursos/${course.slug}/constructor`} variant="subtle" size="sm">
                          Constructor
                        </ButtonLink>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mt-10">
            <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white px-8 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)]">
                <BookOpen className="h-8 w-8 text-[var(--color-primary)]" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-[var(--color-ink)]">Aún no tienes cursos asignados</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-ink-soft)]">
                El administrador debe asignarte a un curso para que puedas gestionarlo y añadir contenido.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <ButtonLink href="/mensajes" variant="primary">
                  Enviar mensaje al admin
                </ButtonLink>
                <a
                  href="mailto:formacion@autismocordoba.org"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  Contactar por email
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </TeacherShell>
  );
}
