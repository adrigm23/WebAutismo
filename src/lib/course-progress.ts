import type { CourseModule } from "../data/courses.ts";
import { getDemoUserById, isDemoUserId } from "./demo-auth.ts";
import { getCatalogCourseBySlug } from "./course-catalog.ts";
import { getDb } from "./prisma.ts";

type CourseProgressCourseShape = {
  slug: string;
  modules: CourseModule[];
};

type PersistedModuleProgressRecord = {
  id?: string;
  courseSlug?: string;
  moduleId: string;
  moduleIndex: number | null;
  completedAt: Date;
};

export type CourseModuleProgressState = {
  id: string;
  index: number;
  title: string;
  description: string;
  estimatedTime: string;
  resourcesSummary: string;
  isCompleted: boolean;
  completedAt: Date | null;
};

export type CourseProgressSummary = {
  courseSlug: string;
  totalModules: number;
  completedModules: number;
  pendingModules: number;
  completionRate: number;
  hasStarted: boolean;
  isCompleted: boolean;
  lastCompletedAt: Date | null;
};

export type CourseProgressDetails = CourseProgressSummary & {
  modules: CourseModuleProgressState[];
};

type CourseLearnerProgressRow = {
  userId: string;
  learnerName: string;
  learnerEmail: string;
  completedModules: number;
  totalModules: number;
  completionRate: number;
  lastCompletedAt: Date | null;
};

function getDemoProgressRecords(input: {
  userId: string;
  course: CourseProgressCourseShape;
}): PersistedModuleProgressRecord[] {
  const demoUser = getDemoUserById(input.userId);

  if (!demoUser || demoUser.globalRole !== "STUDENT") {
    return [];
  }

  return input.course.modules.slice(0, Math.min(2, input.course.modules.length)).map((module, index) => ({
    moduleId: module.id,
    moduleIndex: index,
    completedAt: new Date(`2026-05-0${index + 5}T09:00:00.000Z`)
  }));
}

function getModuleFromLegacyIndex(course: CourseProgressCourseShape, moduleIndex: number | null) {
  if (moduleIndex === null || moduleIndex < 0 || moduleIndex >= course.modules.length) {
    return null;
  }

  return course.modules[moduleIndex] ?? null;
}

export function resolveCourseModuleId(
  course: CourseProgressCourseShape,
  progress: Pick<PersistedModuleProgressRecord, "moduleId" | "moduleIndex">
) {
  if (progress.moduleId) {
    return progress.moduleId;
  }

  return getModuleFromLegacyIndex(course, progress.moduleIndex)?.id ?? null;
}

export function normalizeCourseProgress(
  course: CourseProgressCourseShape,
  progress: Array<Pick<PersistedModuleProgressRecord, "moduleId" | "moduleIndex" | "completedAt">>
) {
  const completedById = new Map<string, Date>();

  for (const record of progress) {
    const resolvedModuleId = resolveCourseModuleId(course, record);

    if (!resolvedModuleId) {
      continue;
    }

    const knownModule = course.modules.find((module) => module.id === resolvedModuleId);

    if (!knownModule) {
      continue;
    }

    const previousCompletedAt = completedById.get(resolvedModuleId);

    if (!previousCompletedAt || previousCompletedAt.getTime() < record.completedAt.getTime()) {
      completedById.set(resolvedModuleId, record.completedAt);
    }
  }

  const completedModules = completedById.size;
  const totalModules = course.modules.length;
  const pendingModules = Math.max(totalModules - completedModules, 0);
  const completionRate =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const lastCompletedAt =
    completedById.size > 0
      ? Array.from(completedById.values()).sort((left, right) => right.getTime() - left.getTime())[0]
      : null;

  return {
    courseSlug: course.slug,
    totalModules,
    completedModules,
    pendingModules,
    completionRate,
    hasStarted: completedModules > 0,
    isCompleted: totalModules > 0 && completedModules === totalModules,
    lastCompletedAt,
    modules: course.modules.map((module, index) => ({
      id: module.id,
      index,
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTime,
      resourcesSummary: module.resourcesSummary,
      isCompleted: completedById.has(module.id),
      completedAt: completedById.get(module.id) ?? null
    }))
  } satisfies CourseProgressDetails;
}

async function upgradeLegacyCourseProgressRecords(input: {
  userId: string;
  courses: CourseProgressCourseShape[];
}) {
  if (input.courses.length === 0) {
    return;
  }

  const db = getDb();
  const uniqueCourses = new Map(input.courses.map((course) => [course.slug, course]));

  const legacyRecords = await db.courseModuleProgress.findMany({
    where: {
      userId: input.userId,
      courseSlug: {
        in: Array.from(uniqueCourses.keys())
      },
      moduleId: ""
    },
    select: {
      id: true,
      courseSlug: true,
      moduleIndex: true,
      completedAt: true
    }
  });

  for (const record of legacyRecords) {
    const course = uniqueCourses.get(record.courseSlug);

    if (!course) {
      continue;
    }

    const courseModule = getModuleFromLegacyIndex(course, record.moduleIndex);

    if (!courseModule) {
      continue;
    }

    const existing = await db.courseModuleProgress.findFirst({
      where: {
        userId: input.userId,
        courseSlug: record.courseSlug,
        moduleId: courseModule.id
      },
      select: {
        id: true
      }
    });

    if (existing) {
      await db.courseModuleProgress.delete({
        where: {
          id: record.id
        }
      });
      continue;
    }

    await db.courseModuleProgress.update({
      where: {
        id: record.id
      },
      data: {
        moduleId: courseModule.id
      }
    });
  }
}

export async function getCourseProgressDetailsForUser(input: {
  userId: string;
  course: CourseProgressCourseShape;
}) {
  if (isDemoUserId(input.userId)) {
    return normalizeCourseProgress(input.course, getDemoProgressRecords(input));
  }

  await upgradeLegacyCourseProgressRecords({
    userId: input.userId,
    courses: [input.course]
  });

  const progress = await getDb().courseModuleProgress.findMany({
    where: {
      userId: input.userId,
      courseSlug: input.course.slug
    },
    select: {
      moduleId: true,
      moduleIndex: true,
      completedAt: true
    },
    orderBy: [
      {
        moduleIndex: "asc"
      },
      {
        completedAt: "desc"
      }
    ]
  });

  return normalizeCourseProgress(input.course, progress);
}

export async function getCourseProgressSummariesForUser(input: {
  userId: string;
  courseSlugs: string[];
}) {
  if (isDemoUserId(input.userId)) {
    const uniqueCourseSlugs = Array.from(new Set(input.courseSlugs)).filter(Boolean);
    const courseList = (
      await Promise.all(uniqueCourseSlugs.map((courseSlug) => getCatalogCourseBySlug(courseSlug)))
    ).filter((course): course is NonNullable<typeof course> => Boolean(course));

    return new Map(
      courseList.map((course) => [
        course.slug,
        normalizeCourseProgress(course, getDemoProgressRecords({ userId: input.userId, course }))
      ])
    );
  }

  const uniqueCourseSlugs = Array.from(new Set(input.courseSlugs)).filter(Boolean);

  if (uniqueCourseSlugs.length === 0) {
    return new Map<string, CourseProgressSummary>();
  }

  const courseList = (
    await Promise.all(uniqueCourseSlugs.map((courseSlug) => getCatalogCourseBySlug(courseSlug)))
  ).filter((course): course is NonNullable<typeof course> => Boolean(course));

  await upgradeLegacyCourseProgressRecords({
    userId: input.userId,
    courses: courseList
  });

  const records = await getDb().courseModuleProgress.findMany({
    where: {
      userId: input.userId,
      courseSlug: {
        in: uniqueCourseSlugs
      }
    },
    select: {
      courseSlug: true,
      moduleId: true,
      moduleIndex: true,
      completedAt: true
    }
  });

  const grouped = new Map<string, PersistedModuleProgressRecord[]>();

  for (const record of records) {
    const bucket = grouped.get(record.courseSlug) ?? [];
    bucket.push(record);
    grouped.set(record.courseSlug, bucket);
  }

  const entries: Array<readonly [string, CourseProgressSummary]> = [];

  for (const course of courseList) {
    const summary = normalizeCourseProgress(course, grouped.get(course.slug) ?? []);
    entries.push([course.slug, summary] as const);
  }

  return new Map(entries);
}

export async function setCourseModuleProgress(input: {
  userId: string;
  course: CourseProgressCourseShape;
  moduleId: string;
  isCompleted: boolean;
}) {
  const moduleIndex = input.course.modules.findIndex((module) => module.id === input.moduleId);

  if (moduleIndex < 0) {
    throw new Error("El modulo indicado no existe en este curso.");
  }

  const db = getDb();
  const courseModule = input.course.modules[moduleIndex];
  const existing = await db.courseModuleProgress.findFirst({
    where: {
      userId: input.userId,
      courseSlug: input.course.slug,
      OR: [
        {
          moduleId: courseModule.id
        },
        {
          moduleId: "",
          moduleIndex
        }
      ]
    },
    select: {
      id: true
    }
  });

  if (!input.isCompleted) {
    await db.courseModuleProgress.deleteMany({
      where: {
        userId: input.userId,
        courseSlug: input.course.slug,
        OR: [
          {
            moduleId: courseModule.id
          },
          {
            moduleId: "",
            moduleIndex
          }
        ]
      }
    });

    return;
  }

  if (existing) {
    await db.courseModuleProgress.update({
      where: {
        id: existing.id
      },
      data: {
        moduleId: courseModule.id,
        moduleIndex,
        completedAt: new Date()
      }
    });

    return;
  }

  await db.courseModuleProgress.create({
    data: {
      userId: input.userId,
      courseSlug: input.course.slug,
      moduleId: courseModule.id,
      moduleIndex,
      completedAt: new Date()
    }
  });
}

export async function getLearnerProgressRowsForCourse(courseSlug: string): Promise<CourseLearnerProgressRow[]> {
  const course = await getCatalogCourseBySlug(courseSlug);

  if (!course) {
    return [];
  }

  const [enrollments, progressRecords] = await Promise.all([
    getDb().courseEnrollment.findMany({
      where: {
        course: {
          slug: courseSlug
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    getDb().courseModuleProgress.findMany({
      where: {
        courseSlug
      },
      select: {
        userId: true,
        moduleId: true,
        moduleIndex: true,
        completedAt: true
      }
    })
  ]);

  const latestEnrollmentByUser = new Map<string, (typeof enrollments)[number]>();

  for (const enrollment of enrollments) {
    if (!latestEnrollmentByUser.has(enrollment.userId)) {
      latestEnrollmentByUser.set(enrollment.userId, enrollment);
    }
  }

  const progressByUser = new Map<string, PersistedModuleProgressRecord[]>();

  for (const record of progressRecords) {
    const bucket = progressByUser.get(record.userId) ?? [];
    bucket.push(record);
    progressByUser.set(record.userId, bucket);
  }

  return Array.from(latestEnrollmentByUser.values()).map((enrollment) => {
    const summary = normalizeCourseProgress(course, progressByUser.get(enrollment.userId) ?? []);

    return {
      userId: enrollment.user.id,
      learnerName: enrollment.user.name,
      learnerEmail: enrollment.user.email,
      completedModules: summary.completedModules,
      totalModules: summary.totalModules,
      completionRate: summary.completionRate,
      lastCompletedAt: summary.lastCompletedAt
    };
  });
}
