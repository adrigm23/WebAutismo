"use client";

import Link from "next/link";
import { CourseArtwork } from "@/components/course-artwork";
import { CampusProgressBar } from "@/components/campus/campus-progress-bar";
import { CourseProgressToggleForm } from "@/components/learning/course-progress-toggle-form";
import { CourseResourceManager } from "@/components/learning/course-resource-manager";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { buildCourseContentHref, buildCourseTrackingHref } from "@/lib/course-navigation";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CampusResourceItem } from "@/lib/course-resources";
import { siteConfig } from "@/lib/site";
import { cn, formatDate } from "@/lib/utils";
import { ModuleLessonPreview } from "./resource-preview";
import {
  ActionCard,
  InfoPanel,
  ModuleResourceCard,
  ModuleRow,
  SummaryMetric,
  SurfaceCard
} from "./primitives";
import type {
  HeroMetric,
  LearningShellForumCategory,
  LearningShellModule
} from "./types";

type CourseLearningHeroProps = {
  course: CatalogCourse;
  roleLabel: string;
  canModerate: boolean;
  editionLabel?: string | null;
  accessUntil?: Date | null;
  progress: {
    completedModules: number;
    completionRate: number;
    pendingModules: number;
    hasStarted: boolean;
    isCompleted: boolean;
    lastCompletedAt: Date | null;
    totalModules: number;
  };
  nextPendingModule: LearningShellModule | null;
  currentModule: LearningShellModule | null;
  currentModuleMaterials: CampusResourceItem[];
  currentModuleExercises: CampusResourceItem[];
  currentModulePrimaryMaterial: CampusResourceItem | null;
  primarySummary: {
    title: string;
    body: string;
  };
  heroMetrics: HeroMetric[];
  nextReviewSubmissionId: string | null;
  onOpenCurrentLesson: () => void;
  onOpenCurrentExercise: () => void;
  onOpenResources: () => void;
  simpleMode: boolean;
};

type CourseLearningContentTabProps = {
  course: CatalogCourse;
  progress: {
    modules: LearningShellModule[];
  };
  canModerate: boolean;
  nextPendingModule: LearningShellModule | null;
  currentModule: LearningShellModule | null;
  currentModuleMaterials: CampusResourceItem[];
  currentModuleExercises: CampusResourceItem[];
  currentModulePrimaryMaterial: CampusResourceItem | null;
  managedResourcesByModuleId: Map<string, CampusResourceItem[]>;
  selectedModuleIndex: number;
  managedExercisesCount: number;
  teacherPendingReviews: number;
  studentOpenExercisesCount: number;
  studentUnderReviewExercisesCount: number;
  onOpenWorkspaceTarget: (tab: "content" | "resources" | "support", targetId: string) => void;
  onOpenResourceWorkspace: (targetId?: string) => void;
  onSelectModule: (index: number) => void;
  simpleMode: boolean;
};

type CourseLearningResourcesTabProps = {
  canModerate: boolean;
  course: CatalogCourse;
  resources: CampusResourceItem[];
  roleLabel: string;
  managedExercisesCount: number;
  managedMaterialsCount: number;
  teacherPendingReviews: number;
  studentUnderReviewExercisesCount: number;
  focusedStudentExerciseId: string | null;
  isFocusedTaskWorkspace: boolean;
  onExitFocus: () => void;
  simpleMode: boolean;
};

type CourseLearningSupportTabProps = {
  courseSlug: string;
  canModerate: boolean;
  forumCategories: LearningShellForumCategory[];
  simpleMode: boolean;
};

type CourseLearningAsideProps = {
  courseSlug: string;
  canModerate: boolean;
  currentModule: LearningShellModule | null;
  managedExercisesCount: number;
  teacherPendingReviews: number;
  studentOpenExercisesCount: number;
  studentUnderReviewExercisesCount: number;
  primaryResourceTargetId: string;
  onOpenWorkspaceTarget: (tab: "content" | "resources" | "support", targetId: string) => void;
};

export function FocusedTaskIntro(input: {
  courseSlug: string;
  onClearFocus: () => void;
}) {
  return (
    <SurfaceCard
      description="Has abierto una tarea concreta. El campus entra en modo de foco para que entregues o revises sin distracciones."
      title="Entrega del ejercicio"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={input.onClearFocus} type="button" variant="secondary">
          Ver todas las tareas
        </Button>
        <ButtonLink href={buildCourseContentHref(input.courseSlug)} prefetch variant="ghost">
          Volver al contenido
        </ButtonLink>
        <ButtonLink href={`/mis-cursos/${input.courseSlug}/foro`} prefetch variant="ghost">
          Abrir foro privado
        </ButtonLink>
      </div>
    </SurfaceCard>
  );
}

export function CompactLessonHeader(input: {
  course: CatalogCourse;
  roleLabel: string;
  canModerate: boolean;
  editionLabel?: string | null;
  currentModule: LearningShellModule | null;
  currentModuleMaterials: CampusResourceItem[];
  currentModuleExercises: CampusResourceItem[];
  currentModulePrimaryMaterial: CampusResourceItem | null;
  onOpenCurrentLesson: () => void;
  onOpenCurrentExercise: () => void;
}) {
  if (!input.canModerate) {
    const primaryAction = input.currentModulePrimaryMaterial
      ? {
          label: "Continuar lección",
          onClick: input.onOpenCurrentLesson
        }
      : input.currentModuleExercises[0]
        ? {
            label: "Abrir tarea",
            onClick: input.onOpenCurrentExercise
          }
        : {
            label: "Seguir con el contenido",
            onClick: input.onOpenCurrentLesson
          };
    const secondaryAction =
      input.currentModulePrimaryMaterial && input.currentModuleExercises[0]
        ? {
            label: "Abrir tarea",
            onClick: input.onOpenCurrentExercise
          }
        : null;

    return (
      <SurfaceCard
        description="Tu punto de entrada es la lección actual. Desde aquí sigues el contenido y pasas a la tarea sin cambiar de contexto."
        title="Lección activa"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
          <div className="space-y-4">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              {input.currentModule
                ? `Módulo ${input.currentModule.index + 1}${input.editionLabel ? ` | ${input.editionLabel}` : ""}`
                : input.course.title}
            </p>
            <div>
              <h2 className="text-display-lg font-semibold text-[var(--color-ink)]">
                {input.currentModule ? input.currentModule.title : input.course.title}
              </h2>
              <p className="mt-3 max-w-3xl text-body-lg text-[var(--color-muted)]">
                {input.currentModule
                  ? input.currentModule.description
                  : "Selecciona un módulo para abrir una lección con contenido y tarea asociada."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={primaryAction.onClick} type="button">
                {primaryAction.label}
              </Button>
              {secondaryAction ? (
                <Button onClick={secondaryAction.onClick} type="button" variant="secondary">
                  {secondaryAction.label}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Siguiente acción
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
              {primaryAction?.label ?? "Revisar contenido del curso"}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              {input.currentModule
                ? `${input.currentModule.estimatedTime} | ${input.currentModuleMaterials.length} materiales | ${input.currentModuleExercises.length} tareas.`
                : "Todavía no hay una lección activa configurada para este curso."}
            </p>
            {input.currentModuleExercises[0] ? (
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                La actividad del módulo sigue disponible dentro de la pestaña de tareas cuando la necesites.
              </p>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      description="El campus abre directamente en la lección activa para que el alumno entre por contenido, no por un panel vacío."
      title="Lección activa"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={input.canModerate ? "info" : "warning"}>{input.roleLabel}</Badge>
            {input.currentModule ? <Badge tone="outline">Módulo {input.currentModule.index + 1}</Badge> : null}
            {input.editionLabel ? <Badge tone="outline">{input.editionLabel}</Badge> : null}
          </div>
          <div>
            <h2 className="text-display-lg font-semibold text-[var(--color-ink)]">
              {input.currentModule ? input.currentModule.title : input.course.title}
            </h2>
            <p className="mt-3 max-w-3xl text-body-lg text-[var(--color-muted)]">
              {input.currentModule
                ? input.currentModule.description
                : "Selecciona un módulo para abrir una lección con contenido y tarea asociada."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {input.currentModulePrimaryMaterial ? (
              <Button onClick={input.onOpenCurrentLesson} type="button">
                Abrir lección
              </Button>
            ) : null}
            {input.currentModuleExercises[0] ? (
              <Button onClick={input.onOpenCurrentExercise} type="button" variant="secondary">
                {input.canModerate ? "Abrir tarea del módulo" : "Ir a la actividad"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <SummaryMetric
            detail={input.currentModule?.estimatedTime ?? "Sin tiempo estimado configurado."}
            label="Tiempo"
            value={input.currentModule ? input.currentModule.estimatedTime : "N/D"}
          />
          <SummaryMetric
            detail="Materiales asociados al módulo actual."
            label="Materiales"
            value={`${input.currentModuleMaterials.length}`}
          />
          <SummaryMetric
            detail={
              input.canModerate
                ? "Actividades del módulo actual para seguimiento."
                : "Tareas ligadas a esta lección."
            }
            label="Tareas"
            value={`${input.currentModuleExercises.length}`}
          />
        </div>
      </div>
    </SurfaceCard>
  );
}

export function CourseLearningHero({
  course,
  roleLabel,
  canModerate,
  editionLabel,
  accessUntil,
  progress,
  nextPendingModule,
  currentModule,
  currentModuleMaterials,
  currentModuleExercises,
  currentModulePrimaryMaterial,
  primarySummary,
  heroMetrics,
  nextReviewSubmissionId,
  onOpenCurrentLesson,
  onOpenCurrentExercise,
  onOpenResources,
  simpleMode
}: CourseLearningHeroProps) {
  const visibleHeroMetrics = canModerate && simpleMode ? heroMetrics.slice(0, 2) : heroMetrics;

  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div
        className={cn(
          "grid gap-0",
          simpleMode ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]"
        )}
      >
        <div className="space-y-5 p-5 lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={canModerate ? "info" : "warning"}>{roleLabel}</Badge>
            <Badge tone="outline">{course.level}</Badge>
            <Badge tone="outline">{course.format}</Badge>
          </div>

          <div>
            <h2 className="text-display-lg font-semibold text-[var(--color-ink)] lg:text-display-xl">
              {primarySummary.title}
            </h2>
            <p className="mt-3 max-w-3xl text-body-lg text-[var(--color-muted)]">
              {primarySummary.body}
            </p>
            {editionLabel ? (
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Edición activa: <strong className="text-[var(--color-ink)]">{editionLabel}</strong>
                {accessUntil ? ` | Acceso previsto hasta ${formatDate(accessUntil)}` : ""}
              </p>
            ) : null}
          </div>

          {canModerate ? (
            <div className="grid gap-4 md:grid-cols-3">
              {visibleHeroMetrics.map((metric) => (
                <SummaryMetric
                  detail={metric.detail}
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
            </div>
          ) : (
            <CampusProgressBar
              completedModules={progress.completedModules}
              completionRate={progress.completionRate}
              nextModuleLabel={nextPendingModule?.title ?? null}
              totalModules={progress.totalModules}
            />
          )}

          {canModerate ? (
            <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Progreso guardado
                  </p>
                  <p className="mt-1.5 text-[1.75rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {progress.completedModules} de {progress.totalModules} módulos revisados
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Última actividad
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-[var(--color-ink)]">
                    {progress.lastCompletedAt ? formatDate(progress.lastCompletedAt) : "Sin actividad"}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
                <div
                  aria-hidden="true"
                  className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                  style={{ width: `${progress.completionRate}%` }}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                <span>{progress.completionRate}% marcado como revisado</span>
                <span>{progress.pendingModules} módulos pendientes</span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2.5">
            <Button onClick={onOpenResources} type="button">
              {canModerate ? "Gestionar recursos y tareas" : "Abrir tareas del curso"}
            </Button>
            <ButtonLink href={`/mis-cursos/${course.slug}/foro`} prefetch variant="secondary">
              Abrir foro privado
            </ButtonLink>
            {canModerate ? (
              <ButtonLink
                href={buildCourseTrackingHref({
                  courseSlug: course.slug,
                  submissionId: nextReviewSubmissionId
                })}
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

        <div
          className={cn(
            "border-t border-[rgba(12,113,195,0.08)] bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f8_100%)] p-5 lg:p-6",
            simpleMode ? "lg:border-l-0 lg:border-t" : "lg:border-l lg:border-t-0"
          )}
        >
          <div className="space-y-4">
            <CourseArtwork className="h-[17rem] w-full rounded-[var(--radius-lg)] border-0" course={course} variant="hero" />

            <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Estado del curso
              </p>
              <p className="mt-2.5 text-sm leading-6 text-[var(--color-ink)]">
                {progress.isCompleted
                  ? "Todo el recorrido del curso ya figura como revisado."
                  : progress.hasStarted
                    ? `Ya has avanzado sobre ${progress.completedModules} módulos y puedes continuar desde el contenido o las tareas pendientes.`
                    : "Aún no has registrado avance. Empieza por el primer módulo o abre la zona de recursos para revisar tareas activas."}
              </p>
            </div>

            {!canModerate && (currentModulePrimaryMaterial || currentModuleExercises.length > 0) ? (
              <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-white p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Acceso directo
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {currentModulePrimaryMaterial ? (
                    <Button onClick={onOpenCurrentLesson} type="button">
                      Abrir lección
                    </Button>
                  ) : null}
                  {currentModuleExercises[0] ? (
                    <Button onClick={onOpenCurrentExercise} type="button" variant="secondary">
                      Ir a la actividad
                    </Button>
                  ) : null}
                </div>
                {currentModule ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    {currentModuleMaterials.length} materiales y {currentModuleExercises.length} tareas ligados al módulo actual.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

export function CourseLearningContentTab({
  course,
  progress,
  canModerate,
  nextPendingModule,
  currentModule,
  currentModuleMaterials,
  currentModuleExercises,
  currentModulePrimaryMaterial,
  managedResourcesByModuleId,
  selectedModuleIndex,
  managedExercisesCount,
  teacherPendingReviews,
  studentOpenExercisesCount,
  studentUnderReviewExercisesCount,
  onOpenWorkspaceTarget,
  onOpenResourceWorkspace,
  onSelectModule,
  simpleMode
}: CourseLearningContentTabProps) {
  const isStudentLessonFirst = !canModerate;

  return (
    <>
      <div
        className={cn(
          "grid gap-5",
          simpleMode ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)]"
        )}
      >
        <SurfaceCard
          description={
            canModerate
              ? "Cada módulo agrupa su explicación, material principal y tarea asociada dentro de una misma lección."
              : "Contenido, materiales y tarea del módulo actual dentro del mismo flujo."
          }
          id="content-current-module"
          title={
            canModerate
              ? currentModule
                ? currentModule.title
                : "Selecciona un módulo"
              : "Contenido de la lección"
          }
        >
          {currentModule ? (
            <div className="space-y-5">
              {canModerate ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={currentModule.isCompleted ? "success" : "warning"}>
                    {currentModule.isCompleted ? "Revisado" : "Pendiente"}
                  </Badge>
                  <Badge tone="outline">Módulo {currentModule.index + 1}</Badge>
                </div>
              ) : (
                <p className="text-sm font-medium text-[var(--color-muted)]">
                  Módulo {currentModule.index + 1} | {currentModule.estimatedTime}
                </p>
              )}
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <div className="space-y-5">
                  <p className="text-body-lg text-[var(--color-ink)]">
                    {currentModule.description}
                  </p>
                  {canModerate ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoPanel body={currentModule.estimatedTime} title="Tiempo estimado" />
                      <InfoPanel body={currentModule.resourcesSummary} title="Recursos previstos" />
                    </div>
                  ) : (
                    <p className="text-sm leading-7 text-[var(--color-muted)]">
                      {currentModule.resourcesSummary}
                    </p>
                  )}
                  <ModuleLessonPreview resource={currentModulePrimaryMaterial} />
                </div>

                <div className="space-y-4">
                  {canModerate ? (
                    <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                        Lección del módulo
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                        Aquí tienes el contenido principal del módulo y, debajo, las tareas asociadas para que el recorrido sea lineal y fácil de seguir.
                      </p>
                    </div>
                  ) : null}

                  {currentModuleMaterials.slice(1).map((resource) => (
                    <ModuleResourceCard
                      badge="Material complementario"
                      body={resource.description}
                      ctaLabel={resource.isExternal ? "Abrir material" : "Descargar material"}
                      key={resource.id}
                      onClick={() => {
                        if (resource.href) {
                          window.open(resource.href, resource.isExternal ? "_blank" : "_self");
                        }
                      }}
                      title={resource.title}
                    />
                  ))}

                  {currentModuleExercises.map((resource) => (
                    <ModuleResourceCard
                      badge={canModerate ? "Tarea del módulo" : "Actividad del módulo"}
                      body={
                        canModerate
                          ? `${resource.submissionStats?.pending ?? 0} entregas pendientes de revisión.`
                          : !resource.viewerSubmission
                            ? "Todavía no has registrado tu entrega en esta actividad."
                            : resource.viewerSubmission.status === "CHANGES_REQUESTED"
                              ? "Hay cambios solicitados. Abre la tarea para revisar el feedback y enviar una nueva versión."
                              : resource.viewerSubmission.status === "SUBMITTED"
                                ? "La entrega ya está enviada y espera revisión docente."
                                : "La actividad ya tiene revisión registrada dentro del campus."
                      }
                      ctaLabel={canModerate ? "Abrir tarea del módulo" : "Abrir entrega"}
                      key={resource.id}
                      onClick={() => onOpenResourceWorkspace(`resource-${resource.id}`)}
                      title={resource.title}
                    />
                  ))}

                  {!currentModuleMaterials.length && !currentModuleExercises.length ? (
                    <div className="ui-empty-state p-4 text-sm leading-6 text-[var(--color-muted)]">
                      Este módulo todavía no tiene materiales ni tareas ligados de forma explícita.
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4">
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  {currentModule.completedAt
                    ? `Marcado como revisado el ${formatDate(currentModule.completedAt)}.`
                    : "Todavía no has marcado este módulo como revisado."}
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
              Cuando el curso tenga módulos, podrás revisarlos y marcarlos desde aquí.
            </p>
          )}
        </SurfaceCard>

        {!simpleMode ? (
          <SurfaceCard
            id="content-workflow"
            description={
              canModerate
                ? "Este recorrido resume dónde debe ocurrir cada acción del campus para que la experiencia sea clara."
                : "Sigue este orden para no perder contexto entre módulos, tareas y soporte."
            }
            title="Ruta de trabajo"
          >
            <div className="space-y-4">
              <ActionCard
                body={
                  nextPendingModule
                    ? `Continua por ${nextPendingModule.title} y marca el avance cuando termines.`
                    : "No hay módulos disponibles para revisar en este momento."
                }
                cta="Ver contenido actual"
                onClick={() => onOpenWorkspaceTarget("content", "content-current-module")}
                title={canModerate ? "Valida el recorrido del campus" : "Empieza por el contenido"}
              />
              <ActionCard
                body={
                  canModerate
                    ? `${managedExercisesCount} ejercicios activos y ${teacherPendingReviews} entregas pendientes de revisión.`
                    : `${studentOpenExercisesCount} tareas abiertas y ${studentUnderReviewExercisesCount} entregas en revisión.`
                }
                cta={canModerate ? "Ir a recursos y tareas" : "Abrir tareas y entregas"}
                onClick={() => onOpenResourceWorkspace()}
                title={canModerate ? "Gestiona materiales y ejercicios" : "Resuelve tus tareas"}
              />
              <ActionCard
                body={
                  canModerate
                    ? "Usa el foro para anuncios y acompañamiento del grupo."
                    : "El foro sirve para dudas y avisos; la entrega vive dentro del campus."
                }
                cta="Abrir soporte del curso"
                onClick={() => onOpenWorkspaceTarget("support", "support-forum-categories")}
                title={canModerate ? "Coordina la comunidad" : "Consulta dudas o avisos"}
              />
            </div>
          </SurfaceCard>
        ) : null}
      </div>

      <SurfaceCard
        description={
          isStudentLessonFirst
            ? "Si necesitas cambiar de punto, puedes saltar a otra lección del curso desde aquí."
            : "Selecciona cualquier módulo para abrir su detalle sin perder el contexto del campus."
        }
        id="content-module-map"
        title={isStudentLessonFirst ? "Secuencia del curso" : "Mapa de módulos"}
      >
        {progress.modules.length ? (
          <div className={cn("grid gap-3", isStudentLessonFirst ? "grid-cols-1" : "lg:grid-cols-2")}>
            {progress.modules.map((module) => {
              const moduleResources = managedResourcesByModuleId.get(module.id) ?? [];
              const moduleMaterialsCount = moduleResources.filter((resource) => !resource.isExercise).length;
              const moduleExercisesCount = moduleResources.filter((resource) => resource.isExercise).length;
              const moduleMeta = isStudentLessonFirst
                ? `${module.estimatedTime} | ${module.resourcesSummary}`
                : `${module.estimatedTime} · ${module.resourcesSummary}${
                    moduleResources.length > 0
                      ? ` · ${moduleMaterialsCount} materiales · ${moduleExercisesCount} tareas`
                      : ""
                  }`;

              return (
                <ModuleRow
                  isSelected={module.index === selectedModuleIndex}
                  key={module.id}
                  meta={moduleMeta}
                  onClick={() => onSelectModule(module.index)}
                  stateLabel={
                    module.isCompleted
                      ? "Revisado"
                      : module.index === selectedModuleIndex
                        ? "Abierto"
                        : "Pendiente"
                  }
                  stateTone={
                    module.isCompleted
                      ? "success"
                      : module.index === selectedModuleIndex
                        ? "brand"
                        : "outline"
                  }
                  title={`Módulo ${module.index + 1} | ${module.title}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="ui-empty-state p-4 text-sm leading-6 text-[var(--color-muted)]">
            Este curso todavía no tiene módulos configurados.
          </div>
        )}
      </SurfaceCard>

      {!simpleMode ? (
        <SurfaceCard
          description="Esta base editorial explica como se registra el progreso y como se combinan contenido, tareas y soporte."
          title="Enfoque del curso"
        >
          <div className="prose-copy max-w-none text-[1.05rem] leading-10 text-[var(--color-ink)]">
            <p>{course.description}</p>
            <p>
              El progreso no se calcula por visionado, tiempo ni automatismos. Solo queda registrado cuando tú mismo marcas un módulo como revisado dentro del campus.
            </p>
          </div>
        </SurfaceCard>
      ) : null}
    </>
  );
}

export function CourseLearningResourcesTab({
  canModerate,
  course,
  resources,
  roleLabel,
  managedExercisesCount,
  managedMaterialsCount,
  teacherPendingReviews,
  studentUnderReviewExercisesCount,
  focusedStudentExerciseId,
  isFocusedTaskWorkspace,
  onExitFocus,
  simpleMode
}: CourseLearningResourcesTabProps) {
  return (
    <SurfaceCard
      className="scroll-mt-36"
      description={
        isFocusedTaskWorkspace
          ? "Vista centrada en una tarea concreta. La entrega, el feedback y el estado viven en esta misma página."
          : canModerate
            ? "Publica materiales, abre ejercicios y revisa entregas sin sacar al usuario del flujo académico."
            : "Abre una tarea, registra tu entrega o consulta materiales del curso sin salir del campus."
      }
      id="resources-panel"
      title={isFocusedTaskWorkspace ? "Tarea abierta" : canModerate ? "Recursos y tareas" : "Tareas y recursos"}
    >
      {!isFocusedTaskWorkspace && !simpleMode ? (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryMetric
            detail={
              canModerate
                ? "Ejercicios visibles para el alumnado."
                : "Actividades pendientes o con cambios solicitados."
            }
            label="Ejercicios"
            value={`${managedExercisesCount}`}
          />
          <SummaryMetric
            detail={
              canModerate
                ? "Entregas pendientes de revisión."
                : "Entregas actualmente en revisión docente."
            }
            label={canModerate ? "Pendientes" : "En revisión"}
            value={`${canModerate ? teacherPendingReviews : studentUnderReviewExercisesCount}`}
          />
          <SummaryMetric
            detail="Guías, documentos y referencias del curso."
            label="Materiales"
            value={`${managedMaterialsCount}`}
          />
        </div>
      ) : null}

      <CourseResourceManager
        canModerate={canModerate}
        course={course}
        focusedResourceId={focusedStudentExerciseId}
        onExitFocus={onExitFocus}
        resources={resources}
        roleLabel={roleLabel}
      />
    </SurfaceCard>
  );
}

export function CourseLearningSupportTab({
  courseSlug,
  canModerate,
  forumCategories,
  simpleMode
}: CourseLearningSupportTabProps) {
  return (
    <>
      <SurfaceCard
        description="El foro sirve para conversación académica y avisos. Las incidencias de plataforma van por soporte."
        id="support-forum-categories"
        title="Soporte y comunidad"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {forumCategories.length ? (
            forumCategories.map((category) => (
              <Link
                className="rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)] hover:bg-white"
                href={`/mis-cursos/${courseSlug}/foro/${category.slug}`}
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
                  <Badge tone="outline">{category._count.threads} hilos</Badge>
                </div>
              </Link>
            ))
          ) : (
            <div className="ui-empty-state p-5 text-sm leading-7 text-[var(--color-muted)]">
              Aún no hay categorías activas en el foro del curso.
            </div>
          )}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard title="Foro del curso">
          <div className="space-y-4">
            <InfoPanel
              body="Ideal para anuncios, dudas sobre el contenido y acompañamiento de la comunidad del curso."
              ctaHref={`/mis-cursos/${courseSlug}/foro`}
              ctaLabel="Abrir foro privado"
              title="Conversación académica"
            />
            {!simpleMode ? (
              <InfoPanel
                body={
                  canModerate
                    ? "Usa el foro para dar contexto, fijar mensajes y responder preguntas recurrentes."
                    : "Participa en las categorías del curso cuando necesites aclaraciones o quieras seguir los avisos del equipo docente."
                }
                title="Uso recomendado"
              />
            ) : null}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Soporte de plataforma">
          <div className="space-y-4">
            <InfoPanel
              body={`Escribe a ${siteConfig.supportEmail} si el problema es de acceso, cuenta o incidencias técnicas del campus.`}
              ctaHref={`mailto:${siteConfig.supportEmail}`}
              ctaLabel="Contactar soporte"
              title="Incidencias técnicas"
            />
            {!simpleMode ? (
              <InfoPanel
                body="Las tareas y entregas no se resuelven por aquí: viven dentro de la pestaña de recursos y tareas."
                title="Separación clara de canales"
              />
            ) : null}
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}

export function CourseLearningAside({
  courseSlug,
  canModerate,
  currentModule,
  managedExercisesCount,
  teacherPendingReviews,
  studentOpenExercisesCount,
  studentUnderReviewExercisesCount,
  primaryResourceTargetId,
  onOpenWorkspaceTarget
}: CourseLearningAsideProps) {
  return (
    <aside className="xl:sticky xl:top-[8.25rem] xl:max-h-[calc(100vh-8.75rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
      <div className="space-y-4">
        <SurfaceCard
          className="p-4"
          description="Resumen permanente del estado del curso para no perder contexto al navegar por el campus."
          title="Centro de control"
        >
          <div className="space-y-4">
            <InfoPanel
              body={
                canModerate
                  ? `${managedExercisesCount} ejercicios activos y ${teacherPendingReviews} entregas pendientes de revisión.`
                  : `${studentOpenExercisesCount} tareas abiertas y ${studentUnderReviewExercisesCount} entregas en revisión.`
              }
              ctaLabel={canModerate ? "Ir a gestión" : "Abrir tareas"}
              onAction={() => onOpenWorkspaceTarget("resources", primaryResourceTargetId)}
              title={canModerate ? "Actividad docente" : "Actividad del alumno"}
            />
            <InfoPanel
              body={
                currentModule
                  ? `${currentModule.title}${currentModule.isCompleted ? " ya está revisado." : " sigue pendiente de revisión."}`
                  : "Todavía no hay un módulo seleccionado."
              }
              ctaLabel="Ir al módulo"
              onAction={() => onOpenWorkspaceTarget("content", "content-current-module")}
              title="Módulo en foco"
            />
            <InfoPanel
              body={
                canModerate
                  ? "El seguimiento docente se completa desde recursos, entregas y supervisión."
                  : "Tu avance se consolida cuando marcas módulos como revisados y entregas actividades en el campus."
              }
              ctaLabel={canModerate ? "Abrir seguimiento" : "Ver recorrido"}
              onAction={() => {
                if (canModerate) {
                  window.location.assign(`/mis-cursos/${courseSlug}/seguimiento`);
                  return;
                }

                onOpenWorkspaceTarget("content", "content-workflow");
              }}
              title="Cómo se registra el progreso"
            />
          </div>
        </SurfaceCard>
      </div>
    </aside>
  );
}
