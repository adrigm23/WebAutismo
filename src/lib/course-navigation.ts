import type { NotificationCategory } from "@prisma/client";

export type CourseWorkspaceTab = "content" | "resources" | "support";

function buildWorkspaceHref(input: {
  courseSlug: string;
  tab: CourseWorkspaceTab;
  targetId?: string | null;
  resourceId?: string | null;
}) {
  const params = new URLSearchParams();

  if (input.tab !== "content") {
    params.set("tab", input.tab);
  }

  if (input.tab === "resources" && input.resourceId) {
    params.set("resource", input.resourceId);
  }

  const query = params.toString();
  const hash = input.targetId ? `#${input.targetId}` : "";

  return `/mis-cursos/${input.courseSlug}${query ? `?${query}` : ""}${hash}`;
}

export function buildCourseContentHref(courseSlug: string, targetId = "content-current-module") {
  return buildWorkspaceHref({
    courseSlug,
    tab: "content",
    targetId
  });
}

export function buildCourseResourcesHref(courseSlug: string, targetId = "resources-panel") {
  const resourceId = targetId.startsWith("resource-")
    ? targetId.slice("resource-".length)
    : null;

  return buildWorkspaceHref({
    courseSlug,
    tab: "resources",
    targetId,
    resourceId
  });
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
