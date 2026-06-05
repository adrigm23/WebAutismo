import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Pencil,
  Settings2,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunityForCourse, canModerateCourse } from "@/lib/course-community";
import { getDb } from "@/lib/prisma";
import { TeacherShell } from "@/components/docente/teacher-shell";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime, formatRelativeTime, getInitials } from "@/lib/utils";

type Props = { params: Promise<{ slug: string; resourceId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resourceId } = await params;
  const resource = await getDb().courseResource.findUnique({
    where: { id: resourceId },
    select: { title: true },
  });
  return {
    title: resource ? `${resource.title} — Entregas` : "Entregas",
    robots: { index: false, follow: false },
  };
}

export default async function TeacherEntregasPage({ params }: Props) {
  const { slug, resourceId } = await params;
  const user = await requireUser(`/docente/cursos/${slug}/entregas/${resourceId}`);

  const course = await getCatalogCourseBySlug(slug);
  if (!course) notFound();

  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });
  if (!access.allowed || !canModerateCourse(access.role)) redirect("/mis-cursos");

  const resource = await getDb().courseResource.findUnique({
    where: { id: resourceId, courseId: course.id },
    include: {
      submissions: {
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!resource) notFound();

  const totalCount = resource.submissions.length;
  const pendingCount = resource.submissions.filter((s) => s.status === "SUBMITTED").length;
  const reviewedCount = resource.submissions.filter(
    (s) => s.status === "REVIEWED" || s.status === "CHANGES_REQUESTED",
  ).length;

  const viewerName = user.name ?? user.email;

  return (
    <TeacherShell
      viewerName={viewerName}
      viewerInitials={getInitials(viewerName)}
      roleLabel="Docente"
    >
      <div className="site-container py-6 sm:py-8 pb-20">

        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
          <Link href="/docente/cursos" className="transition hover:text-[var(--color-primary)]">
            Mis cursos
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/docente/cursos/${slug}`}
            className="transition hover:text-[var(--color-primary)]"
          >
            {course.title}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[var(--color-ink-soft)]">{resource.title}</span>
        </nav>

        {/* Header card */}
        <div className="mt-4 rounded-xl border border-[rgba(22,60,88,0.09)] bg-white p-6 shadow-[var(--shadow-xs)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="outline">ACTIVIDAD EVALUADA</Badge>
                {resource.dueAt && (
                  <span className="flex items-center gap-1 text-sm text-[var(--color-ink-muted)]">
                    <Clock className="h-3.5 w-3.5" />
                    Vence: {formatDateTime(resource.dueAt)}
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-premium text-display-sm font-semibold text-[var(--color-ink)]">
                {resource.title}
              </h1>
              {resource.description && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">
                  {resource.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
              <a
                href={`/api/docente/export-submissions/${resourceId}`}
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.18)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </a>
              <button
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.18)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink-muted)] opacity-50"
              >
                <Settings2 className="h-4 w-4" />
                Configurar rúbrica
              </button>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.09)] bg-[rgba(248,246,241,0.8)] px-5 py-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-ink)]">{totalCount}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">Total Entregas</p>
            </div>
            <div
              className={cn(
                "rounded-[var(--radius-md)] border px-5 py-3 text-center",
                pendingCount > 0
                  ? "border-[rgba(209,88,62,0.25)] bg-[rgba(252,238,233,0.8)]"
                  : "border-[rgba(22,60,88,0.09)] bg-[rgba(248,246,241,0.8)]",
              )}
            >
              <p
                className={cn(
                  "text-2xl font-bold",
                  pendingCount > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-ink)]",
                )}
              >
                {pendingCount}
              </p>
              <p
                className={cn(
                  "text-xs",
                  pendingCount > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-ink-muted)]",
                )}
              >
                Pendientes
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[rgba(23,98,79,0.2)] bg-[var(--color-success-soft)] px-5 py-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-success)]">{reviewedCount}</p>
              <p className="text-xs text-[var(--color-success)]">Calificadas</p>
            </div>
          </div>
        </div>

        {/* Listado de entregas */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-ink)]">Listado de Entregas</h2>
          </div>

          {resource.submissions.length > 0 ? (
            <div className="space-y-3">
              {resource.submissions.map((submission) => {
                const isPending = submission.status === "SUBMITTED";
                const isReviewed = submission.status === "REVIEWED";
                const isChangesRequested = submission.status === "CHANGES_REQUESTED";
                const hasFile = !!submission.storageKey;
                const reviewUrl = `/docente/tareas/revision/${submission.id}`;
                const inlineUrl = hasFile
                  ? `/api/course-resource-submissions/${submission.id}?inline=1`
                  : null;

                return (
                  <div
                    key={submission.id}
                    className="flex flex-col gap-4 rounded-xl border border-[rgba(22,60,88,0.09)] bg-white px-5 py-4 shadow-[var(--shadow-xs)] sm:flex-row sm:items-center"
                  >
                    {/* Avatar + nombre */}
                    <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white">
                        {getInitials(submission.student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                          {submission.student.name}
                        </p>
                        <p className="truncate text-xs text-[var(--color-ink-muted)]">
                          {submission.student.email}
                        </p>
                      </div>
                    </div>

                    {/* Estado y tiempo */}
                    <div className="flex-1">
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(159,69,46,0.1)] px-2.5 py-1 text-xs font-semibold text-[var(--color-danger)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
                          Pendiente de revisión
                        </span>
                      )}
                      {isReviewed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-success)]">
                          <CheckCircle2 className="h-3 w-3" />
                          Calificado{submission.score !== null ? `: ${submission.score}/10` : ""}
                        </span>
                      )}
                      {isChangesRequested && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                          Calificado{submission.score !== null ? `: ${submission.score}/10` : ""}{" "}
                          (Rehacer)
                        </span>
                      )}
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
                        <Clock className="h-3 w-3" />
                        {isPending
                          ? `Recibido ${formatRelativeTime(submission.submittedAt)}`
                          : `Revisado ${submission.reviewedAt ? formatRelativeTime(submission.reviewedAt) : ""}`}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 sm:shrink-0">
                      {hasFile && inlineUrl && (
                        <a
                          href={inlineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.18)] px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Ver documento
                        </a>
                      )}
                      {isPending && (
                        <Link
                          href={reviewUrl}
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                          Revisar
                        </Link>
                      )}
                      {(isReviewed || isChangesRequested) && (
                        <Link
                          href={reviewUrl}
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.18)] px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modificar
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/60 px-6 py-10 text-center">
              <p className="font-semibold text-[var(--color-ink)]">Todavía no hay entregas</p>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                Las entregas de los alumnos aparecerán aquí cuando las envíen.
              </p>
            </div>
          )}
        </div>
      </div>
    </TeacherShell>
  );
}
