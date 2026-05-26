import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CourseLearningShell } from "@/components/learning/course-learning-shell";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getCourseProgressDetailsForUser } from "@/lib/course-progress";
import {
  canAccessCourseCommunityForCourse,
  canModerateCourse,
  getRoleLabel,
} from "@/lib/course-community";
import { canViewCourseProgress } from "@/lib/course-permissions";
import { getCampusResources } from "@/lib/course-resources";
import {
  buildCourseResourcesHref,
  COURSE_RESOURCE_MANAGER_TARGET_ID,
  LEGACY_RESOURCE_MANAGER_RESOURCE_ID,
  normalizeCourseResourceQueryValue,
} from "@/lib/course-navigation";
import { getForumCategories } from "@/lib/forum";
import { firstValue } from "@/lib/utils";

type MyCoursePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    tab?: string | string[];
    resource?: string | string[];
    module?: string | string[];
    onboarding?: string | string[];
  }>;
};

function getSidebarTab(value: string | string[] | undefined) {
  const candidate = firstValue(value);
  return candidate === "resources" || candidate === "support"
    ? candidate
    : "content";
}

function getModuleIndex(
  value: string | string[] | undefined,
  moduleCount: number,
) {
  const raw = firstValue(value);
  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  if (moduleCount <= 0) {
    return 0;
  }

  return Math.min(parsed, moduleCount - 1);
}

export async function generateMetadata({
  params,
}: MyCoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Mi curso | ${course.title}` : "Mi curso",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function MyCoursePage({
  params,
  searchParams,
}: MyCoursePageProps) {
  const [{ slug }, { tab, resource, module, onboarding }] = await Promise.all([
    params,
    searchParams,
  ]);
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}`);
  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  if (!access.allowed) {
    redirect(`/mis-cursos/${course.slug}/renovar-acceso`);
  }

  const canModerate = canModerateCourse(access.role);
  const requestedTab = getSidebarTab(tab);
  const rawFocusedResourceId = firstValue(resource);

  if (requestedTab === "support") {
    redirect(`/mis-cursos/${course.slug}/foro`);
  }

  if (
    requestedTab === "resources" &&
    rawFocusedResourceId === LEGACY_RESOURCE_MANAGER_RESOURCE_ID
  ) {
    redirect(buildCourseResourcesHref(course.slug, COURSE_RESOURCE_MANAGER_TARGET_ID));
  }

  const activeTab = requestedTab;
  const focusedResourceId =
    activeTab === "resources"
      ? normalizeCourseResourceQueryValue(rawFocusedResourceId)
      : null;
  const progressPromise = getCourseProgressDetailsForUser({
    userId: user.id,
    course,
  });
  const forumCategoriesPromise = getForumCategories(course.slug, access.role);
  const resourcesPromise = getCampusResources({
    course,
    viewerUserId: user.id,
    canModerate,
  });
  const [progress, forumCategories, resources] = await Promise.all([
    progressPromise,
    forumCategoriesPromise,
    resourcesPromise,
  ]);
  const initialModuleIndex = getModuleIndex(module, progress.modules.length);
  const showOnboarding = firstValue(onboarding) === "1";

  return (
    <CourseLearningShell
      initialActiveTab={activeTab}
      course={course}
      forumCategories={forumCategories}
      canModerate={canModerate}
      progress={progress}
      resources={resources}
      showTrackingNav={canViewCourseProgress({
        globalRole: user.globalRole,
        viewerRole: access.role,
      })}
      roleLabel={getRoleLabel(access.role)}
      viewerName={user.name ?? user.email}
      initialFocusedResourceId={focusedResourceId}
      editionLabel={course.activeEdition?.label ?? null}
      accessUntil={
        access.enrollment?.accessUntil ??
        course.activeEdition?.accessUntil ??
        null
      }
      initialModuleIndex={initialModuleIndex}
      showOnboarding={showOnboarding}
    />
  );
}
