"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Compass,
  FileText,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  LineChart,
  MessageSquareText
} from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import { CourseProgressToggleForm } from "@/components/learning/course-progress-toggle-form";
import { CourseResourceManager } from "@/components/learning/course-resource-manager";
import { Badge } from "@/components/ui/badge";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CourseProgressDetails } from "@/lib/course-progress";
import type { CampusResourceItem } from "@/lib/course-resources";
import { siteConfig } from "@/lib/site";
import { cn, formatDate } from "@/lib/utils";

type LearningShellProps = {
  course: CatalogCourse;
  forumCategories: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    _count: {
      threads: number;
    };
  }>;
  resources: CampusResourceItem[];
  progress: CourseProgressDetails;
  roleLabel: string;
  canModerate: boolean;
  editionLabel?: string | null;
  accessUntil?: Date | null;
  initialActiveTab: SidebarTab;
};

export type SidebarTab = "content" | "resources" | "support";

function CampusMetricCard(input: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(12,113,195,0.12)] bg-white p-4 shadow-[0_12px_24px_rgba(34,34,33,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <p className="mt-3 text-[1.7rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)]">
        {input.value}
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{input.detail}</p>
    </div>
  );
}

function CampusFlowAction(input: {
  step: string;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full rounded-[22px] border border-[rgba(12,113,195,0.14)] bg-white p-4 text-left shadow-[0_12px_24px_rgba(34,34,33,0.04)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
      onClick={input.onClick}
      type="button"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        {input.step}
      </p>
      <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{input.description}</p>
      <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]">
        {input.cta}
        <ArrowRight className="ml-2 h-4 w-4" />
      </span>
    </button>
  );
}

export function CourseLearningShell({
  course,
  forumCategories,
  resources,
  progress,
  roleLabel,
  canModerate,
  editionLabel,
  accessUntil,
  initialActiveTab
}: LearningShellProps) {
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<SidebarTab>(initialActiveTab);
  const currentModule = progress.modules[selectedModuleIndex] ?? progress.modules[0] ?? null;
  const nextPendingModule = useMemo(
    () => progress.modules.find((module) => !module.isCompleted) ?? progress.modules[0] ?? null,
    [progress.modules]
  );
  const managedResources = useMemo(
    () => resources.filter((resource) => resource.isManaged),
    [resources]
  );
  const managedMaterials = useMemo(
    () => managedResources.filter((resource) => !resource.isExercise),
    [managedResources]
  );
  const managedExercises = useMemo(
    () => managedResources.filter((resource) => resource.isExercise),
    [managedResources]
  );
  const studentOpenExercises = useMemo(
    () =>
      managedExercises.filter(
        (resource) =>
          !resource.viewerSubmission || resource.viewerSubmission.status === "CHANGES_REQUESTED"
      ),
    [managedExercises]
  );
  const studentUnderReviewExercises = useMemo(
    () =>
      managedExercises.filter((resource) => resource.viewerSubmission?.status === "SUBMITTED"),
    [managedExercises]
  );
  const studentReviewedExercises = useMemo(
    () =>
      managedExercises.filter((resource) => resource.viewerSubmission?.status === "REVIEWED"),
    [managedExercises]
  );
  const teacherPendingReviews = useMemo(
    () =>
      managedExercises.reduce((total, resource) => total + (resource.submissionStats?.pending ?? 0), 0),
    [managedExercises]
  );
  const teacherSubmissionCount = useMemo(
    () =>
      managedExercises.reduce((total, resource) => total + (resource.submissionStats?.total ?? 0), 0),
    [managedExercises]
  );
  const introCopy = canModerate
    ? "Este espacio organiza el programa, los recursos, los ejercicios y el acceso al foro privado del curso. Las tareas del alumnado se gestionan desde recursos y tareas; el foro queda para anuncios, dudas y coordinacion."
    : "Este espacio organiza el programa, los recursos disponibles y el acceso al foro privado del curso. Las tareas se entregan desde recursos y tareas, y el progreso de modulos sigue siendo manual y verificable.";

  function buildTabHref(tab: SidebarTab) {
    return tab === "content" ? `/mis-cursos/${course.slug}` : `/mis-cursos/${course.slug}?tab=${tab}`;
  }

  function handleTabChange(nextTab: SidebarTab) {
    setActiveTab(nextTab);

    if (typeof window === "undefined") {
      return;
    }

    window.history.replaceState(window.history.state, "", buildTabHref(nextTab));
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="sticky top-0 z-30 border-b border-[rgba(12,113,195,0.14)] bg-white/95 backdrop-blur-md">
        <div className="flex flex-col gap-4 px-6 py-5 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-5">
              <Link
                className="whitespace-nowrap text-xl font-medium text-[var(--color-primary)]"
                href="/mi-cuenta"
              >
                Volver al dashboard
              </Link>
              <div className="hidden h-12 w-px bg-[var(--color-border)] lg:block" />
              <h1 className="truncate text-[1.9rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                {course.title}
              </h1>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <Badge tone={canModerate ? "teacher" : "student"}>{roleLabel}</Badge>
              <Badge tone="muted">{canModerate ? "Espacio de seguimiento" : "Acceso vigente"}</Badge>
            </div>
          </div>

          <nav aria-label="Navegacion del campus" className="flex flex-wrap items-center gap-3">
            <Link
              className="rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
              href={`/mis-cursos/${course.slug}`}
              prefetch
            >
              Campus
            </Link>
            <Link
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              href={`/mis-cursos/${course.slug}/foro`}
              prefetch
            >
              Foro
            </Link>
            {canModerate ? (
              <Link
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                href={`/mis-cursos/${course.slug}/seguimiento`}
                prefetch
              >
                Seguimiento
              </Link>
            ) : null}
            <Link
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              href="/mi-cuenta"
              prefetch
            >
              Mi cuenta
            </Link>
          </nav>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-141px)] lg:grid-cols-[1fr_400px]">
        <section className="px-6 py-10 lg:px-12">
          <div className="overflow-hidden rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white shadow-[0_22px_48px_rgba(34,34,33,0.06)]">
            <div className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:px-8 lg:py-8">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={canModerate ? "teacher" : "student"}>{roleLabel}</Badge>
                  <Badge tone="muted">{course.level}</Badge>
                  <Badge tone="muted">{course.format}</Badge>
                </div>
                <h2 className="mt-5 text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                  Campus del curso
                </h2>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">{introCopy}</p>

                {editionLabel ? (
                  <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                    Edicion asociada: <strong className="text-[var(--color-ink)]">{editionLabel}</strong>
                    {accessUntil ? ` | Acceso previsto hasta ${formatDate(accessUntil)}` : ""}
                  </p>
                ) : null}

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {canModerate ? (
                    <>
                      <CampusMetricCard
                        detail="Ejercicios visibles para el alumnado dentro del campus."
                        label="Ejercicios activos"
                        value={`${managedExercises.length}`}
                      />
                      <CampusMetricCard
                        detail={`${teacherSubmissionCount} entregas registradas en total.`}
                        label="Pendientes de revision"
                        value={`${teacherPendingReviews}`}
                      />
                      <CampusMetricCard
                        detail="Materiales y referencias gestionadas por el equipo docente."
                        label="Recursos publicados"
                        value={`${managedResources.length}`}
                      />
                    </>
                  ) : (
                    <>
                      <CampusMetricCard
                        detail={
                          nextPendingModule
                            ? `Continua por ${nextPendingModule.title}.`
                            : "No hay modulos configurados todavia."
                        }
                        label="Siguiente modulo"
                        value={
                          nextPendingModule
                            ? `Modulo ${nextPendingModule.index + 1}`
                            : "Sin contenido"
                        }
                      />
                      <CampusMetricCard
                        detail={
                          studentOpenExercises.length
                            ? "Tareas que debes abrir o actualizar desde recursos y tareas."
                            : "No tienes tareas abiertas en este momento."
                        }
                        label="Tareas por hacer"
                        value={`${studentOpenExercises.length}`}
                      />
                      <CampusMetricCard
                        detail={
                          studentUnderReviewExercises.length
                            ? "Entregas ya enviadas y pendientes de respuesta docente."
                            : "No hay entregas esperando revision."
                        }
                        label="En revision"
                        value={`${studentUnderReviewExercises.length}`}
                      />
                    </>
                  )}
                </div>

                <div className="mt-8 rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Progreso guardado
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {progress.completedModules} de {progress.totalModules} modulos revisados
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Ultima actividad
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                        {progress.lastCompletedAt ? formatDate(progress.lastCompletedAt) : "Sin actividad"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      aria-hidden="true"
                      className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                      style={{ width: `${progress.completionRate}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                    <span>{progress.completionRate}% marcado como revisado</span>
                    <span>{progress.pendingModules} modulos pendientes</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[26px] border border-[rgba(12,113,195,0.14)] bg-[var(--color-surface)] p-4">
                <CourseArtwork
                  className="h-[19rem] w-full rounded-[20px] border-0"
                  course={course}
                  variant="hero"
                />
                <div className="rounded-[20px] bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Estado del curso
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-ink)]">
                    {progress.isCompleted
                      ? "Has marcado todos los modulos del curso como revisados."
                      : progress.hasStarted
                        ? `Ya has avanzado sobre ${progress.completedModules} modulos y puedes seguir desde el contenido pendiente.`
                        : "Todavia no has marcado modulos. Puedes empezar por el primero y registrar tu avance de forma manual."}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Accesos rapidos
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex items-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white"
                      href={buildTabHref("resources")}
                      prefetch
                    >
                      {canModerate ? "Gestionar recursos y tareas" : "Abrir recursos y tareas"}
                    </Link>
                    <Link
                      className="inline-flex items-center rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
                      href={`/mis-cursos/${course.slug}/foro`}
                      prefetch
                    >
                      Abrir foro privado
                    </Link>
                    {canModerate ? (
                      <Link
                        className="inline-flex items-center rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
                        href={`/mis-cursos/${course.slug}/seguimiento`}
                        prefetch
                      >
                        <LineChart className="mr-2 h-4 w-4" />
                        Ver seguimiento
                      </Link>
                    ) : (
                      <Link
                        className="inline-flex items-center rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
                        href="/mi-cuenta"
                        prefetch
                      >
                        Volver al dashboard
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="thin-divider mt-10 pt-8">
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="text-[2.2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                Enfoque del curso
              </h2>
            </div>

            <div className="prose-copy mt-8 max-w-4xl text-[1.08rem] leading-10 text-[var(--color-ink)]">
              <p>{course.description}</p>
              <p>
                El progreso no se calcula por visionado, tiempo ni automatismos. Solo queda
                registrado cuando tu mismo marcas un modulo como revisado dentro del campus.
              </p>
            </div>
          </div>
        </section>

        <aside className="flex min-h-full flex-col border-l border-[rgba(12,113,195,0.14)] bg-white">
          <div className="flex border-b border-[rgba(12,113,195,0.14)]">
            {[
              { id: "content" as const, label: "Contenido", icon: BookOpen },
              { id: "resources" as const, label: "Recursos y tareas", icon: FolderOpen },
              { id: "support" as const, label: "Soporte", icon: CircleHelp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                aria-pressed={activeTab === id}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-6 text-lg font-medium transition",
                  activeTab === id
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-ink)]"
                )}
                key={id}
                onClick={() => handleTabChange(id)}
                type="button"
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === "content" ? (
            <>
              <div className="flex items-center justify-between border-b border-[rgba(12,113,195,0.14)] px-6 py-6">
                <div>
                  <p className="text-[1.75rem] font-medium text-[var(--color-ink)]">Programa del curso</p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Marca cada modulo cuando ya lo hayas revisado.
                  </p>
                </div>
                <p className="text-lg text-[var(--color-ink)]">{course.modules.length} modulos</p>
              </div>

              <div className="border-b border-[rgba(12,113,195,0.14)] bg-[var(--color-surface)] px-6 py-5">
                <div className="rounded-[24px] border border-[rgba(12,113,195,0.14)] bg-white p-5 shadow-[0_12px_24px_rgba(34,34,33,0.04)]">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      {canModerate ? (
                        <FolderKanban className="h-5 w-5" />
                      ) : (
                        <GraduationCap className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[var(--color-ink)]">Ruta recomendada</p>
                      <p className="text-sm leading-7 text-[var(--color-muted)]">
                        {canModerate
                          ? "Publica, revisa y acompana sin mezclar tareas con conversaciones del foro."
                          : "El flujo correcto es contenido, tareas y despues foro o soporte cuando lo necesites."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <CampusFlowAction
                      cta="Abrir modulo actual"
                      description={
                        nextPendingModule
                          ? `Continua por ${nextPendingModule.title} y marca el avance cuando termines.`
                          : "Revisa la estructura del curso y el estado de tus modulos."
                      }
                      onClick={() => handleTabChange("content")}
                      step="Paso 1"
                      title={canModerate ? "Valida el recorrido del campus" : "Revisa el contenido del curso"}
                    />
                    <CampusFlowAction
                      cta={canModerate ? "Ir a recursos y tareas" : "Ver tareas y entregas"}
                      description={
                        canModerate
                          ? `${managedExercises.length} ejercicios activos y ${teacherPendingReviews} entregas pendientes de revision.`
                          : `${studentOpenExercises.length} tareas por hacer, ${studentUnderReviewExercises.length} en revision y ${studentReviewedExercises.length} revisadas.`
                      }
                      onClick={() => handleTabChange("resources")}
                      step="Paso 2"
                      title={canModerate ? "Gestiona materiales y ejercicios" : "Entrega tareas desde el campus"}
                    />
                    <CampusFlowAction
                      cta="Abrir soporte del curso"
                      description={
                        canModerate
                          ? "Usa el foro para anuncios, dudas y acompanamiento del grupo."
                          : "Usa el foro para anuncios o dudas; las tareas no se entregan ahi."
                      }
                      onClick={() => handleTabChange("support")}
                      step="Paso 3"
                      title={canModerate ? "Coordina la comunidad del curso" : "Consulta dudas y anuncios"}
                    />
                  </div>
                </div>
              </div>

              {!canModerate && managedExercises.length ? (
                <div className="border-b border-[rgba(12,113,195,0.14)] bg-[var(--color-surface)] px-6 py-5">
                  <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(12,113,195,0.14)] bg-white p-5 shadow-[0_12px_24px_rgba(34,34,33,0.04)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          Tareas y entregas
                        </p>
                        <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                          {studentOpenExercises.length
                            ? `${studentOpenExercises.length} tareas requieren tu atencion`
                            : "Tus tareas del curso estan al dia"}
                        </p>
                      </div>
                      <button
                        className="inline-flex items-center rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                        onClick={() => handleTabChange("resources")}
                        type="button"
                      >
                        Abrir recursos y tareas
                      </button>
                    </div>
                    <p className="text-sm leading-7 text-[var(--color-muted)]">
                      Los ejercicios publicados por el docente aparecen en la pestana de recursos y
                      tareas. Desde ahi puedes abrir la actividad, leer instrucciones y subir tu
                      entrega o actualizarla.
                    </p>
                  </div>
                </div>
              ) : null}

              {canModerate && managedExercises.length ? (
                <div className="border-b border-[rgba(12,113,195,0.14)] bg-[var(--color-surface)] px-6 py-5">
                  <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(12,113,195,0.14)] bg-white p-5 shadow-[0_12px_24px_rgba(34,34,33,0.04)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          Tareas del alumnado
                        </p>
                        <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                          {managedExercises.length} ejercicios publicados en este curso
                        </p>
                      </div>
                      <button
                        className="inline-flex items-center rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                        onClick={() => handleTabChange("resources")}
                        type="button"
                      >
                        Gestionar recursos y tareas
                      </button>
                    </div>
                    <p className="text-sm leading-7 text-[var(--color-muted)]">
                      Las tareas viven en recursos y tareas. Desde ahi el alumno ve la actividad,
                      adjunta su entrega y tu puedes revisar el resultado sin salir del campus.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="campus-scrollbar flex-1 overflow-y-auto">
                {progress.modules.map((module) => {
                  const isCurrentModule = module.index === selectedModuleIndex;

                  return (
                    <div className="border-b border-[rgba(12,113,195,0.14)]" key={module.id}>
                      <button
                        aria-expanded={isCurrentModule}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                        onClick={() => setSelectedModuleIndex(module.index)}
                        type="button"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                            Modulo {module.index + 1}
                          </p>
                          <p className="mt-2 text-[1.15rem] font-medium text-[var(--color-ink)]">
                            {module.title}
                          </p>
                        </div>
                        <Badge tone={module.isCompleted ? "teacher" : isCurrentModule ? "student" : "muted"}>
                          {module.isCompleted ? "Revisado" : isCurrentModule ? "Seleccionado" : "Pendiente"}
                        </Badge>
                      </button>

                      {isCurrentModule ? (
                        <div className="space-y-4 border-t border-[rgba(12,113,195,0.08)] bg-[var(--color-surface)] px-6 py-5">
                          <p className="text-[1rem] leading-7 text-[var(--color-ink)]">{module.description}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                            <span>{module.estimatedTime}</span>
                            <span>{module.resourcesSummary}</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-[var(--color-muted)]">
                              {module.completedAt
                                ? `Marcado como revisado el ${formatDate(module.completedAt)}`
                                : "Aun no lo has marcado como revisado."}
                            </p>
                            <CourseProgressToggleForm
                              courseSlug={course.slug}
                              isCompleted={module.isCompleted}
                              moduleId={module.id}
                              nextPath={`/mis-cursos/${course.slug}`}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {activeTab === "resources" ? (
            <div className="campus-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-[var(--color-primary)]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">Recursos y tareas del curso</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    Materiales, ejercicios y entregas disponibles en esta edicion.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {canModerate ? (
                  <>
                    <CampusMetricCard
                      detail="Ejercicios visibles y abiertos para el alumnado."
                      label="Ejercicios"
                      value={`${managedExercises.length}`}
                    />
                    <CampusMetricCard
                      detail="Entregas que esperan revision o decision docente."
                      label="Pendientes"
                      value={`${teacherPendingReviews}`}
                    />
                    <CampusMetricCard
                      detail="Archivos, enlaces y guias publicadas en el campus."
                      label="Materiales"
                      value={`${managedMaterials.length}`}
                    />
                    <CampusMetricCard
                      detail="Total acumulado de entregas registradas en este curso."
                      label="Entregas"
                      value={`${teacherSubmissionCount}`}
                    />
                  </>
                ) : (
                  <>
                    <CampusMetricCard
                      detail="Ejercicios que debes abrir o reenviar desde esta misma pestana."
                      label="Por entregar"
                      value={`${studentOpenExercises.length}`}
                    />
                    <CampusMetricCard
                      detail="Entregas ya enviadas y pendientes de feedback."
                      label="En revision"
                      value={`${studentUnderReviewExercises.length}`}
                    />
                    <CampusMetricCard
                      detail="Material de apoyo publicado para el curso."
                      label="Materiales"
                      value={`${managedMaterials.length}`}
                    />
                    <CampusMetricCard
                      detail="Ejercicios cerrados con nota o respuesta docente."
                      label="Revisadas"
                      value={`${studentReviewedExercises.length}`}
                    />
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-[rgba(12,113,195,0.14)] bg-white p-5 text-sm leading-7 text-[var(--color-muted)] shadow-[0_12px_24px_rgba(34,34,33,0.04)]">
                <p className="font-semibold text-[var(--color-ink)]">
                  {canModerate ? "Flujo docente recomendado" : "Flujo del alumno recomendado"}
                </p>
                <p className="mt-2">
                  {canModerate
                    ? "1. Publica el material o ejercicio aqui. 2. El alumno lo ve en esta misma zona y registra su entrega en la tarjeta correspondiente. 3. Tu revisas, calificas o pides cambios sin enviarle al foro."
                    : "1. Abre la tarea desde esta pestana. 2. Lee la descripcion y la fecha limite. 3. Sube tu entrega o actualizala en el formulario del propio ejercicio. 4. Consulta aqui mismo el estado, la nota y el feedback."}
                </p>
              </div>

              <CourseResourceManager
                canModerate={canModerate}
                course={course}
                resources={resources}
                roleLabel={roleLabel}
              />
            </div>
          ) : null}

          {activeTab === "support" ? (
            <div className="campus-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <Link
                className="block rounded-2xl border border-[var(--color-primary)] bg-white p-5 text-[var(--color-primary)] shadow-[0_16px_28px_rgba(12,113,195,0.08)] transition hover:bg-[var(--color-primary-soft)]"
                href={`/mis-cursos/${course.slug}/foro`}
                prefetch
              >
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em]">
                  <MessageSquareText className="h-4 w-4" />
                  Foro del curso
                </p>
                <p className="mt-2 text-lg font-semibold">Abrir todas las categorias del foro</p>
              </Link>

              {forumCategories.length ? (
                forumCategories.map((category) => (
                  <Link
                    className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)]"
                    href={`/mis-cursos/${course.slug}/foro/${category.slug}`}
                    key={category.id}
                    prefetch
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[var(--color-ink)]">{category.title}</p>
                        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                          {category.description}
                        </p>
                      </div>
                      <Badge tone="muted">{category._count.threads} hilos</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[rgba(12,113,195,0.18)] bg-white p-5 text-sm leading-7 text-[var(--color-muted)]">
                  Aun no hay categorias activas en el foro de este curso.
                </div>
              )}

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-base font-semibold text-[var(--color-ink)]">
                  Tareas, foro y soporte cumplen funciones distintas
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Las tareas y entregas viven en recursos y tareas. El foro queda reservado para
                  anuncios, dudas y conversacion del curso. Si el problema es de acceso o de cuenta,
                  usa el soporte de plataforma.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-base font-semibold text-[var(--color-ink)]">Tu rol en el campus</p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {canModerate
                    ? "Como docente o administracion puedes responder, fijar hilos y orientar la comunidad del curso."
                    : "Como alumno puedes consultar el programa, usar recursos y participar en el foro privado del curso."}
                </p>
              </div>

              <a
                className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)]"
                href={`mailto:${siteConfig.supportEmail}`}
              >
                <p className="text-base font-semibold text-[var(--color-ink)]">Soporte de plataforma</p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Escribe a {siteConfig.supportEmail} si necesitas ayuda con acceso, cuenta o
                  incidencias tecnicas del campus.
                </p>
              </a>
            </div>
          ) : null}

          <div className="border-t border-[rgba(12,113,195,0.14)] px-6 py-6">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
              {currentModule ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0",
                      currentModule.isCompleted ? "text-[var(--color-success)]" : "text-[var(--color-muted)]"
                    )}
                  />
                  <div>
                    <span className="block font-semibold text-[var(--color-ink)]">
                      {currentModule.isCompleted ? "Modulo revisado" : "Modulo pendiente"}
                    </span>
                    <span className="mt-2 block">{currentModule.title}</span>
                  </div>
                </div>
              ) : (
                "Selecciona un modulo para revisar su descripcion."
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
