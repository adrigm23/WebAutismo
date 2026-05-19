"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { CampusOnboarding } from "@/components/campus/campus-onboarding";
import {
  CompactLessonHeader,
  CourseLearningAside,
  CourseLearningContentTab,
  CourseLearningHero,
  CourseLearningResourcesTab,
  CourseLearningSupportTab,
  FocusedTaskIntro
} from "@/components/learning/course-learning-shell/course-learning-panels";
import { CourseLearningHeader } from "@/components/learning/course-learning-shell/course-learning-header";
import type {
  LearningShellProps,
  SidebarTab
} from "@/components/learning/course-learning-shell/types";
import type { CampusResourceItem } from "@/lib/course-resources";
import { buildCourseResourcesHref } from "@/lib/course-navigation";
import { cn } from "@/lib/utils";

export type { LearningShellProps, SidebarTab } from "@/components/learning/course-learning-shell/types";

const CAMPUS_SIMPLE_VIEW_STORAGE_KEY = "webautismo:campus-simple-view";

export function CourseLearningShell({
  course,
  forumCategories,
  resources,
  progress,
  roleLabel,
  canModerate,
  editionLabel,
  accessUntil,
  initialActiveTab,
  initialFocusedResourceId = null,
  initialModuleIndex = 0,
  showOnboarding = false
}: LearningShellProps) {
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(initialModuleIndex);
  const [pendingActiveTab, setPendingActiveTab] = useState<SidebarTab | null>(null);
  const [simpleMode, setSimpleMode] = useState(false);
  const [focusedResourceId, setFocusedResourceId] = useState<string | null>(() => {
    if (initialFocusedResourceId) {
      return initialFocusedResourceId;
    }

    if (typeof window === "undefined") {
      return null;
    }

    return window.location.hash.startsWith("#resource-")
      ? window.location.hash.slice("#resource-".length)
      : null;
  });
  const activeTab = pendingActiveTab ?? initialActiveTab;
  const effectiveSimpleMode = canModerate ? simpleMode : true;
  const currentModule = progress.modules[selectedModuleIndex] ?? progress.modules[0] ?? null;
  const nextPendingModule = useMemo(
    () => progress.modules.find((module) => !module.isCompleted) ?? progress.modules[0] ?? null,
    [progress.modules]
  );
  const managedResources = useMemo(
    () => resources.filter((resource) => resource.isManaged),
    [resources]
  );
  const managedResourcesByModuleId = useMemo(() => {
    const groups = new Map<string, CampusResourceItem[]>();

    for (const resource of managedResources) {
      if (!resource.moduleId) {
        continue;
      }

      const currentGroup = groups.get(resource.moduleId) ?? [];
      currentGroup.push(resource);
      groups.set(resource.moduleId, currentGroup);
    }

    return groups;
  }, [managedResources]);
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
  const nextReviewSubmissionId = useMemo(() => {
    if (!canModerate) {
      return null;
    }

    for (const resource of managedExercises) {
      const nextSubmission = resource.submissions.find(
        (submission) =>
          submission.status === "SUBMITTED" || submission.status === "CHANGES_REQUESTED"
      );

      if (nextSubmission) {
        return nextSubmission.id;
      }
    }

    return null;
  }, [canModerate, managedExercises]);
  const focusedStudentExercise = useMemo(() => {
    if (canModerate || activeTab !== "resources" || !focusedResourceId) {
      return null;
    }

    return (
      managedExercises.find(
        (resource) => resource.id === focusedResourceId && resource.isExercise
      ) ?? null
    );
  }, [activeTab, canModerate, focusedResourceId, managedExercises]);
  const isFocusedTaskWorkspace = Boolean(focusedStudentExercise);
  const currentModuleResources = useMemo(() => {
    if (!currentModule) {
      return [];
    }

    return managedResourcesByModuleId.get(currentModule.id) ?? [];
  }, [currentModule, managedResourcesByModuleId]);
  const currentModuleMaterials = useMemo(
    () => currentModuleResources.filter((resource) => !resource.isExercise),
    [currentModuleResources]
  );
  const currentModuleExercises = useMemo(
    () => currentModuleResources.filter((resource) => resource.isExercise),
    [currentModuleResources]
  );
  const currentModulePrimaryMaterial = currentModuleMaterials[0] ?? null;

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

  function buildWorkspaceHref(input: {
    tab: SidebarTab;
    targetId?: string | null;
    resourceId?: string | null;
  }) {
    if (input.tab === "resources") {
      return buildCourseResourcesHref(
        course.slug,
        input.resourceId ? `resource-${input.resourceId}` : input.targetId ?? "resources-panel"
      );
    }

    const hash = input.targetId ? `#${input.targetId}` : "";
    return input.tab === "content"
      ? `/mis-cursos/${course.slug}${hash}`
      : `/mis-cursos/${course.slug}?tab=${input.tab}${hash}`;
  }

  function buildTabHref(tab: SidebarTab) {
    return buildWorkspaceHref({ tab });
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

  function selectModule(index: number) {
    setSelectedModuleIndex(index);

    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("module", String(index));
    const query = params.toString();
    const hash = window.location.hash;
    window.history.replaceState(
      window.history.state,
      "",
      `/mis-cursos/${course.slug}${query ? `?${query}` : ""}${hash}`
    );
  }

  function handleTabChange(nextTab: SidebarTab) {
    if (nextTab !== "resources") {
      setFocusedResourceId(null);
    }

    startTransition(() => {
      setPendingActiveTab(nextTab);
    });

    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", buildTabHref(nextTab));
    }
  }

  function handleResourceWorkspaceOpen(targetId?: string) {
    const nextTargetId = targetId ?? primaryResourceTargetId;
    const nextFocusedResourceId = nextTargetId.startsWith("resource-")
      ? nextTargetId.slice("resource-".length)
      : null;

    setFocusedResourceId(nextFocusedResourceId);

    if (activeTab !== "resources") {
      handleTabChange("resources");

      if (typeof window !== "undefined") {
        const nextUrl = buildWorkspaceHref({
          tab: "resources",
          targetId: nextTargetId,
          resourceId: nextFocusedResourceId
        });
        window.history.replaceState(window.history.state, "", nextUrl);
      }

      window.setTimeout(() => {
        scrollToCampusTarget(nextTargetId);
      }, 60);
      return;
    }

    if (typeof window !== "undefined") {
      const nextUrl = buildWorkspaceHref({
        tab: "resources",
        targetId: nextTargetId,
        resourceId: nextFocusedResourceId
      });
      window.history.replaceState(window.history.state, "", nextUrl);
    }

    scrollToCampusTarget(nextTargetId);
  }

  function openWorkspaceTarget(nextTab: SidebarTab, targetId: string) {
    if (nextTab === "resources") {
      handleResourceWorkspaceOpen(targetId);
      return;
    }

    if (activeTab !== nextTab) {
      handleTabChange(nextTab);

      if (typeof window !== "undefined") {
        const nextUrl = buildWorkspaceHref({ tab: nextTab, targetId });
        window.history.replaceState(window.history.state, "", nextUrl);
      }

      window.setTimeout(() => {
        scrollToCampusTarget(targetId);
      }, 60);
      return;
    }

    if (typeof window !== "undefined") {
      const nextUrl = buildWorkspaceHref({ tab: nextTab, targetId });
      window.history.replaceState(window.history.state, "", nextUrl);
    }

    scrollToCampusTarget(targetId);
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function syncFocusFromLocation() {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash.startsWith("resource-")) {
        setFocusedResourceId(hash.slice("resource-".length));
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const resourceId = params.get("resource");
      setFocusedResourceId(resourceId);
    }

    syncFocusFromLocation();
    window.addEventListener("hashchange", syncFocusFromLocation);

    return () => {
      window.removeEventListener("hashchange", syncFocusFromLocation);
    };
  }, []);

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

  function clearFocusedTaskWorkspace() {
    setFocusedResourceId(null);

    if (typeof window !== "undefined") {
      const nextUrl = buildWorkspaceHref({
        tab: "resources",
        targetId: "resources-panel"
      });
      window.history.replaceState(window.history.state, "", nextUrl);
    }

    scrollToCampusTarget("resources-panel");
  }

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
  const showCompactContentHeader = activeTab === "content" && !isFocusedTaskWorkspace;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedPreference = window.localStorage.getItem(CAMPUS_SIMPLE_VIEW_STORAGE_KEY);
    const nextSimpleMode = storedPreference === "true";
    const syncSimpleMode = window.setTimeout(() => {
      setSimpleMode(nextSimpleMode);
    }, 0);

    return () => {
      window.clearTimeout(syncSimpleMode);
    };
  }, []);

  function toggleSimpleMode() {
    setSimpleMode((currentValue) => {
      const nextValue = !currentValue;

      if (typeof window !== "undefined") {
        window.localStorage.setItem(CAMPUS_SIMPLE_VIEW_STORAGE_KEY, String(nextValue));
      }

      return nextValue;
    });
  }

  return (
    <div className="campus-calm-bg min-h-screen">
      <CourseLearningHeader
        activeTab={activeTab}
        canModerate={canModerate}
        courseSlug={course.slug}
        courseTitle={course.title}
        onResourcesClick={() =>
          isFocusedTaskWorkspace ? clearFocusedTaskWorkspace() : handleTabChange("resources")
        }
        onSimpleModeChange={toggleSimpleMode}
        onTabChange={handleTabChange}
        roleLabel={roleLabel}
        simpleMode={effectiveSimpleMode}
      />

      <div className="site-container py-7 xl:py-9">
        <CampusOnboarding courseSlug={course.slug} showInitially={showOnboarding} />
        <div
          className={cn(
            "mt-6 grid gap-6",
            isFocusedTaskWorkspace || effectiveSimpleMode
              ? "xl:grid-cols-1"
              : "xl:grid-cols-[minmax(0,1fr)_19.5rem] 2xl:grid-cols-[minmax(0,1fr)_21rem]"
          )}
        >
          <div className="space-y-5">
            {isFocusedTaskWorkspace ? (
              <FocusedTaskIntro courseSlug={course.slug} onClearFocus={clearFocusedTaskWorkspace} />
            ) : !canModerate && showCompactContentHeader ? (
              <CompactLessonHeader
                canModerate={canModerate}
                course={course}
                currentModule={currentModule}
                currentModuleExercises={currentModuleExercises}
                currentModuleMaterials={currentModuleMaterials}
                currentModulePrimaryMaterial={currentModulePrimaryMaterial}
                editionLabel={editionLabel}
                onOpenCurrentExercise={() => {
                  if (currentModuleExercises[0]) {
                    handleResourceWorkspaceOpen(`resource-${currentModuleExercises[0].id}`);
                  }
                }}
                onOpenCurrentLesson={() => openWorkspaceTarget("content", "content-current-module")}
                roleLabel={roleLabel}
              />
            ) : canModerate && showCompactContentHeader ? (
              <CompactLessonHeader
                canModerate={canModerate}
                course={course}
                currentModule={currentModule}
                currentModuleExercises={currentModuleExercises}
                currentModuleMaterials={currentModuleMaterials}
                currentModulePrimaryMaterial={currentModulePrimaryMaterial}
                editionLabel={editionLabel}
                onOpenCurrentExercise={() => {
                  if (currentModuleExercises[0]) {
                    handleResourceWorkspaceOpen(`resource-${currentModuleExercises[0].id}`);
                  }
                }}
                onOpenCurrentLesson={() => openWorkspaceTarget("content", "content-current-module")}
                roleLabel={roleLabel}
              />
            ) : canModerate ? (
              <CourseLearningHero
                accessUntil={accessUntil}
                canModerate={canModerate}
                course={course}
                currentModule={currentModule}
                currentModuleExercises={currentModuleExercises}
                currentModuleMaterials={currentModuleMaterials}
                currentModulePrimaryMaterial={currentModulePrimaryMaterial}
                editionLabel={editionLabel}
                heroMetrics={heroMetrics}
                nextPendingModule={nextPendingModule}
                nextReviewSubmissionId={nextReviewSubmissionId}
                onOpenCurrentExercise={() => {
                  if (currentModuleExercises[0]) {
                    handleResourceWorkspaceOpen(`resource-${currentModuleExercises[0].id}`);
                  }
                }}
                onOpenCurrentLesson={() => openWorkspaceTarget("content", "content-current-module")}
                onOpenResources={() => handleResourceWorkspaceOpen()}
                primarySummary={primarySummary}
                progress={progress}
                roleLabel={roleLabel}
                simpleMode={effectiveSimpleMode}
              />
            ) : null}

            {activeTab === "content" ? (
              <CourseLearningContentTab
                canModerate={canModerate}
                course={course}
                currentModule={currentModule}
                currentModuleExercises={currentModuleExercises}
                currentModuleMaterials={currentModuleMaterials}
                currentModulePrimaryMaterial={currentModulePrimaryMaterial}
                managedExercisesCount={managedExercises.length}
                managedResourcesByModuleId={managedResourcesByModuleId}
                nextPendingModule={nextPendingModule}
                onOpenResourceWorkspace={handleResourceWorkspaceOpen}
                onOpenWorkspaceTarget={openWorkspaceTarget}
                onSelectModule={selectModule}
                progress={progress}
                selectedModuleIndex={selectedModuleIndex}
                simpleMode={effectiveSimpleMode}
                studentOpenExercisesCount={studentOpenExercises.length}
                studentUnderReviewExercisesCount={studentUnderReviewExercises.length}
                teacherPendingReviews={teacherPendingReviews}
              />
            ) : null}

            {activeTab === "resources" ? (
              <CourseLearningResourcesTab
                canModerate={canModerate}
                course={course}
                focusedStudentExerciseId={focusedStudentExercise?.id ?? null}
                isFocusedTaskWorkspace={isFocusedTaskWorkspace}
                managedExercisesCount={managedExercises.length}
                managedMaterialsCount={managedMaterials.length}
                onExitFocus={clearFocusedTaskWorkspace}
                resources={resources}
                roleLabel={roleLabel}
                simpleMode={effectiveSimpleMode}
                studentUnderReviewExercisesCount={studentUnderReviewExercises.length}
                teacherPendingReviews={teacherPendingReviews}
              />
            ) : null}

            {activeTab === "support" ? (
              <CourseLearningSupportTab
                canModerate={canModerate}
                courseSlug={course.slug}
                forumCategories={forumCategories}
                simpleMode={effectiveSimpleMode}
              />
            ) : null}
          </div>

          {!isFocusedTaskWorkspace && !effectiveSimpleMode ? (
            <CourseLearningAside
              canModerate={canModerate}
              courseSlug={course.slug}
              currentModule={currentModule}
              managedExercisesCount={managedExercises.length}
              onOpenWorkspaceTarget={openWorkspaceTarget}
              primaryResourceTargetId={primaryResourceTargetId}
              studentOpenExercisesCount={studentOpenExercises.length}
              studentUnderReviewExercisesCount={studentUnderReviewExercises.length}
              teacherPendingReviews={teacherPendingReviews}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
