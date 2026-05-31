import type { NotificationCategory } from "@prisma/client";

export type CourseWorkspaceTab = "content" | "resources" | "support";

export const COURSE_RESOURCE_TARGET_PREFIX = "resource-";
export const COURSE_RESOURCE_MANAGER_TARGET_ID = "resource-manager-top";
export const LEGACY_RESOURCE_MANAGER_RESOURCE_ID = "manager-top";
export const COURSE_RESOURCE_PUBLISH_FEEDBACK_QUERY = "resourcePublished";

export function getCourseResourceIdFromTargetId(targetId: string | null | undefined) {
  if (
    !targetId ||
    !targetId.startsWith(COURSE_RESOURCE_TARGET_PREFIX) ||
    targetId === COURSE_RESOURCE_MANAGER_TARGET_ID
  ) {
    return null;
  }

  return targetId.slice(COURSE_RESOURCE_TARGET_PREFIX.length) || null;
}

export function normalizeCourseResourceQueryValue(resourceId: string | null | undefined) {
  if (!resourceId || resourceId === LEGACY_RESOURCE_MANAGER_RESOURCE_ID) {
    return null;
  }

  return resourceId;
}

function buildWorkspaceHref(input: {
  courseSlug: string;
  tab: CourseWorkspaceTab;
  targetId?: string | null;
  resourceId?: string | null;
  moduleIndex?: number | null;
  onboarding?: boolean;
}) {
  const params = new URLSearchParams();

  if (input.tab !== "content") {
    params.set("tab", input.tab);
  }

  if (input.tab === "resources" && input.resourceId) {
    params.set("resource", input.resourceId);
  }

  if (typeof input.moduleIndex === "number" && input.moduleIndex >= 0) {
    params.set("module", String(input.moduleIndex));
  }

  if (input.onboarding) {
    params.set("onboarding", "1");
  }

  const query = params.toString();
  const hash = input.targetId ? `#${input.targetId}` : "";

  return `/mis-cursos/${input.courseSlug}${query ? `?${query}` : ""}${hash}`;
}

export function buildCourseContentHref(
  courseSlug: string,
  options?: {
    targetId?: string;
    moduleIndex?: number;
    onboarding?: boolean;
  }
) {
  return buildWorkspaceHref({
    courseSlug,
    tab: "content",
    targetId: options?.targetId ?? "content-current-module",
    moduleIndex: options?.moduleIndex ?? null,
    onboarding: options?.onboarding
  });
}

export function buildCourseResourcesHref(courseSlug: string, targetId = "resources-panel") {
  const resourceId = getCourseResourceIdFromTargetId(targetId);

  return buildWorkspaceHref({
    courseSlug,
    tab: "resources",
    targetId,
    resourceId
  });
}

export function buildPublishedCourseResourceHref(
  courseSlug: string,
  resourceId: string,
) {
  const params = new URLSearchParams();
  params.set("tab", "resources");
  params.set("resource", resourceId);
  params.set(COURSE_RESOURCE_PUBLISH_FEEDBACK_QUERY, "1");

  return `/mis-cursos/${courseSlug}?${params.toString()}#resource-${resourceId}`;
}

export function buildCourseSupportHref(
  courseSlug: string,
  targetId = "support-forum-categories"
) {
  return buildWorkspaceHref({
    courseSlug,
    tab: "support",
    targetId
  });
}

export function buildCourseForumHref(courseSlug: string) {
  return `/mis-cursos/${courseSlug}/foro`;
}

export function buildLessonPlayerHref(courseSlug: string, moduleIndex: number) {
  return `/mis-cursos/${courseSlug}/leccion/${moduleIndex}`;
}

export function buildCourseTrackingHref(input: {
  courseSlug: string;
  submissionId?: string | null;
}) {
  const hash = input.submissionId ? `#submission-${input.submissionId}` : "";
  return `/mis-cursos/${input.courseSlug}/seguimiento${hash}`;
}

function parseNotificationMetadata(metadataJson: string | null | undefined) {
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function resolvePlatformNotificationHref(input: {
  category: NotificationCategory;
  linkPath: string;
  metadataJson?: string | null;
}) {
  const courseMatch = input.linkPath.match(/^\/mis-cursos\/([^/?#]+)/);

  if (!courseMatch) {
    return input.linkPath;
  }

  const courseSlug = decodeURIComponent(courseMatch[1] ?? "");
  const metadata = parseNotificationMetadata(input.metadataJson);
  const resourceId =
    metadata && typeof metadata.resourceId === "string" ? metadata.resourceId : null;
  const submissionId =
    metadata && typeof metadata.submissionId === "string" ? metadata.submissionId : null;

  if (resourceId) {
    return buildCourseResourcesHref(courseSlug, `resource-${resourceId}`);
  }

  if (submissionId) {
    return buildCourseTrackingHref({
      courseSlug,
      submissionId
    });
  }

  if (input.category === "COURSE") {
    return buildCourseResourcesHref(courseSlug);
  }

  if (input.category === "PURCHASE") {
    return buildCourseContentHref(courseSlug);
  }

  return input.linkPath;
}
