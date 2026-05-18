"use client";

import Link from "next/link";
import { CourseArtwork } from "@/components/course-artwork";
import { CampusProgressBar } from "@/components/campus/campus-progress-bar";
import { CourseProgressToggleForm } from "@/components/learning/course-progress-toggle-form";
import { CourseResourceManager } from "@/components/learning/course-resource-manager";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
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
        <button
          className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          onClick={input.onClearFocus}
          type="button"
        >
          Ver todas las tareas
        </button>
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
  return (
    <SurfaceCard
      description="El campus abre directamente en la leccion activa para que el alumno entre por contenido, no por un panel vacio."
      title="Leccion activa"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={input.canModerate ? "teacher" : "student"}>{input.roleLabel}</Badge>
            {input.currentModule ? <Badge tone="muted">Modulo {input.currentModule.index + 1}</Badge> : null}
            {input.editionLabel ? <Badge tone="muted">{input.editionLabel}</Badge> : null}
          </div>
          <div>
            <h2 className="text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.07em] text-[var(--color-ink)]">
              {input.currentModule ? input.currentModule.title : input.course.title}
            </h2>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-8 text-[var(--color-muted)]">
              {input.currentModule
                ? input.currentModule.description
                : "Selecciona un modulo para abrir una leccion con contenido y tarea asociada."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {input.currentModulePrimaryMaterial ? (
              <button
                className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(12,113,195,0.18)] transition duration-200 hover:bg-[var(--color-primary-strong)]"
                onClick={input.onOpenCurrentLesson}
                type="button"
              >
                Abrir leccion
              </button>
            ) : null}
            {input.currentModuleExercises[0] ? (
              <button
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                onClick={input.onOpenCurrentExercise}
                type="button"
              >
                {input.canModerate ? "Abrir tarea del modulo" : "Ir a la actividad"}
              </button>
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
            detail="Materiales asociados al modulo actual."
            label="Materiales"
            value={`${input.currentModuleMaterials.length}`}
          />
          <SummaryMetric
            detail={
              input.canModerate
                ? "Actividades del modulo actual para seguimiento."
                : "Tareas ligadas a esta leccion."
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
            <Badge tone={canModerate ? "teacher" : "student"}>{roleLabel}</Badge>
            <Badge tone="muted">{course.level}</Badge>
            <Badge tone="muted">{course.format}</Badge>
          </div>

          <div>
            <h2 className="text-[3rem] font-semibold leading-[0.96] tracking-[-0.08em] text-[var(--color-ink)] lg:text-[3.15rem]">
              {primarySummary.title}
            </h2>
            <p className="mt-3 max-w-3xl text-[1rem] leading-7 text-[var(--color-muted)]">
              {primarySummary.body}
            </p>
            {editionLabel ? (
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Edicion activa: <strong className="text-[var(--color-ink)]">{editionLabel}</strong>
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
            <div className="rounded-[22px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Progreso guardado
                  </p>
                  <p className="mt-1.5 text-[1.75rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {progress.completedModules} de {progress.totalModules} modulos revisados
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Ultima actividad
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
                <span>{progress.pendingModules} modulos pendientes</span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2.5">
            <button
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(12,113,195,0.18)] transition duration-200 hover:bg-[var(--color-primary-strong)]"
              onClick={onOpenResources}
              type="button"
            >
              {canModerate ? "Gestionar recursos y tareas" : "Abrir tareas del curso"}
            </button>
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
            <CourseArtwork className="h-[17rem] w-full rounded-[24px] border-0" course={course} variant="hero" />

            <div className="rounded-[22px] border border-[rgba(12,113,195,0.12)] bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Estado del curso
              </p>
              <p className="mt-2.5 text-sm leading-6 text-[var(--color-ink)]">
                {progress.isCompleted
                  ? "Todo el recorrido del curso ya figura como revisado."
                  : progress.hasStarted
                    ? `Ya has avanzado sobre ${progress.completedModules} modulos y puedes continuar desde el contenido o las tareas pendientes.`
                    : "Aun no has registrado avance. Empieza por el primer modulo o abre la zona de recursos para revisar tareas activas."}
              </p>
            </div>

            {!canModerate && (currentModulePrimaryMaterial || currentModuleExercises.length > 0) ? (
              <div className="rounded-[22px] border border-[rgba(12,113,195,0.12)] bg-white p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Acceso directo
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {currentModulePrimaryMaterial ? (
                    <button
                      className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]"
                      onClick={onOpenCurrentLesson}
                      type="button"
                    >
                      Abrir leccion
                    </button>
                  ) : null}
                  {currentModuleExercises[0] ? (
                    <button
                      className="inline-flex items-center justify-center rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                      onClick={onOpenCurrentExercise}
                      type="button"
                    >
                      Ir a la actividad
                    </button>
                  ) : null}
                </div>
                {currentModule ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    {currentModuleMaterials.length} materiales y {currentModuleExercises.length} tareas ligados al modulo actual.
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
  return (
    <>
      <div
        className={cn(
          "grid gap-5",
          simpleMode ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)]"
        )}
      >
        <SurfaceCard
          description="Cada modulo agrupa su explicacion, material principal y tarea asociada dentro de una misma leccion."
          id="content-current-module"
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
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <div className="space-y-5">
                  <p className="text-[1.02rem] leading-7 text-[var(--color-ink)]">
                    {currentModule.description}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoPanel body={currentModule.estimatedTime} title="Tiempo estimado" />
                    <InfoPanel body={currentModule.resourcesSummary} title="Recursos previstos" />
                  </div>
                  <ModuleLessonPreview resource={currentModulePrimaryMaterial} />
                </div>

                <div className="space-y-4">
                  <div className="rounded-[20px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                      Leccion del modulo
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                      Aqui tienes el contenido principal del modulo y, debajo, las tareas asociadas para que el recorrido sea lineal y facil de seguir.
                    </p>
                  </div>

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
                      badge={canModerate ? "Tarea del modulo" : "Actividad del modulo"}
                      body={
                        canModerate
                          ? `${resource.submissionStats?.pending ?? 0} entregas pendientes de revision.`
                          : !resource.viewerSubmission
                            ? "Todavia no has registrado tu entrega en esta actividad."
                            : resource.viewerSubmission.status === "CHANGES_REQUESTED"
                              ? "Hay cambios solicitados. Abre la tarea para revisar el feedback y enviar una nueva version."
                              : resource.viewerSubmission.status === "SUBMITTED"
                                ? "La entrega ya esta enviada y espera revision docente."
                                : "La actividad ya tiene revision registrada dentro del campus."
                      }
                      ctaLabel={canModerate ? "Abrir tarea del modulo" : "Abrir entrega"}
                      key={resource.id}
                      onClick={() => onOpenResourceWorkspace(`resource-${resource.id}`)}
                      title={resource.title}
                    />
                  ))}

                  {!currentModuleMaterials.length && !currentModuleExercises.length ? (
                    <div className="rounded-[20px] border border-dashed border-[rgba(12,113,195,0.18)] bg-white p-4 text-sm leading-6 text-[var(--color-muted)]">
                      Este modulo todavia no tiene materiales ni tareas ligados de forma explicita.
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4">
                <p className="text-sm leading-6 text-[var(--color-muted)]">
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

        {!simpleMode ? (
          <SurfaceCard
            id="content-workflow"
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
                onClick={() => onOpenWorkspaceTarget("content", "content-current-module")}
                title={canModerate ? "Valida el recorrido del campus" : "Empieza por el contenido"}
              />
              <ActionCard
                body={
                  canModerate
                    ? `${managedExercisesCount} ejercicios activos y ${teacherPendingReviews} entregas pendientes de revision.`
                    : `${studentOpenExercisesCount} tareas abiertas y ${studentUnderReviewExercisesCount} entregas en revision.`
                }
                cta={canModerate ? "Ir a recursos y tareas" : "Abrir tareas y entregas"}
                onClick={() => onOpenResourceWorkspace()}
                title={canModerate ? "Gestiona materiales y ejercicios" : "Resuelve tus tareas"}
              />
              <ActionCard
                body={
                  canModerate
                    ? "Usa el foro para anuncios y acompanamiento del grupo."
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
        description="Selecciona cualquier modulo para abrir su detalle sin perder el contexto del campus."
        id="content-module-map"
        title="Mapa de modulos"
      >
        {progress.modules.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {progress.modules.map((module) => {
              const moduleResources = managedResourcesByModuleId.get(module.id) ?? [];
              const moduleMaterialsCount = moduleResources.filter((resource) => !resource.isExercise).length;
              const moduleExercisesCount = moduleResources.filter((resource) => resource.isExercise).length;

              return (
                <ModuleRow
                  isSelected={module.index === selectedModuleIndex}
                  key={module.id}
                  meta={`${module.estimatedTime} · ${module.resourcesSummary}${
                    moduleResources.length > 0
                      ? ` · ${moduleMaterialsCount} materiales · ${moduleExercisesCount} tareas`
                      : ""
                  }`}
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
                      ? "teacher"
                      : module.index === selectedModuleIndex
                        ? "student"
                        : "muted"
                  }
                  title={`Modulo ${module.index + 1} · ${module.title}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] p-4 text-sm leading-6 text-[var(--color-muted)]">
            Este curso todavia no tiene modulos configurados.
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
              El progreso no se calcula por visionado, tiempo ni automatismos. Solo queda registrado cuando tu mismo marcas un modulo como revisado dentro del campus.
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
          ? "Vista centrada en una tarea concreta. La entrega, el feedback y el estado viven en esta misma pagina."
          : canModerate
            ? "Publica materiales, abre ejercicios y revisa entregas sin sacar al usuario del flujo academico."
            : "Aqui se concentran materiales, tareas, entregas y feedback del curso."
      }
      id="resources-panel"
      title={isFocusedTaskWorkspace ? "Tarea abierta" : "Recursos y tareas"}
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
                ? "Entregas pendientes de revision."
                : "Entregas actualmente en revision docente."
            }
            label={canModerate ? "Pendientes" : "En revision"}
            value={`${canModerate ? teacherPendingReviews : studentUnderReviewExercisesCount}`}
          />
          <SummaryMetric
            detail="Guias, documentos y referencias del curso."
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
        description="El foro sirve para conversacion academica y avisos. Las incidencias de plataforma van por soporte."
        id="support-forum-categories"
        title="Soporte y comunidad"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {forumCategories.length ? (
            forumCategories.map((category) => (
              <Link
                className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)] hover:bg-white"
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
              ctaHref={`/mis-cursos/${courseSlug}/foro`}
              ctaLabel="Abrir foro privado"
              title="Conversacion academica"
            />
            {!simpleMode ? (
              <InfoPanel
                body={
                  canModerate
                    ? "Usa el foro para dar contexto, fijar mensajes y responder preguntas recurrentes."
                    : "Participa en las categorias del curso cuando necesites aclaraciones o quieras seguir los avisos del equipo docente."
                }
                title="Uso recomendado"
              />
            ) : null}
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
            {!simpleMode ? (
              <InfoPanel
                body="Las tareas y entregas no se resuelven por aqui: viven dentro de la pestana de recursos y tareas."
                title="Separacion clara de canales"
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
                  ? `${managedExercisesCount} ejercicios activos y ${teacherPendingReviews} entregas pendientes de revision.`
                  : `${studentOpenExercisesCount} tareas abiertas y ${studentUnderReviewExercisesCount} entregas en revision.`
              }
              ctaLabel={canModerate ? "Ir a gestion" : "Abrir tareas"}
              onAction={() => onOpenWorkspaceTarget("resources", primaryResourceTargetId)}
              title={canModerate ? "Actividad docente" : "Actividad del alumno"}
            />
            <InfoPanel
              body={
                currentModule
                  ? `${currentModule.title}${currentModule.isCompleted ? " ya esta revisado." : " sigue pendiente de revision."}`
                  : "Todavia no hay un modulo seleccionado."
              }
              ctaLabel="Ir al modulo"
              onAction={() => onOpenWorkspaceTarget("content", "content-current-module")}
              title="Modulo en foco"
            />
            <InfoPanel
              body={
                canModerate
                  ? "El seguimiento docente se completa desde recursos, entregas y supervision."
                  : "Tu avance se consolida cuando marcas modulos como revisados y entregas actividades en el campus."
              }
              ctaLabel={canModerate ? "Abrir seguimiento" : "Ver recorrido"}
              onAction={() => {
                if (canModerate) {
                  window.location.assign(`/mis-cursos/${courseSlug}/seguimiento`);
                  return;
                }

                onOpenWorkspaceTarget("content", "content-workflow");
              }}
              title="Como se registra el progreso"
            />
          </div>
        </SurfaceCard>
      </div>
    </aside>
  );
}
