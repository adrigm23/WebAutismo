"use client";

import Link from "next/link";
import { CourseProgressToggleForm } from "@/components/learning/course-progress-toggle-form";
import { CourseResourceManager } from "@/components/learning/course-resource-manager";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  buildCourseContentHref,
  buildCourseTrackingHref,
} from "@/lib/course-navigation";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CampusResourceItem } from "@/lib/course-resources";
import { siteConfig } from "@/lib/site";
import { cn, formatDate } from "@/lib/utils";
import { ModuleLessonPreview } from "./resource-preview";
import {
  InfoPanel,
  ModuleResourceCard,
  ModuleRow,
  SurfaceCard,
} from "./primitives";
import type { LearningShellForumCategory, LearningShellModule } from "./types";

type CourseLearningContentTabProps = {
  course: CatalogCourse;
  progress: {
    modules: LearningShellModule[];
  };
  canModerate: boolean;
  currentModule: LearningShellModule | null;
  currentModuleMaterials: CampusResourceItem[];
  currentModuleExercises: CampusResourceItem[];
  currentModulePrimaryMaterial: CampusResourceItem | null;
  managedResourcesByModuleId: Map<string, CampusResourceItem[]>;
  selectedModuleIndex: number;
  onOpenResourceWorkspace: (targetId?: string) => void;
  onSelectModule: (index: number) => void;
};

type CourseLearningResourcesTabProps = {
  canModerate: boolean;
  course: CatalogCourse;
  resources: CampusResourceItem[];
  roleLabel: string;
  focusedStudentExerciseId: string | null;
  isFocusedTaskWorkspace: boolean;
  onExitFocus: () => void;
};

type CourseLearningSupportTabProps = {
  courseSlug: string;
  forumCategories: LearningShellForumCategory[];
};

export function FocusedTaskIntro(input: {
  courseSlug: string;
  onClearFocus: () => void;
}) {
  return (
    <SurfaceCard
      description="Has abierto una tarea concreta para revisar o entregar sin salir del campus."
      title="Entrega del ejercicio"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={input.onClearFocus} type="button" variant="secondary">
          Ver todas las tareas
        </Button>
        <ButtonLink
          href={buildCourseContentHref(input.courseSlug)}
          prefetch
          variant="ghost"
        >
          Volver al contenido
        </ButtonLink>
        <ButtonLink
          href={`/mis-cursos/${input.courseSlug}/foro`}
          prefetch
          variant="ghost"
        >
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
  nextReviewSubmissionId: string | null;
  onOpenCurrentLesson: () => void;
  onOpenCurrentExercise: () => void;
  onOpenResources: () => void;
  onOpenSupport: () => void;
}) {
  if (!input.canModerate) {
    const hasCurrentResources =
      input.currentModuleMaterials.length > 0 ||
      input.currentModuleExercises.length > 0;
    const showExerciseShortcut = Boolean(
      input.currentModulePrimaryMaterial && input.currentModuleExercises[0],
    );
    const primaryAction = input.currentModulePrimaryMaterial
      ? {
          label: "Continuar contenido",
          onClick: input.onOpenCurrentLesson,
        }
      : input.currentModuleExercises[0]
        ? {
            label: "Abrir tarea",
            onClick: input.onOpenCurrentExercise,
          }
        : {
            label: "Ver recurso",
            onClick: input.onOpenResources,
          };

    return (
      <SurfaceCard
        description="Sigue la lección activa y abre la tarea cuando toque."
        title="Lección activa"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.72fr)]">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              {input.currentModule
                ? `Módulo ${input.currentModule.index + 1}${input.editionLabel ? ` | ${input.editionLabel}` : ""}`
                : input.course.title}
            </p>
            <div>
              <h2 className="text-display-lg font-semibold text-[var(--color-ink)]">
                {input.currentModule
                  ? input.currentModule.title
                  : input.course.title}
              </h2>
              <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
                {input.currentModule
                  ? input.currentModule.description
                  : "Todavía no hay una lección activa configurada para este curso."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button onClick={primaryAction.onClick} type="button">
                {primaryAction.label}
              </Button>
              {showExerciseShortcut ? (
                <Button
                  onClick={input.onOpenCurrentExercise}
                  type="button"
                  variant="secondary"
                >
                  Abrir tarea
                </Button>
              ) : null}
              {hasCurrentResources ? (
                <Button
                  onClick={input.onOpenResources}
                  type="button"
                  variant="ghost"
                >
                  Ver recursos
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Qué sigue después
            </p>
            <p className="mt-2.5 text-lg font-semibold text-[var(--color-ink)]">
              {input.currentModuleExercises[0]
                ? "Abre la actividad del módulo cuando termines el contenido."
                : "Continúa con la secuencia del curso desde la siguiente lección."}
            </p>
            <p className="mt-2 text-sm leading-5 text-[var(--color-muted)]">
              {input.currentModule
                ? `${input.currentModule.estimatedTime} | ${input.currentModuleMaterials.length} materiales | ${input.currentModuleExercises.length} tareas.`
                : "Cuando haya contenido, lo verás aquí con su siguiente paso inmediato."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={input.onOpenResources}
                type="button"
                variant="ghost"
              >
                Ir a recursos
              </Button>
              <Button
                onClick={input.onOpenSupport}
                type="button"
                variant="ghost"
              >
                Abrir comunidad
              </Button>
            </div>
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      description="Accesos directos para seguir el curso sin entrar en un panel."
      title="Acciones del curso"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(17rem,0.92fr)]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{input.roleLabel}</Badge>
            {input.currentModule ? (
              <Badge tone="outline">
                Módulo {input.currentModule.index + 1}
              </Badge>
            ) : null}
            {input.editionLabel ? (
              <Badge tone="outline">{input.editionLabel}</Badge>
            ) : null}
          </div>
          <div>
            <h2 className="text-display-md font-semibold text-[var(--color-ink)]">
              Revisa lo pendiente
            </h2>
            <p className="mt-2 text-sm leading-5 text-[var(--color-muted)]">
              Seguimiento, recursos, comunidad y lección activa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink
              href={buildCourseTrackingHref({
                courseSlug: input.course.slug,
                submissionId: input.nextReviewSubmissionId,
              })}
              prefetch
            >
              Ir a seguimiento
            </ButtonLink>
            <Button
              onClick={input.onOpenResources}
              type="button"
              variant="secondary"
            >
              Abrir recursos
            </Button>
            <Button onClick={input.onOpenSupport} type="button" variant="ghost">
              Abrir comunidad
            </Button>
            <Button
              onClick={input.onOpenCurrentLesson}
              type="button"
              variant="ghost"
            >
              Ver lección activa
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Lección activa
            </p>
            <p className="mt-2.5 text-lg font-semibold text-[var(--color-ink)]">
              {input.currentModule
                ? input.currentModule.title
                : input.course.title}
            </p>
            <p className="mt-2 text-sm leading-5 text-[var(--color-muted)]">
              {input.currentModule
                ? `${input.currentModule.estimatedTime} | ${input.currentModuleMaterials.length} materiales | ${input.currentModuleExercises.length} tareas.`
                : "Todavia no hay un modulo activo configurado para este curso."}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-white p-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Donde continuar
            </p>
            <p className="mt-2 text-sm leading-5 text-[var(--color-muted)]">
              {input.currentModuleExercises[0]
                ? "Abre la tarea del modulo desde recursos o desde el contenido."
                : "Continua desde seguimiento o desde el contenido del modulo."}
            </p>
            {input.currentModuleExercises[0] ? (
              <div className="mt-3">
                <Button
                  onClick={input.onOpenCurrentExercise}
                  type="button"
                  variant="secondary"
                >
                  Abrir tarea del modulo
                </Button>
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
  currentModule,
  currentModuleMaterials,
  currentModuleExercises,
  currentModulePrimaryMaterial,
  managedResourcesByModuleId,
  selectedModuleIndex,
  onOpenResourceWorkspace,
  onSelectModule,
}: CourseLearningContentTabProps) {
  const isStudentLessonFirst = !canModerate;

  return (
    <>
      <SurfaceCard
        description={
          canModerate
            ? "Contenido y tareas del modulo activo en el mismo recorrido."
            : "Continua la leccion activa antes de pasar a tareas o recursos."
        }
        id="content-current-module"
        title={canModerate ? "Contenido del modulo" : "Contenido de la leccion"}
      >
        {currentModule ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={currentModule.isCompleted ? "success" : "warning"}>
                {currentModule.isCompleted ? "Revisado" : "Pendiente"}
              </Badge>
              <Badge tone="outline">Módulo {currentModule.index + 1}</Badge>
              <Badge tone="outline">{currentModule.estimatedTime}</Badge>
            </div>

            <div>
              <h3 className="text-display-md font-semibold text-[var(--color-ink)]">
                {currentModule.title}
              </h3>
              <p className="mt-2 text-base leading-7 text-[var(--color-ink)]">
                {currentModule.description}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {currentModule.resourcesSummary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {currentModulePrimaryMaterial ? (
                <Button
                  onClick={() =>
                    onOpenResourceWorkspace(
                      `resource-${currentModulePrimaryMaterial.id}`,
                    )
                  }
                  type="button"
                  variant="secondary"
                >
                  Ver recurso principal
                </Button>
              ) : null}
              {currentModuleExercises[0] ? (
                <Button
                  onClick={() =>
                    onOpenResourceWorkspace(
                      `resource-${currentModuleExercises[0].id}`,
                    )
                  }
                  type="button"
                >
                  {canModerate ? "Abrir tarea del modulo" : "Abrir tarea"}
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
              <div className="space-y-4">
                <ModuleLessonPreview resource={currentModulePrimaryMaterial} />
              </div>

              <div className="space-y-4">
                {currentModuleMaterials.slice(1).map((resource) => (
                  <ModuleResourceCard
                    badge="Material complementario"
                    body={resource.description}
                    ctaLabel={
                      resource.isExternal
                        ? "Abrir material"
                        : "Descargar material"
                    }
                    key={resource.id}
                    onClick={() => {
                      if (resource.href) {
                        window.open(
                          resource.href,
                          resource.isExternal ? "_blank" : "_self",
                        );
                      }
                    }}
                    title={resource.title}
                  />
                ))}

                {currentModuleExercises.map((resource) => (
                  <ModuleResourceCard
                    badge={
                      canModerate ? "Tarea del módulo" : "Actividad del módulo"
                    }
                    body={
                      canModerate
                        ? `${resource.submissionStats?.pending ?? 0} entregas pendientes de revisión.`
                        : !resource.viewerSubmission
                          ? "Todavía no has registrado tu entrega en esta actividad."
                          : resource.viewerSubmission.status ===
                              "CHANGES_REQUESTED"
                            ? "Hay cambios solicitados. Abre la tarea para revisar el feedback y enviar una nueva versión."
                            : resource.viewerSubmission.status === "SUBMITTED"
                              ? "La entrega ya está enviada y espera revisión docente."
                              : "La actividad ya tiene revisión registrada dentro del campus."
                    }
                    ctaLabel={
                      canModerate ? "Abrir tarea del módulo" : "Abrir entrega"
                    }
                    key={resource.id}
                    onClick={() =>
                      onOpenResourceWorkspace(`resource-${resource.id}`)
                    }
                    title={resource.title}
                  />
                ))}

                {!currentModuleMaterials.length &&
                !currentModuleExercises.length ? (
                  <div className="ui-empty-state p-4 text-sm leading-6 text-[var(--color-muted)]">
                    Este módulo todavía no tiene materiales ni tareas ligados de
                    forma explícita.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-3.5">
              <p className="text-sm leading-5 text-[var(--color-muted)]">
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
            Cuando el curso tenga módulos, podrás revisarlos y marcarlos desde
            aquí.
          </p>
        )}
      </SurfaceCard>

      <SurfaceCard
        description={
          isStudentLessonFirst
            ? "Si necesitas cambiar de punto, continúa por otra lección desde esta secuencia."
            : "Selecciona un módulo sin salir del contexto del campus."
        }
        id="content-module-map"
        title="Secuencia del curso"
      >
        {progress.modules.length ? (
          <div
            className={cn(
              "grid gap-3",
              isStudentLessonFirst ? "grid-cols-1" : "lg:grid-cols-2",
            )}
          >
            {progress.modules.map((module) => {
              const moduleResources =
                managedResourcesByModuleId.get(module.id) ?? [];
              const moduleMaterialsCount = moduleResources.filter(
                (resource) => !resource.isExercise,
              ).length;
              const moduleExercisesCount = moduleResources.filter(
                (resource) => resource.isExercise,
              ).length;
              const moduleMeta = isStudentLessonFirst
                ? `${module.estimatedTime} | ${module.resourcesSummary}`
                : `${module.estimatedTime} | ${module.resourcesSummary}${
                    moduleResources.length > 0
                      ? ` | ${moduleMaterialsCount} materiales | ${moduleExercisesCount} tareas`
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
    </>
  );
}

export function CourseLearningResourcesTab({
  canModerate,
  course,
  resources,
  roleLabel,
  focusedStudentExerciseId,
  isFocusedTaskWorkspace,
  onExitFocus,
}: CourseLearningResourcesTabProps) {
  return (
    <SurfaceCard
      className="scroll-mt-36"
      description={
        isFocusedTaskWorkspace
          ? "Entrega, feedback y estado en la misma pagina."
          : canModerate
            ? "Materiales, tareas y revisiones sin salir del curso."
            : "Abre una tarea o consulta materiales sin salir del campus."
      }
      id="resources-panel"
      title={isFocusedTaskWorkspace ? "Tarea abierta" : "Recursos"}
    >
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
  forumCategories,
}: CourseLearningSupportTabProps) {
  return (
    <>
      <SurfaceCard
        description="Usa la comunidad para avisos y conversación académica."
        id="support-forum-categories"
        title="Comunidad del curso"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {forumCategories.length ? (
            forumCategories.map((category) => (
              <Link
                className="rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)] hover:bg-white"
                href={`/mis-cursos/${courseSlug}/foro/${category.slug}`}
                key={category.id}
                prefetch
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-ink)]">
                      {category.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
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
          <InfoPanel
            body="Úsalo para anuncios, dudas sobre el contenido y acompañamiento de la comunidad del curso."
            ctaHref={`/mis-cursos/${courseSlug}/foro`}
            ctaLabel="Abrir foro privado"
            title="Conversación académica"
          />
        </SurfaceCard>

        <SurfaceCard title="Soporte de plataforma">
          <InfoPanel
            body={`Escribe a ${siteConfig.supportEmail} si el problema es de acceso, cuenta o incidencias técnicas del campus.`}
            ctaHref={`mailto:${siteConfig.supportEmail}`}
            ctaLabel="Contactar soporte"
            title="Incidencias técnicas"
          />
        </SurfaceCard>
      </div>
    </>
  );
}
