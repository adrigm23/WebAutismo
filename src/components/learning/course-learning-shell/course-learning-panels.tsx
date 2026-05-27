"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Link2,
  PlayCircle,
} from "lucide-react";
import { CourseProgressToggleForm } from "@/components/learning/course-progress-toggle-form";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildCourseContentHref,
  buildCourseTrackingHref,
} from "@/lib/course-navigation";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CampusResourceItem } from "@/lib/course-resources";
import { siteConfig } from "@/lib/site";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { ModuleLessonPreview } from "./resource-preview";
import {
  InfoPanel,
  ModuleResourceCard,
  ModuleRow,
  SurfaceCard,
  SummaryMetric,
} from "./primitives";
import type { LearningShellForumCategory, LearningShellModule } from "./types";

const DynamicCourseResourceManager = dynamic(
  () =>
    import("@/components/learning/course-resource-manager").then(
      (module) => module.CourseResourceManager,
    ),
  {
    loading: () => <CourseResourceManagerSkeleton />,
  },
);

function CourseResourceManagerSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="space-y-3 rounded-[1rem] border border-[rgba(22,60,88,0.08)] bg-white/72 p-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24" rounded="pill" />
          <Skeleton className="h-6 w-20" rounded="pill" />
          <Skeleton className="h-6 w-28" rounded="pill" />
        </div>
        <Skeleton className="h-7 w-56" rounded="md" />
        <Skeleton className="h-4 w-full" rounded="md" />
        <Skeleton className="h-4 w-11/12" rounded="md" />
        <Skeleton className="h-10 w-36" rounded="md" />
      </div>
      <div className="space-y-3 rounded-[1rem] border border-[rgba(22,60,88,0.08)] bg-white/72 p-4">
        <Skeleton className="h-6 w-40" rounded="md" />
        <Skeleton className="h-4 w-full" rounded="md" />
        <Skeleton className="h-4 w-10/12" rounded="md" />
        <Skeleton className="h-40 w-full" rounded="lg" />
      </div>
    </div>
  );
}

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
  onOpenResourceWorkspace: (targetId?: string) => void;
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
      input.currentModuleMaterials.length > 0 || input.currentModuleExercises.length > 0;
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
        className="overflow-hidden border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,rgba(255,253,250,0.98),rgba(223,234,243,0.44))]"
        description="Continua desde la leccion activa y mantente dentro del mismo hilo de aprendizaje."
        title="Leccion activa"
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">Alumno</Badge>
              {input.currentModule ? (
                <Badge tone="outline">Modulo {input.currentModule.index + 1}</Badge>
              ) : null}
              {input.editionLabel ? <Badge tone="outline">{input.editionLabel}</Badge> : null}
            </div>

            <div>
              <p className="text-meta-xs font-semibold text-[var(--color-primary)]">
                {input.currentModule ? input.currentModule.estimatedTime : input.course.title}
              </p>
              <h2 className="font-premium mt-3 text-display-lg font-semibold text-[var(--color-ink)]">
                {input.currentModule ? input.currentModule.title : input.course.title}
              </h2>
              <p className="mt-3 max-w-3xl text-body-md text-[var(--color-ink-soft)]">
                {input.currentModule
                  ? input.currentModule.description
                  : "Todavia no hay una leccion activa configurada para este curso."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
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
                <Button onClick={input.onOpenResources} type="button" variant="ghost">
                  Ver recursos
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <SummaryMetric
              detail={
                input.currentModuleExercises[0]
                  ? "Abre la actividad cuando termines el contenido."
                  : "Continua con la secuencia del curso desde la siguiente leccion."
              }
              label="Que sigue"
              value={
                input.currentModuleExercises[0]
                  ? `${input.currentModuleExercises.length} tarea${input.currentModuleExercises.length === 1 ? "" : "s"}`
                  : "Sin tarea inmediata"
              }
            />
            <SummaryMetric
              detail="Materiales y ejercicios visibles sin salir del campus."
              label="Recorrido"
              value={
                input.currentModule
                  ? `${input.currentModuleMaterials.length} materiales`
                  : "Sin modulo activo"
              }
            />
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
              <Badge tone="outline">Modulo {input.currentModule.index + 1}</Badge>
            ) : null}
            {input.editionLabel ? <Badge tone="outline">{input.editionLabel}</Badge> : null}
          </div>
          <div>
            <h2 className="font-premium text-display-md font-semibold text-[var(--color-ink)]">
              Revisa lo pendiente
            </h2>
            <p className="mt-2 text-body-sm text-[var(--color-muted)]">
              Seguimiento, recursos, comunidad y leccion activa.
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
            <Button onClick={input.onOpenResources} type="button" variant="secondary">
              Abrir recursos
            </Button>
            <Button onClick={input.onOpenSupport} type="button" variant="ghost">
              Abrir comunidad
            </Button>
            <Button onClick={input.onOpenCurrentLesson} type="button" variant="ghost">
              Ver leccion activa
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] p-4">
            <p className="text-meta-xs font-semibold text-[var(--color-muted)]">Leccion activa</p>
            <p className="mt-3 text-heading-md font-semibold text-[var(--color-ink)]">
              {input.currentModule ? input.currentModule.title : input.course.title}
            </p>
            <p className="mt-2 text-body-sm text-[var(--color-muted)]">
              {input.currentModule
                ? `${input.currentModule.estimatedTime} | ${input.currentModuleMaterials.length} materiales | ${input.currentModuleExercises.length} tareas.`
                : "Todavia no hay un modulo activo configurado para este curso."}
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-white p-4">
            <p className="text-meta-xs font-semibold text-[var(--color-muted)]">Donde continuar</p>
            <p className="mt-2 text-body-sm text-[var(--color-muted)]">
              {input.currentModuleExercises[0]
                ? "Abre la tarea del modulo desde recursos o desde el contenido."
                : "Continua desde seguimiento o desde el contenido del modulo."}
            </p>
            {input.currentModuleExercises[0] ? (
              <div className="mt-4">
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
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={currentModule.isCompleted ? "success" : "warning"}>
                {currentModule.isCompleted ? "Revisado" : "Pendiente"}
              </Badge>
              <Badge tone="outline">Modulo {currentModule.index + 1}</Badge>
              <Badge tone="outline">{currentModule.estimatedTime}</Badge>
            </div>

            <div className={cn("space-y-3", isStudentLessonFirst && "max-w-4xl")}>
              <h3 className="font-premium text-display-md font-semibold text-[var(--color-ink)]">
                {currentModule.title}
              </h3>
              <p className="text-body-md text-[var(--color-ink)]">{currentModule.description}</p>
              <p className="text-body-sm text-[var(--color-muted)]">
                {currentModule.resourcesSummary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {currentModulePrimaryMaterial ? (
                <Button
                  onClick={() =>
                    onOpenResourceWorkspace(`resource-${currentModulePrimaryMaterial.id}`)
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
                    onOpenResourceWorkspace(`resource-${currentModuleExercises[0].id}`)
                  }
                  type="button"
                >
                  {canModerate ? "Abrir tarea del modulo" : "Abrir tarea"}
                </Button>
              ) : null}
            </div>

            <div
              className={cn(
                "grid gap-5",
                isStudentLessonFirst
                  ? "xl:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]"
                  : "xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]",
              )}
            >
              <div className="space-y-4">
                <ModuleLessonPreview resource={currentModulePrimaryMaterial} />
              </div>

              <div className="space-y-4">
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
                  <EmptyState
                    className="px-5 py-6"
                    description="Cuando se publiquen recursos o actividades para este modulo, apareceran aqui dentro de la misma secuencia."
                    title="Este modulo todavia no tiene materiales ni tareas ligados de forma explicita."
                    tone="subtle"
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[rgba(22,60,88,0.08)] bg-[rgba(248,245,239,0.58)] p-4">
              <p className="text-body-sm text-[var(--color-muted)]">
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

      <SurfaceCard
        description={
          isStudentLessonFirst
            ? "Si necesitas cambiar de punto, continua por otra leccion desde esta secuencia."
            : "Selecciona un modulo sin salir del contexto del campus."
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
              const moduleResources = managedResourcesByModuleId.get(module.id) ?? [];
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
                  title={`Modulo ${module.index + 1} | ${module.title}`}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            className="px-5 py-6"
            description="Cuando el curso tenga modulos configurados, podras recorrerlos y marcarlos desde aqui."
            title="Este curso todavia no tiene modulos configurados."
            tone="subtle"
          />
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
  onOpenResourceWorkspace,
  onExitFocus,
}: CourseLearningResourcesTabProps) {
  if (!canModerate && !isFocusedTaskWorkspace) {
    return (
      <StudentEditorialResourcesList
        course={course}
        onOpenResourceWorkspace={onOpenResourceWorkspace}
        resources={resources}
      />
    );
  }

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
      <DynamicCourseResourceManager
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

function getStudentResourceStateLabel(resource: CampusResourceItem) {
  if (!resource.isExercise) {
    return resource.createdAt ? "Nuevo" : null;
  }

  if (!resource.viewerSubmission && !resource.isSubmissionClosed) {
    return "Pendiente";
  }

  if (!resource.viewerSubmission) {
    return "Cerrado";
  }

  if (resource.viewerSubmission.status === "CHANGES_REQUESTED") {
    return "Cambios";
  }

  if (resource.viewerSubmission.status === "SUBMITTED") {
    return "En revision";
  }

  return "Visto";
}

function getStudentResourceStateTone(resource: CampusResourceItem) {
  if (!resource.isExercise) {
    return "outline" as const;
  }

  if (!resource.viewerSubmission && !resource.isSubmissionClosed) {
    return "brand" as const;
  }

  if (!resource.viewerSubmission) {
    return "outline" as const;
  }

  if (resource.viewerSubmission.status === "CHANGES_REQUESTED") {
    return "warning" as const;
  }

  if (resource.viewerSubmission.status === "SUBMITTED") {
    return "outline" as const;
  }

  return "info" as const;
}

function getStudentResourceMeta(resource: CampusResourceItem) {
  if (resource.isExercise && resource.dueAt) {
    return `Entrega ${formatDate(resource.dueAt)}`;
  }

  if (resource.isExternal) {
    return "Enlace externo";
  }

  if (resource.mimeType?.includes("pdf")) {
    return "PDF";
  }

  if (
    resource.mimeType?.includes("sheet") ||
    resource.mimeType?.includes("excel") ||
    resource.mimeType?.includes("csv")
  ) {
    return "Excel";
  }

  if (resource.mimeType?.includes("video")) {
    return "Video";
  }

  return resource.resourceTypeLabel;
}

function getStudentResourceIcon(resource: CampusResourceItem) {
  if (resource.isExercise) {
    return ClipboardList;
  }

  if (resource.isExternal) {
    return Link2;
  }

  if (
    resource.mimeType?.includes("sheet") ||
    resource.mimeType?.includes("excel") ||
    resource.mimeType?.includes("csv")
  ) {
    return FileSpreadsheet;
  }

  if (resource.mimeType?.includes("video")) {
    return PlayCircle;
  }

  return FileText;
}

function StudentResourceGlyph(input: { resource: CampusResourceItem }) {
  const icon = getStudentResourceIcon(input.resource);

  if (icon === ClipboardList) {
    return <ClipboardList className="h-5 w-5" />;
  }

  if (icon === Link2) {
    return <Link2 className="h-5 w-5" />;
  }

  if (icon === FileSpreadsheet) {
    return <FileSpreadsheet className="h-5 w-5" />;
  }

  if (icon === PlayCircle) {
    return <PlayCircle className="h-5 w-5" />;
  }

  return <FileText className="h-5 w-5" />;
}

function buildStudentResourceGroups(course: CatalogCourse, resources: CampusResourceItem[]) {
  const managedResources = resources.filter((resource) => resource.isManaged);

  const orderedGroups = course.modules
    .map((module, index) => ({
      key: module.id,
      title: `Modulo ${index + 1}: ${module.title}`,
      items: managedResources.filter((resource) => resource.moduleId === module.id),
    }))
    .filter((group) => group.items.length > 0);

  const ungrouped = managedResources.filter((resource) => !resource.moduleId);

  if (ungrouped.length) {
    orderedGroups.push({
      key: "ungrouped",
      title: "Recursos generales",
      items: ungrouped,
    });
  }

  return orderedGroups;
}

function StudentEditorialResourcesList(input: {
  course: CatalogCourse;
  resources: CampusResourceItem[];
  onOpenResourceWorkspace: (targetId?: string) => void;
}) {
  const groups = buildStudentResourceGroups(input.course, input.resources);

  if (!groups.length) {
    return (
      <div className="rounded-[1rem] border border-dashed border-[rgba(22,60,88,0.16)] bg-white/78 px-5 py-7">
        <p className="font-premium text-[1.4rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
          Recursos
        </p>
        <p className="mt-3 max-w-[42rem] text-sm leading-7 text-[var(--color-muted)]">
          Cuando haya materiales o actividades publicados para este curso apareceran aqui, agrupados por modulo.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-7" id="resources-panel">
      {groups.map((group) => (
        <div key={group.key}>
          <h2 className="text-[1.05rem] font-semibold tracking-[0.08em] uppercase text-[var(--color-ink)]">
            {group.title}
          </h2>
          <div className="mt-3 overflow-hidden rounded-[0.95rem] border border-[rgba(22,60,88,0.11)] bg-white/88">
            {group.items.map((resource, index) => (
              <StudentResourceRow
                isLast={index === group.items.length - 1}
                key={resource.id}
                onOpenResourceWorkspace={input.onOpenResourceWorkspace}
                resource={resource}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function StudentResourceRow(input: {
  resource: CampusResourceItem;
  isLast: boolean;
  onOpenResourceWorkspace: (targetId?: string) => void;
}) {
  const stateLabel = getStudentResourceStateLabel(input.resource);
  const stateTone = getStudentResourceStateTone(input.resource);
  const meta = getStudentResourceMeta(input.resource);
  const rightMeta = input.resource.createdAt ? formatDateTime(input.resource.createdAt) : null;

  function handleClick() {
    if (input.resource.isExercise) {
      input.onOpenResourceWorkspace(`resource-${input.resource.id}`);
      return;
    }

    if (input.resource.href && typeof window !== "undefined") {
      window.open(
        input.resource.href,
        input.resource.isExternal ? "_blank" : "_self",
        input.resource.isExternal ? "noopener,noreferrer" : undefined,
      );
    }
  }

  return (
    <button
      className={cn(
        "flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors duration-[var(--motion-duration-base)] hover:bg-[rgba(248,246,241,0.72)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset",
        !input.isLast && "border-b border-[rgba(22,60,88,0.08)]",
      )}
      onClick={handleClick}
      type="button"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.8rem] bg-[rgba(243,242,252,0.9)] text-[var(--color-primary)]">
        <StudentResourceGlyph resource={input.resource} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[1.05rem] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
            {input.resource.title}
          </p>
          {stateLabel ? <Badge tone={stateTone}>{stateLabel}</Badge> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
          <span>{meta}</span>
          {rightMeta ? <span>{rightMeta}</span> : null}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[var(--color-ink-soft)]">
        {!input.resource.isExercise ? (
          <span className="hidden text-sm sm:inline">
            {input.resource.isExternal ? "Abrir" : "Descargar"}
          </span>
        ) : (
          <span className="hidden text-sm sm:inline">Ver</span>
        )}
        {input.resource.isExternal ? (
          <ArrowUpRight className="h-5 w-5 shrink-0" />
        ) : input.resource.isExercise ? (
          <ArrowUpRight className="h-5 w-5 shrink-0" />
        ) : (
          <Download className="h-5 w-5 shrink-0" />
        )}
      </div>
    </button>
  );
}

export function CourseLearningSupportTab({
  courseSlug,
  forumCategories,
}: CourseLearningSupportTabProps) {
  return (
    <>
      <SurfaceCard
        description="Usa la comunidad para avisos y conversacion academica."
        id="support-forum-categories"
        title="Comunidad del curso"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {forumCategories.length ? (
            forumCategories.map((category) => (
              <Link
                className="rounded-[1rem] border border-[rgba(22,60,88,0.08)] bg-[rgba(248,245,239,0.52)] p-4 transition-colors duration-[var(--motion-duration-base)] hover:border-[rgba(22,60,88,0.16)] hover:bg-white/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                href={`/mis-cursos/${courseSlug}/foro/${category.slug}`}
                key={category.id}
                prefetch
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-heading-md font-semibold text-[var(--color-ink)]">
                      {category.title}
                    </p>
                    <p className="mt-2 text-body-sm text-[var(--color-muted)]">
                      {category.description}
                    </p>
                  </div>
                  <Badge tone="outline">{category._count.threads} hilos</Badge>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              className="px-5 py-6"
              description="Cuando el espacio de comunidad tenga categorias activas, apareceran aqui integradas con el campus."
              title="Aun no hay categorias activas en el foro del curso."
              tone="subtle"
            />
          )}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard title="Foro del curso">
          <InfoPanel
            body="Usalo para anuncios, dudas sobre el contenido y acompanamiento de la comunidad del curso."
            ctaHref={`/mis-cursos/${courseSlug}/foro`}
            ctaLabel="Abrir foro privado"
            title="Conversacion academica"
          />
        </SurfaceCard>

        <SurfaceCard title="Soporte de plataforma">
          <InfoPanel
            body={`Escribe a ${siteConfig.supportEmail} si el problema es de acceso, cuenta o incidencias tecnicas del campus.`}
            ctaHref={`mailto:${siteConfig.supportEmail}`}
            ctaLabel="Contactar soporte"
            title="Incidencias tecnicas"
          />
        </SurfaceCard>
      </div>
    </>
  );
}
