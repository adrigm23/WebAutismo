"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { CampusOnboarding } from "@/components/campus/campus-onboarding";
import {
  CompactLessonHeader,
  CourseLearningContentTab,
  CourseLearningResourcesTab,
  CourseLearningSupportTab,
} from "@/components/learning/course-learning-shell/course-learning-panels";
import {
  CourseLearningHeader,
  FocusedTaskHeader,
} from "@/components/learning/course-learning-shell/course-learning-header";
import type {
  LearningShellProps,
  SidebarTab,
} from "@/components/learning/course-learning-shell/types";
import type { CampusResourceItem } from "@/lib/course-resources";
import {
  buildCourseResourcesHref,
  getCourseResourceIdFromTargetId,
  normalizeCourseResourceQueryValue,
} from "@/lib/course-navigation";
import { cn } from "@/lib/utils";

export type {
  LearningShellProps,
  SidebarTab,
} from "@/components/learning/course-learning-shell/types";

export function CourseLearningShell({
  course,
  forumCategories,
  resources,
  progress,
  viewerName,
  roleLabel,
  canModerate,
  showTrackingNav,
  editionLabel,
  initialActiveTab,
  initialFocusedResourceId = null,
  initialModuleIndex = 0,
  showOnboarding = false,
}: LearningShellProps) {
  const [selectedModuleIndex, setSelectedModuleIndex] =
    useState(initialModuleIndex);
  const [pendingActiveTab, setPendingActiveTab] = useState<SidebarTab | null>(
    null,
  );
  const [focusedResourceId, setFocusedResourceId] = useState<string | null>(
    () => {
      if (initialFocusedResourceId) {
        return initialFocusedResourceId;
      }

      if (typeof window === "undefined") {
        return null;
      }

      return window.location.hash.startsWith("#resource-")
        ? window.location.hash.slice("#resource-".length)
        : null;
    },
  );
  const activeTab = pendingActiveTab ?? initialActiveTab;
  const currentModule =
    progress.modules[selectedModuleIndex] ?? progress.modules[0] ?? null;
  const managedResources = useMemo(
    () => resources.filter((resource) => resource.isManaged),
    [resources],
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
  const managedExercises = useMemo(
    () => managedResources.filter((resource) => resource.isExercise),
    [managedResources],
  );
  const studentOpenExercises = useMemo(
    () =>
      managedExercises.filter(
        (resource) =>
          !resource.viewerSubmission ||
          resource.viewerSubmission.status === "CHANGES_REQUESTED",
      ),
    [managedExercises],
  );
  const nextReviewSubmissionId = useMemo(() => {
    if (!canModerate) {
      return null;
    }

    for (const resource of managedExercises) {
      const nextSubmission = resource.submissions.find(
        (submission) =>
          submission.status === "SUBMITTED" ||
          submission.status === "CHANGES_REQUESTED",
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
        (resource) => resource.id === focusedResourceId && resource.isExercise,
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
    [currentModuleResources],
  );
  const currentModuleExercises = useMemo(
    () => currentModuleResources.filter((resource) => resource.isExercise),
    [currentModuleResources],
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
        input.resourceId
          ? `resource-${input.resourceId}`
          : (input.targetId ?? "resources-panel"),
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
      `/mis-cursos/${course.slug}${query ? `?${query}` : ""}${hash}`,
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
      window.history.replaceState(
        window.history.state,
        "",
        buildTabHref(nextTab),
      );
    }
  }

  function handleResourceWorkspaceOpen(targetId?: string) {
    const nextTargetId = targetId ?? primaryResourceTargetId;
    const nextFocusedResourceId = getCourseResourceIdFromTargetId(nextTargetId);

    setFocusedResourceId(nextFocusedResourceId);

    if (activeTab !== "resources") {
      handleTabChange("resources");

      if (typeof window !== "undefined") {
        const nextUrl = buildWorkspaceHref({
          tab: "resources",
          targetId: nextTargetId,
          resourceId: nextFocusedResourceId,
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
        resourceId: nextFocusedResourceId,
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
      const resourceId = normalizeCourseResourceQueryValue(params.get("resource"));
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
        targetId: "resources-panel",
      });
      window.history.replaceState(window.history.state, "", nextUrl);
    }

    scrollToCampusTarget("resources-panel");
  }

  const showCompactContentHeader =
    activeTab === "content" && !isFocusedTaskWorkspace;
  const headerStatusLabel = canModerate
    ? "Docencia activa"
    : progress.isCompleted
      ? "Completado"
      : progress.hasStarted
        ? "En progreso"
        : "Listo para empezar";
  const headerPrimaryActionLabel =
    activeTab === "content" ? "Abrir recursos" : "Ver guia de inicio";
  const focusedTaskStatusLabel = focusedStudentExercise
    ? !focusedStudentExercise.viewerSubmission && !focusedStudentExercise.isSubmissionClosed
      ? "Pendiente"
      : !focusedStudentExercise.viewerSubmission
        ? "Cerrada"
        : focusedStudentExercise.viewerSubmission.status === "CHANGES_REQUESTED"
          ? "Cambios solicitados"
          : focusedStudentExercise.viewerSubmission.status === "SUBMITTED"
            ? "En revision"
            : "Revisada"
    : "Pendiente";

  return (
    <div className="campus-calm-bg min-h-screen">
      {isFocusedTaskWorkspace && focusedStudentExercise ? (
        <FocusedTaskHeader
          courseTitle={course.title}
          fullName={viewerName}
          moduleTitle={focusedStudentExercise.moduleTitle}
          onBack={clearFocusedTaskWorkspace}
          statusLabel={focusedTaskStatusLabel}
        />
      ) : (
        <CourseLearningHeader
          activeTab={activeTab}
          courseSlug={course.slug}
          courseTitle={course.title}
          fullName={viewerName}
          onPrimaryAction={() => {
            if (activeTab === "content") {
              handleResourceWorkspaceOpen();
              return;
            }

            openWorkspaceTarget("content", "content-current-module");
          }}
          onTabChange={handleTabChange}
          primaryActionLabel={headerPrimaryActionLabel}
          roleLabel={roleLabel}
          showTrackingNav={showTrackingNav}
          statusLabel={headerStatusLabel}
        />
      )}

      <div
        className={cn(
          "app-container",
          isFocusedTaskWorkspace ? "py-6 sm:py-8 xl:py-10" : "py-4 sm:py-5 xl:py-6",
        )}
      >
        <CampusOnboarding
          courseSlug={course.slug}
          showInitially={showOnboarding}
        />
        <div
          className={cn(
            "space-y-4",
            !canModerate && activeTab === "content" && "mx-auto max-w-[78rem]",
            !canModerate &&
              activeTab === "resources" &&
              !isFocusedTaskWorkspace &&
              "mx-auto max-w-[84rem]",
            !canModerate && activeTab === "support" && "mx-auto max-w-[84rem]",
            canModerate &&
              activeTab === "resources" &&
              !isFocusedTaskWorkspace &&
              "mx-auto min-h-[calc(100dvh-13rem)] max-w-[84rem]",
            isFocusedTaskWorkspace && "mx-auto max-w-[74rem]",
          )}
        >
          {showCompactContentHeader ? (
            <CompactLessonHeader
              canModerate={canModerate}
              course={course}
              currentModule={currentModule}
              currentModuleExercises={currentModuleExercises}
              currentModuleMaterials={currentModuleMaterials}
              currentModulePrimaryMaterial={currentModulePrimaryMaterial}
              editionLabel={editionLabel}
              nextReviewSubmissionId={nextReviewSubmissionId}
              onOpenCurrentExercise={() => {
                if (currentModuleExercises[0]) {
                  handleResourceWorkspaceOpen(
                    `resource-${currentModuleExercises[0].id}`,
                  );
                }
              }}
              onOpenCurrentLesson={() =>
                openWorkspaceTarget("content", "content-current-module")
              }
              onOpenResources={() => handleResourceWorkspaceOpen()}
              onOpenSupport={() => handleTabChange("support")}
              roleLabel={roleLabel}
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
              managedResourcesByModuleId={managedResourcesByModuleId}
              onOpenResourceWorkspace={handleResourceWorkspaceOpen}
              onSelectModule={selectModule}
              progress={progress}
              selectedModuleIndex={selectedModuleIndex}
            />
          ) : null}

          {activeTab === "resources" ? (
            <CourseLearningResourcesTab
              canModerate={canModerate}
              course={course}
              focusedStudentExerciseId={focusedStudentExercise?.id ?? null}
              isFocusedTaskWorkspace={isFocusedTaskWorkspace}
              onOpenResourceWorkspace={handleResourceWorkspaceOpen}
              resources={resources}
              roleLabel={roleLabel}
            />
          ) : null}

          {activeTab === "support" ? (
            <CourseLearningSupportTab
              courseSlug={course.slug}
              forumCategories={forumCategories}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
