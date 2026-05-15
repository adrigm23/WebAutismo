export type CourseWorkspaceTab = "content" | "resources" | "support";

function buildWorkspaceHref(input: {
  courseSlug: string;
  tab: CourseWorkspaceTab;
  targetId?: string | null;
}) {
  const query = input.tab === "content" ? "" : `?tab=${input.tab}`;
  const hash = input.targetId ? `#${input.targetId}` : "";

  return `/mis-cursos/${input.courseSlug}${query}${hash}`;
}

export function buildCourseContentHref(courseSlug: string, targetId = "content-current-module") {
  return buildWorkspaceHref({
    courseSlug,
    tab: "content",
    targetId
  });
}

export function buildCourseResourcesHref(courseSlug: string, targetId = "resources-panel") {
  return buildWorkspaceHref({
    courseSlug,
    tab: "resources",
    targetId
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
