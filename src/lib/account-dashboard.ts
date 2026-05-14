import type { CourseResourceSubmissionStatus } from "@prisma/client";
import type { ForumNotificationListItem } from "@/lib/forum";
import type { UserCourseSpace } from "@/lib/course-community";
import type { CourseLearnerProgressSummary } from "@/lib/course-progress";
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
      title: string;
      body: string;
      linkPath: string;
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
  const resources = await db.courseResource.findMany({
    where: {
      courseId: {
        in: courseIds
      }
    },
    select: {
      id: true,
      courseId: true,
      title: true,
      type: true,
      submissions: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          student: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          submittedAt: "desc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

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

      for (const submission of resource.submissions) {
        totalSubmissionCount += 1;

        if (submission.status === "REVIEWED") {
          reviewedSubmissionCount += 1;
        }

        if (submission.status === "SUBMITTED") {
          pendingReviewItems.push({
            id: submission.id,
            href: `/mis-cursos/${space.course.slug}/seguimiento`,
            courseTitle: space.course.title,
            resourceTitle: resource.title,
            learnerName: submission.student.name,
            submittedAt: submission.submittedAt,
            statusLabel: getSubmissionStatusLabel(submission.status)
          });
        }

        recentSubmissionActivity.push({
          id: `submission-${submission.id}`,
          href: `/mis-cursos/${space.course.slug}/seguimiento`,
          title:
            submission.status === "REVIEWED"
              ? `Entrega revisada en ${space.course.title}`
              : `Nueva entrega en ${space.course.title}`,
          body:
            submission.status === "REVIEWED"
              ? `${submission.student.name} ya tiene revision en "${resource.title}".`
              : `${submission.student.name} ha enviado "${resource.title}".`,
          createdAt: submission.reviewedAt ?? submission.submittedAt,
          tone: submission.status === "REVIEWED" ? "teacher" : "student",
          sourceLabel: submission.status === "REVIEWED" ? "Revision" : "Entrega"
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

export async function getDashboardNotificationSnapshot(input: {
  userId: string;
  courseSlugs: string[];
  platformLimit?: number;
  forumLimit?: number;
}) {
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
      skipPublishDueAnnouncements: true
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
}
