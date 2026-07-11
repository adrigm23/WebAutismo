import type { CourseResourceSubmissionStatus, NotificationCategory } from "@prisma/client";
import type { ForumNotificationListItem } from "@/lib/forum";
import type { UserCourseSpace } from "@/lib/course-community";
import type { CourseIdentity } from "@/lib/course-identity";
import { buildCourseTrackingHref } from "@/lib/course-navigation";
import type { CourseLearnerProgressSummary } from "@/lib/course-progress";
import { isDatabaseSchemaDriftError } from "@/lib/db-errors";
import { getUserForumNotifications } from "@/lib/forum";
import { ensureNotificationPreference, getUserPlatformNotifications } from "@/lib/notifications";
import { getDb } from "@/lib/prisma";

export type TeacherDashboardPendingItem = {
  id: string;
  href: string;
  courseTitle: string;
  resourceTitle: string;
  learnerName: string;
  submittedAt: Date;
  statusLabel: string;
};

export type TeacherDashboardSubmissionActivityItem = {
  id: string;
  href: string;
  title: string;
  body: string;
  createdAt: Date;
  tone: "teacher" | "student";
  sourceLabel: "Revision" | "Entrega";
};

function buildTeacherTrackingDeepLink(input: {
  courseSlug: string;
  submissionId: string;
}) {
  return buildCourseTrackingHref(input);
}

export type TeacherDashboardCourseSummary = {
  space: UserCourseSpace;
  learnerIds: string[];
  learnerCount: number;
  averageCompletionRate: number;
  managedResourceCount: number;
  exerciseCount: number;
  pendingReviewItems: TeacherDashboardPendingItem[];
  recentSubmissionActivity: TeacherDashboardSubmissionActivityItem[];
  reviewedSubmissionCount: number;
  totalSubmissionCount: number;
};

export type StudentDashboardPendingSource = {
  courseSlug: string;
  courseTitle: string;
  resourceId: string;
  title: string;
  dueAt: Date | null;
  isSubmissionClosed: boolean;
  viewerSubmission: {
    status: CourseResourceSubmissionStatus;
    feedback: string | null;
  } | null;
};

export type DashboardNotificationSnapshot = {
  preference: {
    emailEnabled: boolean;
    webEnabled: boolean;
  };
  platformNotifications: {
    notifications: Array<{
      id: string;
      category: NotificationCategory;
      title: string;
      body: string;
      linkPath: string;
      metadataJson: string | null;
      readAt: Date | null;
      createdAt: Date;
    }>;
    unreadCount: number;
  };
  forumNotifications: {
    notifications: ForumNotificationListItem[];
    unreadCount: number;
  };
  unreadCount: number;
};

function getSubmissionStatusLabel(status: CourseResourceSubmissionStatus) {
  if (status === "REVIEWED") {
    return "Revisada";
  }

  return status === "CHANGES_REQUESTED" ? "Cambios solicitados" : "Pendiente de revision";
}

export async function getTeacherDashboardCourseSummaries(input: {
  spaces: UserCourseSpace[];
  learnerSummariesByCourse: Map<string, CourseLearnerProgressSummary>;
}) {
  if (input.spaces.length === 0) {
    return [] as TeacherDashboardCourseSummary[];
  }

  const courseIds = input.spaces.map((space) => space.course.id);
  const db = getDb();

  // Phase 1: load resources with only PENDING submissions (capped at 100 per resource).
  // This replaces loading ALL submissions (could be thousands) with a minimal set.
  const resources = await db.courseResource.findMany({
    where: { courseId: { in: courseIds } },
    select: {
      id: true,
      courseId: true,
      title: true,
      type: true,
      submissions: {
        where: { status: "SUBMITTED" },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          student: { select: { name: true } }
        },
        take: 100,
        orderBy: { submittedAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const resourceIds = resources.map((r) => r.id);

  // Phase 2: accurate submission counts via lightweight groupBy (no row data).
  const [totalGroups, reviewedGroups] = resourceIds.length > 0
    ? await Promise.all([
        db.courseResourceSubmission.groupBy({
          by: ["resourceId"],
          where: { resourceId: { in: resourceIds } },
          _count: { _all: true }
        }),
        db.courseResourceSubmission.groupBy({
          by: ["resourceId"],
          where: { resourceId: { in: resourceIds }, status: "REVIEWED" },
          _count: { _all: true }
        })
      ])
    : [[], []];

  const totalCountById = new Map(totalGroups.map((g) => [g.resourceId, g._count._all]));
  const reviewedCountById = new Map(reviewedGroups.map((g) => [g.resourceId, g._count._all]));

  const resourcesByCourseId = new Map<
    string,
    Array<{
      id: string;
      title: string;
      type: "MATERIAL" | "EXERCISE";
      submissions: Array<{
        id: string;
        status: CourseResourceSubmissionStatus;
        submittedAt: Date;
        reviewedAt: Date | null;
        student: { name: string };
      }>;
    }>
  >();

  for (const resource of resources) {
    const bucket = resourcesByCourseId.get(resource.courseId) ?? [];
    bucket.push(resource);
    resourcesByCourseId.set(resource.courseId, bucket);
  }

  return input.spaces.map((space) => {
    const learnerSummary = input.learnerSummariesByCourse.get(space.course.slug) ?? {
      learnerIds: [],
      learnerCount: 0,
      averageCompletionRate: 0
    };
    const courseResources = resourcesByCourseId.get(space.course.id) ?? [];
    const pendingReviewItems: TeacherDashboardPendingItem[] = [];
    const recentSubmissionActivity: TeacherDashboardSubmissionActivityItem[] = [];
    let exerciseCount = 0;
    let reviewedSubmissionCount = 0;
    let totalSubmissionCount = 0;

    for (const resource of courseResources) {
      if (resource.type === "EXERCISE") {
        exerciseCount += 1;
      }

      totalSubmissionCount += totalCountById.get(resource.id) ?? 0;
      reviewedSubmissionCount += reviewedCountById.get(resource.id) ?? 0;

      for (const submission of resource.submissions) {
        pendingReviewItems.push({
          id: submission.id,
          href: buildTeacherTrackingDeepLink({
            courseSlug: space.course.slug,
            submissionId: submission.id
          }),
          courseTitle: space.course.title,
          resourceTitle: resource.title,
          learnerName: submission.student.name,
          submittedAt: submission.submittedAt,
          statusLabel: getSubmissionStatusLabel(submission.status)
        });

        recentSubmissionActivity.push({
          id: `submission-${submission.id}`,
          href: buildTeacherTrackingDeepLink({
            courseSlug: space.course.slug,
            submissionId: submission.id
          }),
          title: `Nueva entrega en ${space.course.title}`,
          body: `${submission.student.name} ha enviado "${resource.title}".`,
          createdAt: submission.submittedAt,
          tone: "student",
          sourceLabel: "Entrega"
        });
      }
    }

    return {
      space,
      learnerIds: learnerSummary.learnerIds,
      learnerCount: learnerSummary.learnerCount,
      averageCompletionRate: learnerSummary.averageCompletionRate,
      managedResourceCount: courseResources.length,
      exerciseCount,
      pendingReviewItems: pendingReviewItems.sort(
        (left, right) => right.submittedAt.getTime() - left.submittedAt.getTime()
      ),
      recentSubmissionActivity: recentSubmissionActivity.sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
      ),
      reviewedSubmissionCount,
      totalSubmissionCount
    } satisfies TeacherDashboardCourseSummary;
  });
}

export async function getStudentDashboardPendingSources(input: {
  spaces: UserCourseSpace[];
  userId: string;
}) {
  if (input.spaces.length === 0) {
    return [] as StudentDashboardPendingSource[];
  }

  const courseById = new Map(input.spaces.map((space) => [space.course.id, space] as const));
  const resources = await getDb().courseResource.findMany({
    where: {
      courseId: {
        in: input.spaces.map((space) => space.course.id)
      },
      type: "EXERCISE",
      isPublished: true
    },
    select: {
      id: true,
      courseId: true,
      title: true,
      dueAt: true,
      submissions: {
        where: {
          studentId: input.userId
        },
        orderBy: {
          submittedAt: "desc"
        },
        take: 1,
        select: {
          status: true,
          feedback: true
        }
      }
    },
    orderBy: [
      {
        sortOrder: "asc"
      },
      {
        createdAt: "desc"
      }
    ]
  });

  return resources.flatMap((resource) => {
    const space = courseById.get(resource.courseId);

    if (!space) {
      return [];
    }

    return [
      {
        courseSlug: space.course.slug,
        courseTitle: space.course.title,
        resourceId: resource.id,
        title: resource.title,
        dueAt: resource.dueAt,
        isSubmissionClosed: Boolean(resource.dueAt && resource.dueAt.getTime() < Date.now()),
        viewerSubmission: resource.submissions[0]
          ? {
              status: resource.submissions[0].status,
              feedback: resource.submissions[0].feedback
            }
          : null
      } satisfies StudentDashboardPendingSource
    ];
  });
}

export type DashboardMaterialResource = {
  id: string;
  isManaged: boolean;
  isExercise: boolean;
  createdAt: Date | null;
  title: string;
  moduleTitle: string | null;
};

export type DashboardMaterialsByCourse = {
  courseSlug: string;
  courseTitle: string;
  resources: DashboardMaterialResource[];
};

// Combines what getStudentDashboardPendingSources (EXERCISE resources) and
// the "recent materials" widget (MATERIAL resources) each need into a single
// courseResource query, split back into the two shapes in memory. Only used
// where both are needed together — getStudentDashboardPendingSources stays
// as-is for callers that only need the pending-exercises list.
export async function getStudentDashboardResourcesForCourseSpaces(input: {
  spaces: UserCourseSpace[];
  userId: string;
  recentMaterialsLimit?: number;
}): Promise<{
  pendingSources: StudentDashboardPendingSource[];
  recentMaterialsByCourse: DashboardMaterialsByCourse[];
}> {
  if (input.spaces.length === 0) {
    return { pendingSources: [], recentMaterialsByCourse: [] };
  }

  const courseById = new Map(input.spaces.map((space) => [space.course.id, space] as const));
  const resources = await getDb().courseResource.findMany({
    where: {
      courseId: {
        in: input.spaces.map((space) => space.course.id)
      },
      type: {
        in: ["MATERIAL", "EXERCISE"]
      },
      isPublished: true
    },
    select: {
      id: true,
      courseId: true,
      moduleId: true,
      type: true,
      title: true,
      createdAt: true,
      dueAt: true,
      submissions: {
        where: {
          studentId: input.userId
        },
        orderBy: {
          submittedAt: "desc"
        },
        take: 1,
        select: {
          status: true,
          feedback: true
        }
      }
    },
    orderBy: [
      {
        sortOrder: "asc"
      },
      {
        createdAt: "desc"
      }
    ]
  });

  const pendingSources = resources.flatMap((resource) => {
    if (resource.type !== "EXERCISE") {
      return [];
    }

    const space = courseById.get(resource.courseId);

    if (!space) {
      return [];
    }

    return [
      {
        courseSlug: space.course.slug,
        courseTitle: space.course.title,
        resourceId: resource.id,
        title: resource.title,
        dueAt: resource.dueAt,
        isSubmissionClosed: Boolean(resource.dueAt && resource.dueAt.getTime() < Date.now()),
        viewerSubmission: resource.submissions[0]
          ? {
              status: resource.submissions[0].status,
              feedback: resource.submissions[0].feedback
            }
          : null
      } satisfies StudentDashboardPendingSource
    ];
  });

  const recentMaterials = resources
    .filter((resource) => resource.type === "MATERIAL")
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, input.recentMaterialsLimit ?? 5);

  const recentMaterialsByCourse = input.spaces.map((space) => {
    const moduleTitleById = new Map(
      space.course.modules.map((module) => [module.id, module.title])
    );

    return {
      courseSlug: space.course.slug,
      courseTitle: space.course.title,
      resources: recentMaterials
        .filter((resource) => resource.courseId === space.course.id)
        .map((resource) => ({
          id: resource.id,
          title: resource.title,
          moduleTitle: resource.moduleId ? moduleTitleById.get(resource.moduleId) ?? null : null,
          createdAt: resource.createdAt,
          isManaged: true,
          isExercise: false
        }))
    } satisfies DashboardMaterialsByCourse;
  });

  return { pendingSources, recentMaterialsByCourse };
}

export async function getDashboardNotificationSnapshot(input: {
  userId: string;
  courseSlugs: string[];
  platformLimit?: number;
  forumLimit?: number;
  // Optional: pass {id, slug} pairs when the caller already resolved them
  // (e.g. from getUserCourseSpaces) to skip a redundant Course lookup.
  courseIdentities?: CourseIdentity[];
}) {
  try {
    const [preference, platformNotifications, forumNotifications] = await Promise.all([
      ensureNotificationPreference(input.userId),
      getUserPlatformNotifications({
        userId: input.userId,
        limit: input.platformLimit ?? 4
      }),
      getUserForumNotifications({
        userId: input.userId,
        courseSlugs: input.courseSlugs,
        limit: input.forumLimit ?? 4,
        skipPublishDueAnnouncements: true,
        courseIdentities: input.courseIdentities
      })
    ]);

    return {
      preference: {
        emailEnabled: preference.emailEnabled,
        webEnabled: preference.webEnabled
      },
      platformNotifications,
      forumNotifications,
      unreadCount: platformNotifications.unreadCount + forumNotifications.unreadCount
    } satisfies DashboardNotificationSnapshot;
  } catch (error) {
    if (isDatabaseSchemaDriftError(error)) {
      return {
        preference: {
          emailEnabled: true,
          webEnabled: true
        },
        platformNotifications: {
          notifications: [],
          unreadCount: 0
        },
        forumNotifications: {
          notifications: [],
          unreadCount: 0
        },
        unreadCount: 0
      } satisfies DashboardNotificationSnapshot;
    }

    throw error;
  }
}
