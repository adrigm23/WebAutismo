"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { startTransition, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CircleHelp,
  FolderOpen,
  LayoutPanelTop,
} from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import { CourseProgressToggleForm } from "@/components/learning/course-progress-toggle-form";
import { CourseResourceManager } from "@/components/learning/course-resource-manager";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
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

function SurfaceCard(input: {
  title?: string;
  description?: string;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={input.id}
      className={cn(
        "rounded-[30px] border border-[rgba(12,113,195,0.12)] bg-white p-6 shadow-[0_22px_48px_rgba(34,34,33,0.06)] lg:p-7",
        input.className
      )}
    >
      {input.title ? (
        <div className="mb-5">
          <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            {input.title}
          </h2>
          {input.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              {input.description}
            </p>
          ) : null}
        </div>
      ) : null}
      {input.children}
    </section>
  );
}

function SummaryMetric(input: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <p className="mt-3 text-[1.85rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)]">
        {input.value}
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{input.detail}</p>
    </div>
  );
}

function WorkspaceTabButton(input: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  const Icon = input.icon;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition",
        input.active
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_12px_22px_rgba(12,113,195,0.18)]"
          : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      )}
      onClick={input.onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {input.label}
    </button>
  );
}

function ActionCard(input: {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
      onClick={input.onClick}
      type="button"
    >
      <p className="text-lg font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{input.body}</p>
      <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]">
        {input.cta}
        <ArrowRight className="ml-2 h-4 w-4" />
      </span>
    </button>
  );
}

function ModuleRow(input: {
  title: string;
  meta: string;
  stateLabel: string;
  stateTone: "teacher" | "student" | "muted";
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-start justify-between gap-4 rounded-[22px] border p-4 text-left transition",
        input.isSelected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          : "border-[rgba(12,113,195,0.1)] bg-white hover:border-[var(--color-primary)]"
      )}
      onClick={input.onClick}
      type="button"
    >
      <div className="min-w-0">
        <p className="text-lg font-semibold text-[var(--color-ink)]">{input.title}</p>
        <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{input.meta}</p>
      </div>
      <Badge tone={input.stateTone}>{input.stateLabel}</Badge>
    </button>
  );
}

function InfoPanel(input: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5">
      <p className="text-lg font-semibold text-[var(--color-ink)]">{input.title}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{input.body}</p>
      {input.ctaHref && input.ctaLabel ? (
        <Link
          className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--color-primary)]"
          href={input.ctaHref}
          prefetch
        >
          {input.ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      ) : null}
    </div>
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
  const [pendingActiveTab, setPendingActiveTab] = useState<SidebarTab | null>(null);
  const activeTab = pendingActiveTab ?? initialActiveTab;
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

  const primaryResourceTargetId = useMemo(() => {
    if (canModerate) {
      return "resource-manager-top";
    }

    return studentOpenExercises[0]
      ? `resource-${studentOpenExercises[0].id}`
      : managedExercises[0]
        ? `resource-${managedExercises[0].id}`
        : "resources-panel";
  }, [canModerate, managedExercises, studentOpenExercises]);

  function buildTabHref(tab: SidebarTab) {
    return tab === "content" ? `/mis-cursos/${course.slug}` : `/mis-cursos/${course.slug}?tab=${tab}`;
  }

  function scrollToCampusTarget(targetId: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleTabChange(nextTab: SidebarTab) {
    startTransition(() => {
      setPendingActiveTab(nextTab);
    });

    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", buildTabHref(nextTab));
    }
  }

  function handleResourceWorkspaceOpen(targetId?: string) {
    const nextTargetId = targetId ?? primaryResourceTargetId;

    if (activeTab !== "resources") {
      handleTabChange("resources");

      if (typeof window !== "undefined") {
        const nextUrl = `${buildTabHref("resources")}#${nextTargetId}`;
        window.history.replaceState(window.history.state, "", nextUrl);
      }

      window.setTimeout(() => {
        scrollToCampusTarget(nextTargetId);
      }, 60);
      return;
    }

    if (typeof window !== "undefined") {
      const nextUrl = `${buildTabHref("resources")}#${nextTargetId}`;
      window.history.replaceState(window.history.state, "", nextUrl);
    }

    scrollToCampusTarget(nextTargetId);
  }

  useEffect(() => {
    if (typeof window === "undefined" || activeTab !== "resources") {
      return;
    }

    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      return;
    }

    scrollToCampusTarget(hash);
  }, [activeTab]);

  const primarySummary = canModerate
    ? {
        title: "Centro operativo del curso",
        body: "Gestiona materiales, ejercicios y revision docente desde un unico espacio. El foro queda como canal de anuncios, dudas y acompanamiento, no como sustituto del flujo academico."
      }
    : {
        title: "Tu espacio de aprendizaje",
        body: "Todo el recorrido del curso vive aqui: revisas modulos, localizas tareas y registras entregas sin salir del campus. El foro queda reservado para dudas y comunicacion con el equipo docente."
      };

  const heroMetrics = canModerate
    ? [
        {
          label: "Ejercicios activos",
          value: `${managedExercises.length}`,
          detail: "Actividades visibles y abiertas para el alumnado."
        },
        {
          label: "Pendientes de revision",
          value: `${teacherPendingReviews}`,
          detail: `${teacherSubmissionCount} entregas registradas en total.`
        },
        {
          label: "Recursos publicados",
          value: `${managedResources.length}`,
          detail: "Materiales, enlaces y referencias del campus."
        }
      ]
    : [
        {
          label: "Siguiente modulo",
          value: nextPendingModule ? `Modulo ${nextPendingModule.index + 1}` : "Sin contenido",
          detail: nextPendingModule
            ? nextPendingModule.title
            : "Todavia no hay modulos configurados en este curso."
        },
        {
          label: "Tareas por hacer",
          value: `${studentOpenExercises.length}`,
          detail: "Actividades pendientes o con cambios solicitados."
        },
        {
          label: "En revision",
          value: `${studentUnderReviewExercises.length}`,
          detail: "Entregas ya enviadas y esperando respuesta docente."
        }
      ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f5ef_0%,#f3f7fb_52%,#fbfaf8_100%)]">
      <header className="sticky top-0 z-30 border-b border-[rgba(12,113,195,0.12)] bg-white/95 backdrop-blur-md">
        <div className="px-6 py-4 lg:px-12">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-4">
                  <Link className="text-lg font-medium text-[var(--color-primary)]" href="/mi-cuenta" prefetch>
                    Volver al dashboard
                  </Link>
                  <span className="hidden h-8 w-px bg-[var(--color-border)] lg:block" />
                  <h1 className="truncate text-[2.15rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                    {course.title}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={canModerate ? "teacher" : "student"}>{roleLabel}</Badge>
                <Badge tone="muted">{canModerate ? "Espacio de seguimiento" : "Acceso vigente"}</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[rgba(12,113,195,0.08)] pt-3 xl:flex-row xl:items-center xl:justify-between">
              <nav
                aria-label="Navegacion del campus"
                className="flex flex-wrap items-center gap-2"
              >
                <ButtonLink
                  className="px-4 py-2.5 text-sm"
                  href={`/mis-cursos/${course.slug}`}
                  prefetch
                  variant="secondary"
                >
                  Campus
                </ButtonLink>
                <ButtonLink
                  className="px-4 py-2.5 text-sm"
                  href={`/mis-cursos/${course.slug}/foro`}
                  prefetch
                  variant="ghost"
                >
                  Foro
                </ButtonLink>
                {canModerate ? (
                  <ButtonLink
                    className="px-4 py-2.5 text-sm"
                    href={`/mis-cursos/${course.slug}/seguimiento`}
                    prefetch
                    variant="ghost"
                  >
                    Seguimiento
                  </ButtonLink>
                ) : null}
                <ButtonLink className="px-4 py-2.5 text-sm" href="/mi-cuenta" prefetch variant="ghost">
                  Mi cuenta
                </ButtonLink>
              </nav>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <WorkspaceTabButton
                  active={activeTab === "content"}
                  icon={LayoutPanelTop}
                  label="Contenido"
                  onClick={() => handleTabChange("content")}
                />
                <WorkspaceTabButton
                  active={activeTab === "resources"}
                  icon={FolderOpen}
                  label="Recursos y tareas"
                  onClick={() => handleTabChange("resources")}
                />
                <WorkspaceTabButton
                  active={activeTab === "support"}
                  icon={CircleHelp}
                  label="Soporte"
                  onClick={() => handleTabChange("support")}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 lg:px-12 xl:py-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-6">
            <SurfaceCard className="overflow-hidden p-0">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
                <div className="space-y-6 p-6 lg:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={canModerate ? "teacher" : "student"}>{roleLabel}</Badge>
                    <Badge tone="muted">{course.level}</Badge>
                    <Badge tone="muted">{course.format}</Badge>
                  </div>

                  <div>
                    <h2 className="text-[3.4rem] font-semibold leading-[0.96] tracking-[-0.08em] text-[var(--color-ink)]">
                      {primarySummary.title}
                    </h2>
                    <p className="mt-4 max-w-3xl text-[1.06rem] leading-8 text-[var(--color-muted)]">
                      {primarySummary.body}
                    </p>
                    {editionLabel ? (
                      <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                        Edicion activa: <strong className="text-[var(--color-ink)]">{editionLabel}</strong>
                        {accessUntil ? ` | Acceso previsto hasta ${formatDate(accessUntil)}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {heroMetrics.map((metric) => (
                      <SummaryMetric
                        detail={metric.detail}
                        key={metric.label}
                        label={metric.label}
                        value={metric.value}
                      />
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          Progreso guardado
                        </p>
                        <p className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                          {progress.completedModules} de {progress.totalModules} modulos revisados
                        </p>
                      </div>
                      <div className="text-left lg:text-right">
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

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(12,113,195,0.18)] transition duration-200 hover:bg-[var(--color-primary-strong)]"
                      onClick={() => handleResourceWorkspaceOpen()}
                      type="button"
                    >
                      {canModerate ? "Gestionar recursos y tareas" : "Abrir tareas del curso"}
                    </button>
                    <ButtonLink href={`/mis-cursos/${course.slug}/foro`} prefetch variant="secondary">
                      Abrir foro privado
                    </ButtonLink>
                    {canModerate ? (
                      <ButtonLink
                        href={`/mis-cursos/${course.slug}/seguimiento`}
                        prefetch
                        variant="ghost"
                      >
                        Ver seguimiento
                      </ButtonLink>
                    ) : (
                      <ButtonLink href="/mi-cuenta" prefetch variant="ghost">
                        Volver a mi cuenta
                      </ButtonLink>
                    )}
                  </div>
                </div>

                <div className="border-t border-[rgba(12,113,195,0.08)] bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f8_100%)] p-6 lg:border-l lg:border-t-0 lg:p-8">
                  <div className="space-y-5">
                    <CourseArtwork
                      className="h-[20rem] w-full rounded-[26px] border-0"
                      course={course}
                      variant="hero"
                    />

                    <div className="rounded-[26px] border border-[rgba(12,113,195,0.12)] bg-white p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Estado del curso
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                        {progress.isCompleted
                          ? "Todo el recorrido del curso ya figura como revisado."
                          : progress.hasStarted
                            ? `Ya has avanzado sobre ${progress.completedModules} modulos y puedes continuar desde el contenido o las tareas pendientes.`
                            : "Aun no has registrado avance. Empieza por el primer modulo o abre la zona de recursos para revisar tareas activas."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SurfaceCard>

            {activeTab === "content" ? (
              <>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
                  <SurfaceCard
                    description={
                      canModerate
                        ? "Este recorrido resume donde debe ocurrir cada accion del campus para que la experiencia sea clara."
                        : "Sigue este orden para no perder contexto entre modulos, tareas y soporte."
                    }
                    title="Ruta de trabajo"
                  >
                    <div className="space-y-4">
                      <ActionCard
                        body={
                          nextPendingModule
                            ? `Continua por ${nextPendingModule.title} y marca el avance cuando termines.`
                            : "No hay modulos disponibles para revisar en este momento."
                        }
                        cta="Ver contenido actual"
                        onClick={() => handleTabChange("content")}
                        title={canModerate ? "Valida el recorrido del campus" : "Empieza por el contenido"}
                      />
                      <ActionCard
                        body={
                          canModerate
                            ? `${managedExercises.length} ejercicios activos y ${teacherPendingReviews} entregas pendientes de revision.`
                            : `${studentOpenExercises.length} tareas abiertas y ${studentUnderReviewExercises.length} entregas en revision.`
                        }
                        cta={canModerate ? "Ir a recursos y tareas" : "Abrir tareas y entregas"}
                        onClick={() => handleResourceWorkspaceOpen()}
                        title={canModerate ? "Gestiona materiales y ejercicios" : "Resuelve tus tareas"}
                      />
                      <ActionCard
                        body={
                          canModerate
                            ? "Usa el foro para anuncios y acompanamiento del grupo."
                            : "El foro sirve para dudas y avisos; la entrega vive dentro del campus."
                        }
                        cta="Abrir soporte del curso"
                        onClick={() => handleTabChange("support")}
                        title={canModerate ? "Coordina la comunidad" : "Consulta dudas o avisos"}
                      />
                    </div>
                  </SurfaceCard>

                  <SurfaceCard
                    description="Vista activa del contenido seleccionado dentro del recorrido del curso."
                    title={currentModule ? currentModule.title : "Selecciona un modulo"}
                  >
                    {currentModule ? (
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge tone={currentModule.isCompleted ? "teacher" : "student"}>
                            {currentModule.isCompleted ? "Revisado" : "Pendiente"}
                          </Badge>
                          <Badge tone="muted">Modulo {currentModule.index + 1}</Badge>
                        </div>
                        <p className="text-[1.05rem] leading-8 text-[var(--color-ink)]">
                          {currentModule.description}
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <InfoPanel
                            body={currentModule.estimatedTime}
                            title="Tiempo estimado"
                          />
                          <InfoPanel
                            body={currentModule.resourcesSummary}
                            title="Recursos previstos"
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5">
                          <p className="text-sm leading-7 text-[var(--color-muted)]">
                            {currentModule.completedAt
                              ? `Marcado como revisado el ${formatDate(currentModule.completedAt)}.`
                              : "Todavia no has marcado este modulo como revisado."}
                          </p>
                          <CourseProgressToggleForm
                            courseSlug={course.slug}
                            isCompleted={currentModule.isCompleted}
                            moduleId={currentModule.id}
                            nextPath={`/mis-cursos/${course.slug}`}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-7 text-[var(--color-muted)]">
                        Cuando el curso tenga modulos, podras revisarlos y marcarlos desde aqui.
                      </p>
                    )}
                  </SurfaceCard>
                </div>

                <SurfaceCard
                  description="Selecciona cualquier modulo para abrir su detalle sin perder el contexto del campus."
                  title="Mapa de modulos"
                >
                  {progress.modules.length ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {progress.modules.map((module) => (
                        <ModuleRow
                          isSelected={module.index === selectedModuleIndex}
                          key={module.id}
                          meta={`${module.estimatedTime} · ${module.resourcesSummary}`}
                          onClick={() => setSelectedModuleIndex(module.index)}
                          stateLabel={
                            module.isCompleted
                              ? "Revisado"
                              : module.index === selectedModuleIndex
                                ? "Abierto"
                                : "Pendiente"
                          }
                          stateTone={
                            module.isCompleted
                              ? "teacher"
                              : module.index === selectedModuleIndex
                                ? "student"
                                : "muted"
                          }
                          title={`Modulo ${module.index + 1} · ${module.title}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
                      Este curso todavia no tiene modulos configurados.
                    </div>
                  )}
                </SurfaceCard>

                <SurfaceCard
                  description="Esta base editorial explica como se registra el progreso y como se combinan contenido, tareas y soporte."
                  title="Enfoque del curso"
                >
                  <div className="prose-copy max-w-none text-[1.05rem] leading-10 text-[var(--color-ink)]">
                    <p>{course.description}</p>
                    <p>
                      El progreso no se calcula por visionado, tiempo ni automatismos. Solo queda
                      registrado cuando tu mismo marcas un modulo como revisado dentro del campus.
                    </p>
                  </div>
                </SurfaceCard>
              </>
            ) : null}

            {activeTab === "resources" ? (
              <SurfaceCard
                className="scroll-mt-36"
                description={
                  canModerate
                    ? "Publica materiales, abre ejercicios y revisa entregas sin sacar al usuario del flujo academico."
                    : "Aqui se concentran materiales, tareas, entregas y feedback del curso."
                }
                id="resources-panel"
                title="Recursos y tareas"
              >
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                  <SummaryMetric
                    detail={
                      canModerate
                        ? "Ejercicios visibles para el alumnado."
                        : "Actividades pendientes o con cambios solicitados."
                    }
                    label="Ejercicios"
                    value={`${managedExercises.length}`}
                  />
                  <SummaryMetric
                    detail={
                      canModerate
                        ? "Entregas pendientes de revision."
                        : "Entregas actualmente en revision docente."
                    }
                    label={canModerate ? "Pendientes" : "En revision"}
                    value={`${canModerate ? teacherPendingReviews : studentUnderReviewExercises.length}`}
                  />
                  <SummaryMetric
                    detail="Guias, documentos y referencias del curso."
                    label="Materiales"
                    value={`${managedMaterials.length}`}
                  />
                </div>

                <CourseResourceManager
                  canModerate={canModerate}
                  course={course}
                  resources={resources}
                  roleLabel={roleLabel}
                />
              </SurfaceCard>
            ) : null}

            {activeTab === "support" ? (
              <>
                <SurfaceCard
                  description="El foro sirve para conversacion academica y avisos. Las incidencias de plataforma van por soporte."
                  title="Soporte y comunidad"
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    {forumCategories.length ? (
                      forumCategories.map((category) => (
                        <Link
                          className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)] hover:bg-white"
                          href={`/mis-cursos/${course.slug}/foro/${category.slug}`}
                          key={category.id}
                          prefetch
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-[var(--color-ink)]">
                                {category.title}
                              </p>
                              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                                {category.description}
                              </p>
                            </div>
                            <Badge tone="muted">{category._count.threads} hilos</Badge>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
                        Aun no hay categorias activas en el foro del curso.
                      </div>
                    )}
                  </div>
                </SurfaceCard>

                <div className="grid gap-6 lg:grid-cols-2">
                  <SurfaceCard title="Foro del curso">
                    <div className="space-y-4">
                      <InfoPanel
                        body="Ideal para anuncios, dudas sobre el contenido y acompanamiento de la comunidad del curso."
                        ctaHref={`/mis-cursos/${course.slug}/foro`}
                        ctaLabel="Abrir foro privado"
                        title="Conversacion academica"
                      />
                      <InfoPanel
                        body={
                          canModerate
                            ? "Usa el foro para dar contexto, fijar mensajes y responder preguntas recurrentes."
                            : "Participa en las categorias del curso cuando necesites aclaraciones o quieras seguir los avisos del equipo docente."
                        }
                        title="Uso recomendado"
                      />
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Soporte de plataforma">
                    <div className="space-y-4">
                      <InfoPanel
                        body={`Escribe a ${siteConfig.supportEmail} si el problema es de acceso, cuenta o incidencias tecnicas del campus.`}
                        ctaHref={`mailto:${siteConfig.supportEmail}`}
                        ctaLabel="Contactar soporte"
                        title="Incidencias tecnicas"
                      />
                      <InfoPanel
                        body="Las tareas y entregas no se resuelven por aqui: viven dentro de la pestana de recursos y tareas."
                        title="Separacion clara de canales"
                      />
                    </div>
                  </SurfaceCard>
                </div>
              </>
            ) : null}
          </div>

          <aside className="xl:sticky xl:top-[9.5rem] xl:self-start">
            <div className="space-y-4">
              <SurfaceCard
                className="p-5"
                description="Resumen permanente del estado del curso para no perder contexto al navegar por el campus."
                title="Centro de control"
              >
                <div className="space-y-4">
                  <InfoPanel
                    body={
                      canModerate
                        ? `${managedExercises.length} ejercicios activos y ${teacherPendingReviews} entregas pendientes de revision.`
                        : `${studentOpenExercises.length} tareas abiertas y ${studentUnderReviewExercises.length} entregas en revision.`
                    }
                    title={canModerate ? "Actividad docente" : "Actividad del alumno"}
                  />
                  <InfoPanel
                    body={
                      currentModule
                        ? `${currentModule.title}${currentModule.isCompleted ? " ya esta revisado." : " sigue pendiente de revision."}`
                        : "Todavia no hay un modulo seleccionado."
                    }
                    title="Modulo en foco"
                  />
                  <InfoPanel
                    body={
                      canModerate
                        ? "El seguimiento docente se completa desde recursos, entregas y supervision."
                        : "Tu avance se consolida cuando marcas modulos como revisados y entregas actividades en el campus."
                    }
                    title="Como se registra el progreso"
                  />
                </div>
              </SurfaceCard>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
