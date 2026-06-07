import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Edit2,
  FileText,
  Link2,
  MessageSquareText,
  Play,
  Plus,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunityForCourse, canModerateCourse, getRoleLabel } from "@/lib/course-community";
import { getCampusResources } from "@/lib/course-resources";
import { getLearnerProgressRowsForCatalogCourse, type CourseLearnerProgressRow } from "@/lib/course-progress";
import { getDashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { getDb } from "@/lib/prisma";
import { TeacherShell } from "@/components/docente/teacher-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

import { cn, formatRelativeTime, formatDateTime, getInitials } from "@/lib/utils";
import type { CatalogCourse, CatalogCourseModule } from "@/lib/course-catalog";
import type { CampusResourceItem, CampusResourceSubmissionItem } from "@/lib/course-resources";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);
  return {
    title: course ? `${course.title} — Portal Docente` : "Portal Docente",
    robots: { index: false, follow: false },
  };
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ContenidoTab({
  course,
  resourcesByModuleId,
  courseSlug,
}: {
  course: CatalogCourse;
  resourcesByModuleId: Map<string | null, CampusResourceItem[]>;
  courseSlug: string;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Contenido del Curso</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Gestiona los módulos, lecciones y actividades.
          </p>
        </div>
        <ButtonLink href={`/docente/cursos/${courseSlug}/constructor`} variant="primary">
          <Plus className="h-4 w-4" />
          Nuevo Módulo
        </ButtonLink>
      </div>

      <div className="space-y-4">
        {course.modules.map((module: CatalogCourseModule, idx: number) => {
          const moduleResources = resourcesByModuleId.get(module.id) ?? [];
          const exercises = moduleResources.filter((r) => r.isExercise);
          const pendingSubmissions = exercises.reduce(
            (s, r) => s + r.submissions.filter((sub) => sub.status === "SUBMITTED").length,
            0,
          );

          return (
            <div
              key={module.id}
              className="overflow-hidden rounded-xl border border-[rgba(22,60,88,0.09)] bg-white shadow-[var(--shadow-xs)]"
            >
              {/* Module header */}
              <div className="flex items-center gap-4 border-b border-[rgba(22,60,88,0.06)] px-5 py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-[var(--color-ink)]">{module.title}</h3>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                    {moduleResources.length} elemento{moduleResources.length !== 1 ? "s" : ""}
                    {module.estimatedTime ? ` · ${module.estimatedTime}` : ""}
                    {pendingSubmissions > 0 && (
                      <span className="ml-2 font-semibold text-[var(--color-danger)]">
                        · {pendingSubmissions} pendiente{pendingSubmissions !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/docente/cursos/${courseSlug}/constructor`}
                  className="rounded p-1 text-[var(--color-ink-soft)] transition hover:text-[var(--color-primary)]"
                  title="Editar módulo"
                >
                  <Edit2 className="h-4 w-4" />
                </Link>
              </div>

              {/* Resources list */}
              {moduleResources.length > 0 && (
                <div className="divide-y divide-[rgba(22,60,88,0.05)]">
                  {moduleResources.map((resource) => {
                    const resourceSubmissions = resource.submissions ?? [];
                    const pendingForResource = resourceSubmissions.filter(
                      (s) => s.status === "SUBMITTED",
                    ).length;

                    return (
                      <div key={resource.id} className="flex items-start gap-3 px-5 py-3.5">
                        <div
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                            resource.isExercise
                              ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                              : "bg-[var(--color-brand-soft)] text-[var(--color-primary)]",
                          )}
                        >
                          {resource.isExercise ? (
                            <ClipboardList className="h-3.5 w-3.5" />
                          ) : resource.mimeType?.startsWith("video/") ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : resource.mimeType === "application/pdf" ? (
                            <FileText className="h-3.5 w-3.5" />
                          ) : resource.linkUrl ? (
                            <Link2 className="h-3.5 w-3.5" />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              resource.isExercise ? "text-[var(--color-primary)]" : "text-[var(--color-ink)]",
                            )}
                          >
                            {resource.isExercise ? "Actividad: " : ""}
                            {resource.title}
                          </p>

                          {resource.isExercise && resourceSubmissions.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
                                <CheckCircle2 className="h-3 w-3 text-[var(--color-success)]" />
                                {resourceSubmissions.length} entrega{resourceSubmissions.length !== 1 ? "s" : ""}
                              </span>
                              {pendingForResource > 0 && (
                                <span className="flex items-center gap-1 text-xs text-[var(--color-danger)]">
                                  <ClipboardList className="h-3 w-3" />
                                  {pendingForResource} pendiente{pendingForResource !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          )}

                          {resource.isExercise && (
                            <div className="mt-2 flex items-center gap-2">
                              {resourceSubmissions.length > 0 && (
                                <Link
                                  href={`/docente/cursos/${courseSlug}/entregas/${resource.id}`}
                                  className="inline-flex items-center rounded-lg border border-[rgba(22,60,88,0.18)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                >
                                  Ver entregas
                                </Link>
                              )}
                              <Link
                                href={`/docente/cursos/${courseSlug}/constructor`}
                                className="inline-flex items-center rounded-lg border border-[rgba(22,60,88,0.18)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                              >
                                Editar
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add element footer */}
              <div className="border-t border-[rgba(22,60,88,0.06)] px-5 py-3">
                <Link
                  href={`/docente/cursos/${courseSlug}/nuevo-recurso?moduleId=${module.id}&back=/docente/cursos/${courseSlug}`}
                  className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] transition hover:text-[var(--color-primary)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Añadir elemento
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {course.modules.length === 0 && (
        <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/60 px-6 py-10 text-center">
          <p className="font-semibold text-[var(--color-ink)]">El curso no tiene módulos todavía</p>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Usa el constructor para añadir el primer módulo.
          </p>
          <div className="mt-4">
            <ButtonLink href={`/docente/cursos/${courseSlug}/constructor`}>
              Abrir constructor
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}

function getStudentStatus(
  row: CourseLearnerProgressRow,
  lastSubmissionAt: Date | null,
): "al-dia" | "en-riesgo" | "sin-actividad" {
  const lastActivity = [row.lastCompletedAt, lastSubmissionAt]
    .filter((d): d is Date => d !== null)
    .reduce<Date | null>((latest, date) => {
      if (!latest || date > latest) return date;
      return latest;
    }, null);

  const daysSinceActivity = lastActivity
    ? (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  if (daysSinceActivity <= 7) return "al-dia";
  if (daysSinceActivity > 14 && row.completionRate < 30) return "en-riesgo";
  return "sin-actividad";
}

function AlumnosTab({
  progressRows,
  allSubmissions,
  courseSlug,
}: {
  progressRows: CourseLearnerProgressRow[];
  allSubmissions: CampusResourceSubmissionItem[];
  courseSlug: string;
}) {
  const lastSubmissionByUser = new Map<string, Date>();
  for (const submission of allSubmissions) {
    const current = lastSubmissionByUser.get(submission.studentId);
    const candidate = submission.reviewedAt ?? submission.submittedAt;
    if (!current || candidate > current) {
      lastSubmissionByUser.set(submission.studentId, candidate);
    }
  }

  const lastActivityByUser = new Map<string, { text: string; date: Date }>();
  const sortedSubs = [...allSubmissions].sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
  );
  for (const sub of sortedSubs) {
    if (!lastActivityByUser.has(sub.studentId)) {
      lastActivityByUser.set(sub.studentId, {
        text: sub.status === "REVIEWED" ? "Entrega revisada" : "Entregó actividad",
        date: sub.submittedAt,
      });
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Alumnos Inscritos</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Gestiona el progreso y la participación de los estudiantes.
          </p>
        </div>
        <a
          href={`/api/docente/export-students/${courseSlug}`}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.18)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </a>
      </div>

      {progressRows.length > 0 ? (
        <div className="space-y-3">
          {progressRows.map((row) => {
            const lastSub = lastSubmissionByUser.get(row.userId) ?? null;
            const status = getStudentStatus(row, lastSub);
            const lastActivity = lastActivityByUser.get(row.userId);

            return (
              <div
                key={row.userId}
                className="flex flex-col gap-4 rounded-xl border border-[rgba(22,60,88,0.09)] bg-white px-5 py-4 shadow-[var(--shadow-xs)] sm:flex-row sm:items-center"
              >
                {/* Avatar */}
                <div className="flex items-center gap-3 sm:w-52 sm:shrink-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white">
                    {getInitials(row.learnerName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                      {row.learnerName}
                    </p>
                    <p className="truncate text-xs text-[var(--color-ink-muted)]">
                      {row.learnerEmail}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--color-ink-soft)]">Progreso global</span>
                    <span
                      className={cn(
                        "font-semibold",
                        row.completionRate >= 70
                          ? "text-[var(--color-success)]"
                          : row.completionRate >= 30
                            ? "text-[var(--color-warning)]"
                            : "text-[var(--color-danger)]",
                      )}
                    >
                      {row.completionRate}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[rgba(22,60,88,0.08)]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        row.completionRate >= 70
                          ? "bg-[var(--color-success)]"
                          : row.completionRate >= 30
                            ? "bg-[var(--color-warning)]"
                            : "bg-[var(--color-danger)]",
                      )}
                      style={{ width: `${row.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Última actividad */}
                <div className="sm:w-52 sm:shrink-0">
                  {lastActivity ? (
                    <div>
                      <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                        Última actividad
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
                        {lastActivity.text}
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {formatRelativeTime(lastActivity.date)}
                      </p>
                    </div>
                  ) : row.lastCompletedAt ? (
                    <div>
                      <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                        Última actividad
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">Completó módulo</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {formatRelativeTime(row.lastCompletedAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--color-ink-muted)]">Sin actividad registrada</p>
                  )}
                </div>

                {/* Status badge */}
                <div className="sm:shrink-0">
                  {status === "al-dia" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-success)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                      Al día
                    </span>
                  )}
                  {status === "en-riesgo" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(159,69,46,0.12)] px-2.5 py-1 text-xs font-semibold text-[var(--color-danger)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
                      En riesgo
                    </span>
                  )}
                  {status === "sin-actividad" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(22,60,88,0.08)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-soft)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-soft)]" />
                      Sin actividad
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/60 px-6 py-10 text-center">
          <p className="font-semibold text-[var(--color-ink)]">No hay alumnos matriculados</p>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Cuando los alumnos se matriculen aparecerán aquí con su progreso.
          </p>
        </div>
      )}
    </div>
  );
}

function ComunidadTab({ courseSlug, courseTitle }: { courseSlug: string; courseTitle: string }) {
  return (
    <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white px-6 py-8 text-center">
      <MessageSquareText className="mx-auto h-10 w-10 text-[var(--color-primary)] opacity-60" />
      <h2 className="mt-4 text-lg font-semibold text-[var(--color-ink)]">Foro del curso</h2>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Accede al foro de {courseTitle} para gestionar las conversaciones y moderar el contenido.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink href={`/mis-cursos/${courseSlug}/foro`} variant="primary">
          Abrir foro
        </ButtonLink>
        <ButtonLink href={`/mis-cursos/${courseSlug}/foro/moderacion`} variant="neutral">
          Moderación
        </ButtonLink>
      </div>
    </div>
  );
}

function EstadisticasTab({
  progressRows,
  allSubmissions,
  totalModules,
}: {
  progressRows: CourseLearnerProgressRow[];
  allSubmissions: CampusResourceSubmissionItem[];
  totalModules: number;
}) {
  const totalAlumnos = progressRows.length;
  const avgCompletion =
    totalAlumnos > 0
      ? Math.round(progressRows.reduce((sum, r) => sum + r.completionRate, 0) / totalAlumnos)
      : 0;

  const distBuckets = { sin_iniciar: 0, iniciado: 0, avanzado: 0, completado: 0 };
  for (const r of progressRows) {
    if (r.completionRate === 0) distBuckets.sin_iniciar++;
    else if (r.completionRate < 50) distBuckets.iniciado++;
    else if (r.completionRate < 100) distBuckets.avanzado++;
    else distBuckets.completado++;
  }

  const atRisk = progressRows.filter((r) => r.completionRate === 0 && !r.lastCompletedAt).length;

  const pendingSubmissions = allSubmissions.filter((s) => s.status === "SUBMITTED").length;
  const reviewedSubmissions = allSubmissions.filter((s) => s.status === "REVIEWED").length;
  const changesRequested = allSubmissions.filter((s) => s.status === "CHANGES_REQUESTED").length;
  const totalSubmissions = allSubmissions.length;

  if (totalAlumnos === 0) {
    return (
      <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/60 px-6 py-12 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-[var(--color-ink-muted)] opacity-50" />
        <p className="mt-4 font-semibold text-[var(--color-ink)]">Sin datos todavía</p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Las estadísticas aparecerán cuando haya alumnos matriculados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Alumnos", value: totalAlumnos, sub: "matriculados" },
          { label: `${avgCompletion}%`, value: null, sub: "progreso medio" },
          { label: atRisk > 0 ? atRisk : "—", value: null, sub: "sin actividad" },
          { label: pendingSubmissions > 0 ? pendingSubmissions : "—", value: null, sub: "entregas pendientes" },
        ].map((kpi) => (
          <div
            key={kpi.sub}
            className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white px-5 py-4 shadow-[var(--shadow-xs)]"
          >
            <p className="text-2xl font-bold text-[var(--color-ink)]">
              {kpi.value !== null ? kpi.value : kpi.label}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribución de progreso */}
        <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white p-5 shadow-[var(--shadow-xs)]">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Distribución de progreso</h3>
          <div className="mt-4 space-y-3">
            {[
              { label: "Sin iniciar", count: distBuckets.sin_iniciar, color: "bg-[var(--color-border)]" },
              { label: "Iniciado (1–49%)", count: distBuckets.iniciado, color: "bg-[var(--color-warning)]" },
              { label: "Avanzado (50–99%)", count: distBuckets.avanzado, color: "bg-[var(--color-primary)]" },
              { label: "Completado (100%)", count: distBuckets.completado, color: "bg-[var(--color-success)]" },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
                  <span>{label}</span>
                  <span className="font-semibold">
                    {count} alumno{count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
                  <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: totalAlumnos > 0 ? `${(count / totalAlumnos) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de entregas */}
        <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white p-5 shadow-[var(--shadow-xs)]">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Estado de entregas</h3>
          {totalSubmissions === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-ink-muted)]">No hay entregas registradas.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {[
                { label: "Revisadas", count: reviewedSubmissions, color: "bg-[var(--color-success)]" },
                { label: "Pendientes de revisión", count: pendingSubmissions, color: "bg-[var(--color-warning)]" },
                { label: "Cambios solicitados", count: changesRequested, color: "bg-[var(--color-danger)]" },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
                    <span>{label}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: totalSubmissions > 0 ? `${(count / totalSubmissions) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-xs text-[var(--color-ink-muted)]">
                Total: {totalSubmissions} entrega{totalSubmissions !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function TeacherCourseWorkspacePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;
  const validTabs = ["contenido", "alumnos", "comunidad", "estadisticas"] as const;
  type Tab = (typeof validTabs)[number];
  const activeTab: Tab = validTabs.includes(rawTab as Tab) ? (rawTab as Tab) : "contenido";

  const course = await getCatalogCourseBySlug(slug);
  if (!course) notFound();

  const user = await requireUser(`/docente/cursos/${slug}`);
  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  if (!access.allowed || !canModerateCourse(access.role)) {
    redirect("/mis-cursos");
  }

  const campusResources = await getCampusResources({
    course,
    viewerUserId: user.id,
    canModerate: true,
  });

  let enrollments: Array<{
    userId: string;
    status: string;
    accessStartsAt: Date;
    accessUntil: Date | null;
    user: { id: string; name: string; email: string };
  }> = [];
  let progressRows: CourseLearnerProgressRow[] = [];

  if (activeTab === "alumnos" || activeTab === "estadisticas") {
    enrollments = await getDb().courseEnrollment.findMany({
      where: { course: { slug } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    progressRows = await getLearnerProgressRowsForCatalogCourse(course, { enrollments });
  }

  const notificationSnapshot = await getDashboardNotificationSnapshot({
    userId: user.id,
    courseSlugs: [slug],
  });

  const exerciseResources = campusResources.filter((r) => r.isManaged && r.isExercise);
  const allSubmissions = exerciseResources.flatMap((r) => r.submissions);
  const pendingCount = allSubmissions.filter((s) => s.status === "SUBMITTED").length;
  const managedResources = campusResources.filter((r) => r.isManaged);
  const activeEnrollmentCount = enrollments.filter((e) => e.status === "ACTIVE").length;

  const viewerName = user.name ?? user.email;
  const roleLabel = getRoleLabel(access.role);

  const resourcesByModuleId = new Map<string | null, CampusResourceItem[]>();
  for (const resource of managedResources) {
    const key = resource.moduleId ?? null;
    const bucket = resourcesByModuleId.get(key) ?? [];
    bucket.push(resource);
    resourcesByModuleId.set(key, bucket);
  }

  return (
    <TeacherShell
      viewerName={viewerName}
      viewerInitials={getInitials(viewerName)}
      roleLabel={roleLabel}
      notificationsCount={notificationSnapshot.unreadCount}
    >
      <div className="px-5 sm:px-8 xl:px-10 py-6 sm:py-8 pb-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
          <Link href="/docente/cursos" className="transition hover:text-[var(--color-primary)]">
            Mis cursos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="truncate text-[var(--color-ink-soft)]">{course.title}</span>
        </nav>

        {/* Header del curso */}
        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-premium text-display-md font-semibold text-[var(--color-ink)]">
                {course.title}
              </h1>
              <Badge tone={course.activeEdition?.status === "ACTIVE" ? "success" : "outline"}>
                {course.activeEdition?.status === "ACTIVE" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            {course.activeEdition && (
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {course.activeEdition.label}
                {course.activeEdition.endsAt &&
                  ` · Cierra ${formatDateTime(course.activeEdition.endsAt)}`}
              </p>
            )}
          </div>
          <ButtonLink
            href={`/docente/cursos/${slug}/constructor`}
            variant="inverse"
            className="shrink-0"
          >
            Abrir constructor
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>

        {/* Tabs navigation */}
        <nav className="mt-6 border-b border-[rgba(22,60,88,0.08)]">
          <div className="flex items-center gap-6 overflow-x-auto">
            {(
              [
                { label: "Contenido", value: "contenido", disabled: false },
                { label: "Alumnos", value: "alumnos", disabled: false },
                { label: "Comunidad", value: "comunidad", disabled: false },
                { label: "Estadísticas", value: "estadisticas", disabled: false },
              ] as Array<{ label: string; value: string; disabled: boolean }>
            ).map((t) =>
              t.disabled ? (
                <span
                  key={t.value}
                  className="flex cursor-not-allowed items-center gap-1.5 border-b-2 border-transparent pb-3 text-[1rem] font-medium text-[var(--color-ink-muted)] opacity-50"
                >
                  {t.label}
                  <span className="rounded-full bg-[rgba(28,47,67,0.08)] px-1.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wide">
                    Próx.
                  </span>
                </span>
              ) : (
                <Link
                  key={t.value}
                  href={`/docente/cursos/${slug}?tab=${t.value}`}
                  aria-current={activeTab === t.value ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap border-b-2 pb-3 text-[1rem] font-medium transition",
                    activeTab === t.value
                      ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                      : "border-transparent text-[var(--color-ink-soft)] hover:border-[rgba(22,60,88,0.16)] hover:text-[var(--color-ink)]",
                  )}
                >
                  {t.label}
                  {t.value === "alumnos" && activeEnrollmentCount > 0 && (
                    <span className="ml-2 rounded-full bg-[var(--color-brand-soft)] px-1.5 py-0.5 text-[0.75rem] font-semibold text-[var(--color-primary)]">
                      {activeEnrollmentCount}
                    </span>
                  )}
                  {t.value === "contenido" && pendingCount > 0 && (
                    <span className="ml-2 rounded-full bg-[rgba(209,88,62,0.15)] px-1.5 py-0.5 text-[0.75rem] font-semibold text-[var(--color-danger)]">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              ),
            )}
          </div>
        </nav>

        {/* Tab content */}
        <div className="mt-8">
          {activeTab === "contenido" && (
            <ContenidoTab
              course={course}
              resourcesByModuleId={resourcesByModuleId}
              courseSlug={slug}
            />
          )}
          {activeTab === "alumnos" && (
            <AlumnosTab
              progressRows={progressRows}
              allSubmissions={allSubmissions}
              courseSlug={slug}
            />
          )}
          {activeTab === "comunidad" && (
            <ComunidadTab courseSlug={slug} courseTitle={course.title} />
          )}
          {activeTab === "estadisticas" && (
            <EstadisticasTab
              progressRows={progressRows}
              allSubmissions={allSubmissions}
              totalModules={course.modules.length}
            />
          )}
        </div>
      </div>
    </TeacherShell>
  );
}
