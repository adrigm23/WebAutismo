"use client";

import { useActionState, useDeferredValue, useId, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  ClipboardList,
  FileUp,
  Files,
  Search,
  Users,
} from "lucide-react";
import {
  createCourseResourceAction,
  type CourseResourceFormState,
} from "@/actions/course-resources";
import { CourseExerciseSubmissionForm } from "@/components/learning/course-exercise-submission-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StateBanner } from "@/components/ui/state-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogCourse } from "@/lib/course-catalog";
import type {
  CampusResourceItem,
  CampusResourceSubmissionItem,
} from "@/lib/course-resources";
import { cn, formatDateTime } from "@/lib/utils";

const initialState: CourseResourceFormState = {};
const selectClassName =
  "ui-control-base h-[var(--control-height-md)] px-4 text-sm";
const teacherSearchScopes = [
  {
    value: "resources",
    label: "Recursos",
    icon: Files,
  },
  {
    value: "students",
    label: "Alumnos",
    icon: Users,
  },
  {
    value: "submissions",
    label: "Entregas",
    icon: ClipboardList,
  },
] as const;

type TeacherSearchScope = (typeof teacherSearchScopes)[number]["value"];

function matchesSearch(query: string, values: Array<string | null | undefined>) {
  if (!query) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(query));
}

function getReviewQueueMeta(submission: CampusResourceSubmissionItem) {
  if (submission.status === "REVIEWED") {
    return {
      label: "Revisada",
      tone: "success" as const,
    };
  }

  if (submission.status === "CHANGES_REQUESTED") {
    return {
      label: "Cambios",
      tone: "info" as const,
    };
  }

  return {
    label: "Pendiente",
    tone: "warning" as const,
  };
}

const DynamicCourseManagedResourceControls = dynamic(
  () =>
    import("@/components/learning/course-managed-resource-controls").then(
      (module) => module.CourseManagedResourceControls,
    ),
  {
    loading: () => <CourseManagedResourceControlsSkeleton />,
  },
);

const DynamicCourseExerciseReviewForm = dynamic(
  () =>
    import("@/components/learning/course-exercise-review-form").then(
      (module) => module.CourseExerciseReviewForm,
    ),
  {
    loading: () => <CourseExerciseReviewFormSkeleton />,
  },
);

function CourseManagedResourceControlsSkeleton() {
  return (
    <div className="mt-5 space-y-3" aria-hidden="true">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-28" rounded="pill" />
        <Skeleton className="h-9 w-24" rounded="pill" />
        <Skeleton className="h-9 w-20" rounded="pill" />
      </div>
      <Skeleton className="h-24 w-full" rounded="lg" />
    </div>
  );
}

function CourseExerciseReviewFormSkeleton() {
  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-white p-5"
      aria-hidden="true"
    >
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" rounded="md" />
        <Skeleton className="h-4 w-full" rounded="md" />
        <Skeleton className="h-4 w-9/12" rounded="md" />
        <Skeleton className="h-24 w-full" rounded="lg" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-28" rounded="md" />
          <Skeleton className="h-10 w-24" rounded="md" />
        </div>
      </div>
    </div>
  );
}

type CourseResourceManagerProps = {
  course: CatalogCourse;
  resources: CampusResourceItem[];
  canModerate: boolean;
  roleLabel: string;
  focusedResourceId?: string | null;
};

export function CourseResourceManager({
  course,
  resources,
  canModerate,
  roleLabel,
  focusedResourceId = null,
}: CourseResourceManagerProps) {
  const [state, formAction] = useActionState(
    createCourseResourceAction,
    initialState,
  );
  const [source, setSource] = useState<"FILE" | "LINK">("FILE");
  const [type, setType] = useState<"MATERIAL" | "EXERCISE">("MATERIAL");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [teacherSearchScope, setTeacherSearchScope] =
    useState<TeacherSearchScope>("resources");
  const deferredTeacherSearchQuery = useDeferredValue(
    teacherSearchQuery.trim().toLowerCase(),
  );
  const fileInputId = useId();
  const managedResources = resources.filter((resource) => resource.isManaged);
  const exerciseResources = managedResources.filter(
    (resource) => resource.isExercise,
  );
  const materialResources = managedResources.filter(
    (resource) => !resource.isExercise,
  );
  const referenceResources = resources.filter(
    (resource) => !resource.isManaged,
  );
  const managedPositionById = new Map(
    managedResources.map((resource, index) => [resource.id, index] as const),
  );
  const focusedResource = focusedResourceId
    ? (managedResources.find((resource) => resource.id === focusedResourceId) ??
      null)
    : null;
  const isFocusedTaskView =
    !canModerate && Boolean(focusedResource?.isExercise);
  const focusedSupportMaterials =
    isFocusedTaskView && focusedResource
      ? materialResources.filter((resource) =>
          focusedResource.moduleId
            ? resource.moduleId === focusedResource.moduleId
            : true,
        ).filter(
          (resource, index, collection) =>
            resource.href &&
            collection.findIndex((candidate) => candidate.href === resource.href) ===
              index,
        )
      : [];
  const teacherReviewQueue = canModerate
    ? exerciseResources
        .flatMap((resource) =>
          resource.submissions.map((submission) => ({
            resource,
            submission,
          })),
        )
        .sort((left, right) => {
          const leftPriority =
            left.submission.status === "SUBMITTED"
              ? 0
              : left.submission.status === "CHANGES_REQUESTED"
                ? 1
                : 2;
          const rightPriority =
            right.submission.status === "SUBMITTED"
              ? 0
              : right.submission.status === "CHANGES_REQUESTED"
                ? 1
                : 2;

          if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
          }

          return (
            right.submission.submittedAt.getTime() -
            left.submission.submittedAt.getTime()
          );
        })
    : [];
  const filteredTeacherReviewQueue = canModerate
    ? teacherReviewQueue.filter((entry) => {
        if (!deferredTeacherSearchQuery) {
          return true;
        }

        if (teacherSearchScope === "resources") {
          return matchesSearch(deferredTeacherSearchQuery, [
            entry.resource.title,
            entry.resource.description,
            entry.resource.moduleTitle,
          ]);
        }

        if (teacherSearchScope === "students") {
          return matchesSearch(deferredTeacherSearchQuery, [
            entry.submission.studentName,
            entry.submission.studentEmail,
            entry.resource.moduleTitle,
          ]);
        }

        return matchesSearch(deferredTeacherSearchQuery, [
          entry.resource.title,
          entry.submission.statusLabel,
          entry.submission.feedback,
          entry.submission.attachmentLabel,
        ]);
      })
    : [];
  const filteredManagedResources = canModerate
    ? managedResources.filter((resource) => {
        if (!deferredTeacherSearchQuery) {
          return true;
        }

        if (teacherSearchScope === "resources") {
          return matchesSearch(deferredTeacherSearchQuery, [
            resource.title,
            resource.description,
            resource.moduleTitle,
            resource.resourceTypeLabel,
          ]);
        }

        if (teacherSearchScope === "students") {
          return resource.submissions.some((submission) =>
            matchesSearch(deferredTeacherSearchQuery, [
              submission.studentName,
              submission.studentEmail,
              resource.title,
            ]),
          );
        }

        return (
          resource.submissions.some((submission) =>
            matchesSearch(deferredTeacherSearchQuery, [
              submission.statusLabel,
              submission.feedback,
              submission.attachmentLabel,
              resource.title,
            ]),
          ) ||
          matchesSearch(deferredTeacherSearchQuery, [
            resource.title,
            resource.description,
          ])
        );
      })
    : managedResources;
  const filteredExerciseResources = canModerate
    ? filteredManagedResources.filter((resource) => resource.isExercise)
    : exerciseResources;
  const filteredMaterialResources = canModerate
    ? filteredManagedResources.filter((resource) => !resource.isExercise)
    : materialResources;
  const filteredReferenceResources = canModerate
    ? teacherSearchScope === "resources" && deferredTeacherSearchQuery
      ? referenceResources.filter((resource) =>
          matchesSearch(deferredTeacherSearchQuery, [
            resource.title,
            resource.description,
            resource.resourceTypeLabel,
          ]),
        )
      : teacherSearchScope === "resources"
        ? referenceResources
        : []
    : deferredTeacherSearchQuery
      ? referenceResources.filter((resource) =>
          matchesSearch(deferredTeacherSearchQuery, [
            resource.title,
            resource.description,
            resource.resourceTypeLabel,
          ]),
        )
      : referenceResources;
  const hasTeacherSearch =
    canModerate && Boolean(deferredTeacherSearchQuery);
  const pendingReviewCount = teacherReviewQueue.filter(
    (entry) => entry.submission.status === "SUBMITTED",
  ).length;
  const needsAttentionCount = teacherReviewQueue.filter(
    (entry) =>
      entry.submission.status === "SUBMITTED" ||
      entry.submission.status === "CHANGES_REQUESTED",
  ).length;

  function getExternalHostLabel(url: string | null) {
    if (!url) {
      return null;
    }

    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }

  function getStudentSubmissionBadge(resource: CampusResourceItem) {
    if (!resource.isExercise) {
      return null;
    }

    if (!resource.viewerSubmission && !resource.isSubmissionClosed) {
      return <Badge tone="student">Pendiente</Badge>;
    }

    if (!resource.viewerSubmission) {
      return <Badge tone="muted">Sin entrega</Badge>;
    }

    if (resource.viewerSubmission.status === "CHANGES_REQUESTED") {
      return <Badge tone="accent">Cambios solicitados</Badge>;
    }

    if (resource.viewerSubmission.status === "SUBMITTED") {
      return <Badge tone="muted">En revision</Badge>;
    }

    return <Badge tone="teacher">Revisada</Badge>;
  }

  function renderResourceCard(resource: CampusResourceItem) {
    if (isFocusedTaskView && focusedResource?.id === resource.id) {
      return (
        <CourseExerciseSubmissionForm
          courseSlug={course.slug}
          dueAt={resource.dueAt}
          existingSubmission={resource.viewerSubmission}
          isSubmissionClosed={resource.isSubmissionClosed}
          resourceDescription={resource.description}
          resourceId={resource.id}
          resourceTitle={resource.title}
          supportMaterials={focusedSupportMaterials}
        />
      );
    }

    return (
      <div
        className="scroll-mt-36 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-5 transition duration-[var(--motion-duration-base)] hover:border-[var(--color-border-strong)] hover:bg-white"
        id={`resource-${resource.id}`}
        key={resource.id}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={resource.isManaged ? "teacher" : "muted"}>
                {resource.resourceTypeLabel}
              </Badge>
              <Badge tone="muted">{resource.accessLabel}</Badge>
              {resource.moduleTitle ? (
                <Badge tone="student">{resource.moduleTitle}</Badge>
              ) : null}
              {!canModerate ? getStudentSubmissionBadge(resource) : null}
              {canModerate && resource.isManaged ? (
                <Badge tone={resource.isPublished ? "teacher" : "accent"}>
                  {resource.isPublished ? "Visible" : "Oculto"}
                </Badge>
              ) : null}
              {resource.isExercise && resource.dueAt ? (
                <Badge tone="accent">
                  Entrega hasta {formatDateTime(resource.dueAt)}
                </Badge>
              ) : null}
              {resource.isExercise && resource.passingScoreLabel ? (
                <Badge tone="teacher">
                  Aprueba con {resource.passingScoreLabel}/10
                </Badge>
              ) : null}
            </div>

            <div>
              <p className="text-lg font-semibold text-[var(--color-ink)]">
                {resource.title}
              </p>
              <p className="mt-2.5 text-sm leading-7 text-[var(--color-muted)]">
                {resource.description}
              </p>
            </div>

            {!canModerate && resource.isExercise ? (
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                {!resource.viewerSubmission
                  ? "Accion recomendada: abre el formulario de esta tarjeta y registra tu entrega."
                  : resource.viewerSubmission.status === "CHANGES_REQUESTED"
                    ? "Tu docente ha pedido cambios. Revisa el feedback y vuelve a enviar la actividad desde aqui."
                    : resource.viewerSubmission.status === "SUBMITTED"
                      ? "Tu entrega ya esta enviada y pendiente de revision docente."
                      : "La actividad ya tiene una revision registrada. Consulta aqui mismo la nota y el feedback."}
              </p>
            ) : null}

            {!canModerate && resource.isExercise && resource.isExternal ? (
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                El boton superior abre el enunciado externo en{" "}
                <strong className="text-[var(--color-ink)]">
                  {getExternalHostLabel(resource.linkUrl) ?? "otra pestana"}
                </strong>
                . La entrega se registra aqui mismo, debajo de esta tarjeta.
              </p>
            ) : null}

            {resource.createdByName || resource.createdAt ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <span>
                  {resource.createdByName
                    ? `Publicado por ${resource.createdByName}`
                    : "Publicado"}
                </span>
                {resource.createdAt ? (
                  <span>{formatDateTime(resource.createdAt)}</span>
                ) : null}
                {canModerate && resource.isExercise ? (
                  <span>
                    {resource.submissionStats?.total ?? 0} entregas
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3">
            {resource.href ? (
              <ButtonLink
                className="min-h-9 rounded-[var(--radius-sm)] border-[rgba(22,60,88,0.12)] bg-white/84 px-3.5 shadow-none hover:bg-white"
                href={resource.href}
                size="sm"
                target={resource.isExternal ? "_blank" : undefined}
                variant="neutral"
              >
                {resource.isExternal
                  ? resource.isExercise
                    ? "Abrir enunciado"
                    : "Abrir enlace"
                  : "Descargar"}
              </ButtonLink>
            ) : null}

            {canModerate ? (
              <a
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-strong)]"
                href={
                  resource.submissions[0]
                    ? `#submission-${resource.submissions[0].id}`
                    : `#resource-${resource.id}`
                }
              >
                {resource.isExercise ? "Ver entregas" : "Ver ficha"}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>

        {canModerate && resource.isManaged ? (
          <DynamicCourseManagedResourceControls
            courseSlug={course.slug}
            isFirst={(managedPositionById.get(resource.id) ?? 0) === 0}
            isLast={
              (managedPositionById.get(resource.id) ?? 0) ===
              managedResources.length - 1
            }
            modules={course.modules}
            resource={resource}
          />
        ) : null}

        {resource.isExercise && resource.isManaged ? (
          canModerate ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-4 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] bg-white/78 px-3.5 py-3">
                  <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Entregas registradas
                  </p>
                  <p className="mt-1.5 text-lg font-semibold text-[var(--color-ink)]">
                    {resource.submissionStats?.total ?? 0}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-white/78 px-3.5 py-3">
                  <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Pendientes de revision
                  </p>
                  <p className="mt-1.5 text-lg font-semibold text-[var(--color-ink)]">
                    {resource.submissionStats?.pending ?? 0}
                  </p>
                </div>
              </div>

              {resource.submissions.length ? (
                resource.submissions.map((submission) => (
                  <DynamicCourseExerciseReviewForm
                    courseSlug={course.slug}
                    key={submission.id}
                    passingScore={resource.passingScore}
                    submission={submission}
                  />
                ))
              ) : (
                <EmptyState
                  className="border-dashed bg-white px-5 py-6"
                  description="Las nuevas entregas apareceran aqui para revision cuando el alumnado responda."
                  title="Todavia no hay entregas registradas para este ejercicio."
                  tone="subtle"
                />
              )}
            </div>
          ) : (
            <CourseExerciseSubmissionForm
              courseSlug={course.slug}
              dueAt={resource.dueAt}
              existingSubmission={resource.viewerSubmission}
              isSubmissionClosed={resource.isSubmissionClosed}
              resourceDescription={resource.description}
              resourceId={resource.id}
              resourceTitle={resource.title}
              supportMaterials={focusedSupportMaterials}
            />
          )
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {canModerate ? (
        <>
          <section className="ui-state-panel grid gap-4 p-4 sm:p-5">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <label className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white/84 px-4 py-3 transition focus-within:border-[var(--color-primary)] focus-within:bg-white hover:border-[var(--color-border-strong)]">
                <Search className="h-4 w-4 text-[var(--color-muted)] transition group-focus-within:text-[var(--color-primary)]" />
                <Input
                  className="h-auto border-none bg-transparent px-0 shadow-none focus:border-none focus:shadow-none"
                  onChange={(event) => setTeacherSearchQuery(event.target.value)}
                  placeholder="Buscar recursos, alumnos o entregas del curso..."
                  value={teacherSearchQuery}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {teacherSearchScopes.map((scope) => {
                  const ScopeIcon = scope.icon;

                  return (
                    <button
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border px-3.5 text-sm font-medium transition",
                        teacherSearchScope === scope.value
                          ? "border-[rgba(22,60,88,0.16)] bg-[var(--color-brand-soft)] text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
                          : "border-[var(--color-border-subtle)] bg-white/76 text-[var(--color-ink-soft)] hover:border-[var(--color-border-strong)] hover:bg-white hover:text-[var(--color-ink)]",
                      )}
                      key={scope.value}
                      onClick={() => setTeacherSearchScope(scope.value)}
                      type="button"
                    >
                      <ScopeIcon className="h-4 w-4" />
                      {scope.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white/78 px-4 py-3.5">
                <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Recursos activos
                </p>
                <p className="mt-1.5 text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  {managedResources.length}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white/78 px-4 py-3.5">
                <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Cola pendiente
                </p>
                <p className="mt-1.5 text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  {pendingReviewCount}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white/78 px-4 py-3.5">
                <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Requieren atencion
                </p>
                <p className="mt-1.5 text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  {needsAttentionCount}
                </p>
              </div>
            </div>
          </section>

          <section
            className="ui-state-panel scroll-mt-36 overflow-hidden border-[rgba(22,60,88,0.08)] shadow-[0_12px_28px_rgba(23,32,44,0.04)] transition-[border-color,box-shadow] duration-[var(--motion-duration-base)] hover:border-[rgba(22,60,88,0.11)] focus-within:border-[rgba(22,60,88,0.14)] focus-within:shadow-[0_18px_32px_-26px_rgba(22,60,88,0.22)] p-5"
            id="resource-manager-top"
          >
          <SectionHeader
            actions={<Badge tone="teacher">Gestion docente</Badge>}
            description={`Como ${roleLabel.toLowerCase()} puedes publicar materiales o ejercicios sin salir del curso, manteniendo modulo, acceso y revision dentro del mismo flujo.`}
            size="md"
            title="Publicar recurso del curso"
          />

          <form action={formAction} className="mt-5 space-y-5">
            <input name="courseSlug" type="hidden" value={course.slug} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Tipo
                </span>
                <span className="text-xs leading-5 text-[var(--color-muted)]">
                  Define si el elemento se consulta como material o si abre una entrega evaluable.
                </span>
                <select
                  className={selectClassName}
                  name="type"
                  onChange={(event) =>
                    setType(event.target.value as "MATERIAL" | "EXERCISE")
                  }
                  value={type}
                >
                  <option value="MATERIAL">Material</option>
                  <option value="EXERCISE">Ejercicio</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Origen
                </span>
                <span className="text-xs leading-5 text-[var(--color-muted)]">
                  Usa archivo privado para custodiar material del campus o enlace para recursos externos.
                </span>
                <select
                  className={selectClassName}
                  name="source"
                  onChange={(event) =>
                    setSource(event.target.value as "FILE" | "LINK")
                  }
                  value={source}
                >
                  <option value="FILE">Archivo privado</option>
                  <option value="LINK">Enlace externo</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Titulo
                </span>
                <span className="text-xs leading-5 text-[var(--color-muted)]">
                  Nombre visible en el recorrido del curso y en la cola docente.
                </span>
                <Input
                  name="title"
                  placeholder={
                    type === "EXERCISE"
                      ? "Ej.: Caso practico 1"
                      : "Ej.: Guia de apoyo"
                  }
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Modulo
                </span>
                <span className="text-xs leading-5 text-[var(--color-muted)]">
                  Vincula el recurso al modulo activo o dejalo disponible para todo el curso.
                </span>
                <select className={selectClassName} name="moduleId">
                  <option value="">Todo el curso</option>
                  {course.modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                Descripcion
              </span>
              <span className="text-xs leading-5 text-[var(--color-muted)]">
                Explica que debe hacer el alumnado, como se usa el recurso y que criterio revisaras.
              </span>
              <Textarea
                className="min-h-[6rem]"
                name="description"
                placeholder="Explica para que sirve el recurso, que debe entregar el alumno o como se usa dentro del curso."
              />
            </label>

            {type === "EXERCISE" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Fecha limite
                  </span>
                  <span className="text-xs leading-5 text-[var(--color-muted)]">
                    La cola de entregas se ordenara con esta referencia temporal.
                  </span>
                  <Input name="dueAt" type="datetime-local" />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    Nota minima para aprobar
                  </span>
                  <span className="text-xs leading-5 text-[var(--color-muted)]">
                    Umbral usado para mostrar aprobado o no aprobado dentro de la revision.
                  </span>
                  <Input
                    max="10"
                    min="0"
                    name="passingScore"
                    placeholder="Ej.: 5"
                    step="0.1"
                    type="number"
                  />
                </label>
              </div>
            ) : null}

            {source === "FILE" ? (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <span className="block text-sm font-medium text-[var(--color-ink)]">
                    Archivo
                  </span>
                  <span className="block text-xs leading-5 text-[var(--color-muted)]">
                    Sube material listo para el aula. El acceso seguira siendo privado y ligado al curso.
                  </span>
                </div>
                <input
                  className="sr-only"
                  id={fileInputId}
                  name="file"
                  required
                  type="file"
                />
                <label
                  className="group flex min-h-[9.75rem] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-subtle)] bg-[rgba(248,246,241,0.5)] px-6 py-6 text-center transition hover:border-[var(--color-border-strong)] hover:bg-white focus-within:border-[var(--color-primary)]"
                  htmlFor={fileInputId}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)] transition group-hover:scale-[1.02]">
                    <FileUp className="h-5 w-5" />
                  </span>
                  <span className="mt-4 text-[1rem] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
                    Arrastra un archivo o abre el explorador
                  </span>
                  <span className="mt-1.5 max-w-[34rem] text-sm leading-6 text-[var(--color-muted)]">
                    PDF, DOCX, hojas de trabajo o material visual con acceso privado para este curso.
                  </span>
                </label>
              </div>
            ) : (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  URL externa
                </span>
                <span className="text-xs leading-5 text-[var(--color-muted)]">
                  Util para formularios, videos o documentos vivos que deban mantenerse fuera del campus.
                </span>
                <Input
                  name="linkUrl"
                  placeholder="https://..."
                  required
                  type="url"
                />
              </label>
            )}

            {state.error ? <StateBanner description={state.error} tone="danger" /> : null}

            {state.success ? <StateBanner description={state.success} tone="success" /> : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-[38rem] text-sm leading-7 text-[var(--color-muted)]">
                Los archivos se sirven solo a personas con acceso vigente al curso. Si publicas un ejercicio, la revision quedara disponible en esta misma vista.
              </p>
              <SubmitButton pendingLabel="Publicando..." variant="secondary">
                {type === "EXERCISE"
                  ? "Publicar ejercicio"
                  : "Publicar recurso"}
              </SubmitButton>
            </div>
          </form>
          </section>

          <section className="ui-state-panel overflow-hidden p-5">
            <SectionHeader
              actions={
                <Badge tone={pendingReviewCount ? "warning" : "outline"}>
                  {pendingReviewCount ? `${pendingReviewCount} pendientes` : "Sin cola"}
                </Badge>
              }
              description="Cola compacta para revisar primero lo urgente y saltar al bloque exacto de feedback."
              size="md"
              title="Entregas de alumnos"
            />

            <div className="mt-5 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white/82">
              <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_auto] gap-4 border-b border-[rgba(22,60,88,0.06)] bg-[rgba(248,246,241,0.58)] px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.08em] text-[color:color-mix(in_srgb,var(--color-muted)_86%,white)] md:grid">
                <span>Alumno</span>
                <span>Modulo</span>
                <span>Entrega</span>
                <span className="text-right">Accion</span>
              </div>

              {filteredTeacherReviewQueue.length ? (
                filteredTeacherReviewQueue.map((entry, index) => {
                  const queueMeta = getReviewQueueMeta(entry.submission);

                  return (
                    <a
                      className={cn(
                        "grid gap-3 px-4 py-4 transition duration-[var(--motion-duration-base)] hover:bg-[rgba(248,246,241,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] md:grid-cols-[minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_auto] md:items-center",
                        index !== filteredTeacherReviewQueue.length - 1 &&
                          "border-b border-[rgba(22,60,88,0.08)]",
                      )}
                      href={`#submission-${entry.submission.id}`}
                      key={entry.submission.id}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[1rem] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
                            {entry.submission.studentName}
                          </p>
                          <Badge
                            className="gap-1.5"
                            size="sm"
                            tone={queueMeta.tone}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {queueMeta.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {entry.resource.title}
                        </p>
                      </div>

                      <p className="text-sm text-[var(--color-muted)]">
                        {entry.resource.moduleTitle ?? "Todo el curso"}
                      </p>

                      <p className="text-sm text-[var(--color-muted)]">
                        {formatDateTime(entry.submission.submittedAt)}
                      </p>

                      <div className="flex justify-start md:justify-end">
                        <span className="inline-flex min-h-8 items-center rounded-[var(--radius-sm)] border border-[rgba(22,60,88,0.1)] bg-white/88 px-3 text-[0.92rem] font-medium text-[var(--color-ink-soft)] shadow-[var(--shadow-inset-soft)] transition hover:border-[var(--color-border-strong)] hover:bg-white">
                          Revisar
                        </span>
                      </div>
                    </a>
                  );
                })
              ) : (
                <EmptyState
                  className="border-none bg-transparent px-5 py-8"
                  description={
                    hasTeacherSearch
                      ? "Prueba otro termino o cambia el contexto de busqueda para ampliar resultados."
                      : "Las nuevas entregas apareceran aqui con acceso directo al bloque de revision correspondiente."
                  }
                  title={
                    hasTeacherSearch
                      ? "No hay coincidencias en la cola docente."
                      : "Todavia no hay entregas registradas en este curso."
                  }
                  tone="subtle"
                />
              )}
            </div>
          </section>
        </>
      ) : null}

      {isFocusedTaskView && focusedResource ? (
        renderResourceCard(focusedResource)
      ) : filteredExerciseResources.length ? (
        <section className="space-y-4">
          <SectionHeader
            description={
              canModerate
                ? "Las actividades del alumnado se gestionan aqui, con revision y feedback dentro del propio campus."
                : "Aqui veras primero las tareas del curso y podras entregar, actualizar o revisar tu estado desde cada tarjeta."
            }
            eyebrow="Recorrido"
            size="md"
            title="Ejercicios y entregas"
          />
          {filteredExerciseResources.map(renderResourceCard)}
        </section>
      ) : null}

      {!isFocusedTaskView && filteredMaterialResources.length ? (
        <section className="space-y-4">
          <SectionHeader
            description="Guias, documentos y referencias de apoyo para seguir el curso con contexto."
            eyebrow="Recorrido"
            size="md"
            title="Materiales del curso"
          />
          {filteredMaterialResources.map(renderResourceCard)}
        </section>
      ) : null}

      {!isFocusedTaskView && filteredReferenceResources.length ? (
        <section className="space-y-4">
          <SectionHeader
            description="Informacion general del curso y del equipo docente."
            eyebrow="Contexto"
            size="md"
            title="Referencias del campus"
          />
          {filteredReferenceResources.map(renderResourceCard)}
        </section>
      ) : null}

      {hasTeacherSearch &&
      filteredTeacherReviewQueue.length === 0 &&
      filteredExerciseResources.length === 0 &&
      filteredMaterialResources.length === 0 &&
      filteredReferenceResources.length === 0 ? (
        <EmptyState
          className="border-dashed bg-white px-5 py-7"
          description="Ajusta el termino o cambia entre recursos, alumnos y entregas para explorar otro contexto."
          title="No hay coincidencias para esta busqueda."
          tone="subtle"
        />
      ) : null}

      {!isFocusedTaskView && canModerate && managedResources.length === 0 ? (
        <EmptyState
          className="border-dashed bg-white px-5 py-6"
          description="Cuando publiques el primer material o ejercicio, aparecera aqui dentro del mismo recorrido del campus."
          title="Todavia no hay materiales ni ejercicios creados para este curso."
          tone="subtle"
        />
      ) : null}

      {!isFocusedTaskView && !canModerate && managedResources.length === 0 ? (
        <EmptyState
          className="border-dashed bg-white px-5 py-6"
          description="Cuando el equipo publique materiales o tareas, apareceran aqui sin que tengas que salir del campus."
          title="Todavia no hay tareas ni materiales publicados para este curso."
          tone="subtle"
        />
      ) : null}
    </div>
  );
}
