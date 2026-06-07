import type { CatalogCourseModule } from "./course-catalog.ts";
import { buildLegacyCourseInWhere, buildLegacyCourseWhere } from "./course-identity.ts";
import { isDatabaseConnectionError, isDatabaseSchemaDriftError } from "./db-errors.ts";
import { getDemoUserById, isDemoUserId } from "./demo-auth.ts";
import { getCatalogCourseBySlug } from "./course-catalog.ts";
import { getDb } from "./prisma.ts";

type CourseProgressCourseShape = {
  id?: string;
  slug: string;
  modules: CatalogCourseModule[];
};

type PersistedModuleProgressRecord = {
  id?: string;
  courseId?: string | null;
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

export type CourseLearnerProgressRow = {
  userId: string;
  learnerName: string;
  learnerEmail: string;
  completedModules: number;
  totalModules: number;
  completionRate: number;
  lastCompletedAt: Date | null;
};

type CourseLearnerProgressEnrollment = {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type CourseLearnerProgressSummary = {
  learnerIds: string[];
  learnerCount: number;
  averageCompletionRate: number;
};

function buildProgressCourseWhere(course: CourseProgressCourseShape) {
  return buildLegacyCourseWhere(
    course.id
      ? {
          id: course.id,
          slug: course.slug
        }
      : {
          slug: course.slug
        }
  );
}

function buildCourseSlugInWhere(courses: CourseProgressCourseShape[]) {
  return {
    courseSlug: {
      in: Array.from(new Set(courses.map((course) => course.slug).filter(Boolean)))
    }
  };
}

function getDemoProgressRecords(input: {
  userId: string;
  course: CourseProgressCourseShape;
}): PersistedModuleProgressRecord[] {
  const demoUser = getDemoUserById(input.userId);

  if (!demoUser || demoUser.globalRole !== "STUDENT") {
    return [];
  }

  // FIX #7: usar aritmética real de fechas — la interpolación de string generaba fechas inválidas (ej. "2026-05-010")
  const baseDate = new Date("2026-05-05T09:00:00.000Z");
  return input.course.modules.slice(0, Math.min(2, input.course.modules.length)).map((module, index) => {
    const completedAt = new Date(baseDate);
    completedAt.setDate(baseDate.getDate() + index);
    return { moduleId: module.id, moduleIndex: index, completedAt };
  });
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
    const directMatch = course.modules.find((module) => module.id === progress.moduleId);

    if (directMatch) {
      return directMatch.id;
    }

    const legacyKeyMatch = course.modules.find((module) => module.moduleKey === progress.moduleId);

    if (legacyKeyMatch) {
      return legacyKeyMatch.id;
    }
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

  try {
    const db = getDb();
    const uniqueCourses = new Map(input.courses.map((course) => [course.slug, course]));

    const legacyRecords = await db.courseModuleProgress.findMany({
      where: {
        userId: input.userId,
        ...buildLegacyCourseInWhere(
          Array.from(uniqueCourses.values()).map((course) =>
            course.id
              ? {
                  id: course.id,
                  slug: course.slug
                }
              : {
                  slug: course.slug
                }
          )
        ),
        moduleId: ""
      },
      select: {
        id: true,
        courseId: true,
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
          ...(course.id
            ? {
                OR: [
                  {
                    courseId: course.id
                  },
                  {
                    courseSlug: record.courseSlug
                  }
                ]
              }
            : {
                courseSlug: record.courseSlug
              }),
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
          courseId: course.id ?? null,
          moduleId: courseModule.id
        }
      });
    }
  } catch (error) {
    if (isDatabaseSchemaDriftError(error)) {
      return;
    }

    throw error;
  }
}

export async function getCourseProgressDetailsForUser(input: {
  userId: string;
  course: CourseProgressCourseShape;
}) {
  const detailsByCourse = await getCourseProgressDetailsMapForUser({
    userId: input.userId,
    courses: [input.course]
  });

  return detailsByCourse.get(input.course.slug) ?? normalizeCourseProgress(input.course, []);
}

export async function getCourseProgressDetailsMapForUser(input: {
  userId: string;
  courses: CourseProgressCourseShape[];
}) {
  const uniqueCourses = Array.from(
    new Map(input.courses.map((course) => [course.slug, course] as const)).values()
  );

  if (uniqueCourses.length === 0) {
    return new Map<string, CourseProgressDetails>();
  }

  if (isDemoUserId(input.userId)) {
    return new Map(
      uniqueCourses.map((course) => [
        course.slug,
        normalizeCourseProgress(course, getDemoProgressRecords({ userId: input.userId, course }))
      ])
    );
  }

  await upgradeLegacyCourseProgressRecords({
    userId: input.userId,
    courses: uniqueCourses
  });

  const progress = await (async () => {
    try {
      return await getDb().courseModuleProgress.findMany({
        where: {
          userId: input.userId,
          ...buildLegacyCourseInWhere(
            uniqueCourses.map((course) =>
              course.id
                ? {
                    id: course.id,
                    slug: course.slug
                  }
                : {
                    slug: course.slug
                  }
            )
          )
        },
        select: {
          courseId: true,
          courseSlug: true,
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
    } catch (error) {
      if (!isDatabaseSchemaDriftError(error)) {
        throw error;
      }

      return getDb().courseModuleProgress.findMany({
        where: {
          userId: input.userId,
          ...buildCourseSlugInWhere(uniqueCourses)
        },
        select: {
          courseSlug: true,
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
    }
  })();

  const progressByCourseSlug = new Map<string, PersistedModuleProgressRecord[]>();

  for (const record of progress) {
    const bucket = progressByCourseSlug.get(record.courseSlug) ?? [];
    bucket.push(record);
    progressByCourseSlug.set(record.courseSlug, bucket);
  }

  return new Map(
    uniqueCourses.map((course) => [
      course.slug,
      normalizeCourseProgress(course, progressByCourseSlug.get(course.slug) ?? [])
    ])
  );
}

export async function getCourseProgressSummariesForUser(input: {
  userId: string;
  courseSlugs: string[];
}) {
  const uniqueCourseSlugs = Array.from(new Set(input.courseSlugs)).filter(Boolean);

  if (uniqueCourseSlugs.length === 0) {
    return new Map<string, CourseProgressSummary>();
  }

  const courseList = (
    await Promise.all(uniqueCourseSlugs.map((courseSlug) => getCatalogCourseBySlug(courseSlug)))
  ).filter((course): course is NonNullable<typeof course> => Boolean(course));

  const detailsByCourse = await getCourseProgressDetailsMapForUser({
    userId: input.userId,
    courses: courseList
  });

  const entries: Array<readonly [string, CourseProgressSummary]> = [];

  for (const course of courseList) {
    const summary = detailsByCourse.get(course.slug) ?? normalizeCourseProgress(course, []);
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

  try {
    const existing = await db.courseModuleProgress.findFirst({
      where: {
        userId: input.userId,
        ...buildProgressCourseWhere(input.course),
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
          ...buildProgressCourseWhere(input.course),
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
          courseId: input.course.id ?? null,
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
        courseId: input.course.id ?? null,
        courseSlug: input.course.slug,
        moduleId: courseModule.id,
        moduleIndex,
        completedAt: new Date()
      }
    });
  } catch (error) {
    if (!isDatabaseSchemaDriftError(error)) {
      throw error;
    }

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
}

export async function getLearnerProgressRowsForCourse(courseSlug: string): Promise<CourseLearnerProgressRow[]> {
  const course = await getCatalogCourseBySlug(courseSlug);

  if (!course) {
    return [];
  }

  return getLearnerProgressRowsForCatalogCourse(course);
}

export async function getLearnerProgressRowsForCatalogCourse(
  course: CourseProgressCourseShape,
  input?: {
    enrollments?: CourseLearnerProgressEnrollment[];
  }
): Promise<CourseLearnerProgressRow[]> {
  const courseSlug = course.slug;

  try {
    const enrollmentsPromise = input?.enrollments
      ? Promise.resolve(input.enrollments)
      : getDb().courseEnrollment.findMany({
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
        });

    const progressRecordsPromise = (async () => {
      try {
        return await getDb().courseModuleProgress.findMany({
          where: {
            ...buildProgressCourseWhere(course)
          },
          select: {
            courseId: true,
            userId: true,
            moduleId: true,
            moduleIndex: true,
            completedAt: true
          }
        });
      } catch (error) {
        if (!isDatabaseSchemaDriftError(error)) {
          throw error;
        }

        return getDb().courseModuleProgress.findMany({
          where: {
            courseSlug
          },
          select: {
            userId: true,
            moduleId: true,
            moduleIndex: true,
            completedAt: true
          }
        });
      }
    })();

    const [enrollments, progressRecords] = await Promise.all([
      enrollmentsPromise,
      progressRecordsPromise
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
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw error;
    }

    throw error;
  }
}

export async function getLearnerProgressSummaryForCatalogCourse(
  course: CourseProgressCourseShape
): Promise<CourseLearnerProgressSummary> {
  const summaries = await getLearnerProgressSummariesForCatalogCourses([course]);

  return (
    summaries.get(course.slug) ?? {
      learnerIds: [],
      learnerCount: 0,
      averageCompletionRate: 0
    }
  );
}

export async function getLearnerProgressSummariesForCatalogCourses(
  courses: CourseProgressCourseShape[]
): Promise<Map<string, CourseLearnerProgressSummary>> {
  const uniqueCourses = Array.from(
    new Map(courses.map((course) => [course.slug, course] as const)).values()
  );

  if (uniqueCourses.length === 0) {
    return new Map<string, CourseLearnerProgressSummary>();
  }

  try {
    const enrollmentsPromise = getDb().courseEnrollment.findMany({
      where: {
        course: {
          slug: {
            in: uniqueCourses.map((currentCourse) => currentCourse.slug)
          }
        }
      },
      select: {
        course: {
          select: {
            slug: true
          }
        },
        userId: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const progressRecordsPromise = (async () => {
      try {
        return await getDb().courseModuleProgress.findMany({
          where: {
            ...buildLegacyCourseInWhere(
              uniqueCourses.map((currentCourse) =>
                currentCourse.id
                  ? {
                      id: currentCourse.id,
                      slug: currentCourse.slug
                    }
                  : {
                      slug: currentCourse.slug
                    }
              )
            )
          },
          select: {
            courseId: true,
            courseSlug: true,
            userId: true,
            moduleId: true,
            moduleIndex: true,
            completedAt: true
          }
        });
      } catch (error) {
        if (!isDatabaseSchemaDriftError(error)) {
          throw error;
        }

        return getDb().courseModuleProgress.findMany({
          where: {
            ...buildCourseSlugInWhere(uniqueCourses)
          },
          select: {
            courseSlug: true,
            userId: true,
            moduleId: true,
            moduleIndex: true,
            completedAt: true
          }
        });
      }
    })();

    const [enrollments, progressRecords] = await Promise.all([
      enrollmentsPromise,
      progressRecordsPromise
    ]);

    const learnerIdsByCourseSlug = new Map<string, Set<string>>();
    const progressByCourseSlug = new Map<string, Map<string, PersistedModuleProgressRecord[]>>();

    for (const enrollment of enrollments) {
      const bucket = learnerIdsByCourseSlug.get(enrollment.course.slug) ?? new Set<string>();
      bucket.add(enrollment.userId);
      learnerIdsByCourseSlug.set(enrollment.course.slug, bucket);
    }

    for (const record of progressRecords) {
      const courseBucket = progressByCourseSlug.get(record.courseSlug) ?? new Map();
      const userBucket = courseBucket.get(record.userId) ?? [];
      userBucket.push(record);
      courseBucket.set(record.userId, userBucket);
      progressByCourseSlug.set(record.courseSlug, courseBucket);
    }

    return new Map(
      uniqueCourses.map((course) => {
        const learnerIds = Array.from(learnerIdsByCourseSlug.get(course.slug) ?? []);
        const progressByUser = progressByCourseSlug.get(course.slug) ?? new Map();
        const averageCompletionRate =
          learnerIds.length > 0
            ? Math.round(
                learnerIds.reduce((total, userId) => {
                  const summary = normalizeCourseProgress(course, progressByUser.get(userId) ?? []);
                  return total + summary.completionRate;
                }, 0) / learnerIds.length
              )
            : 0;

        return [
          course.slug,
          {
            learnerIds,
            learnerCount: learnerIds.length,
            averageCompletionRate
          } satisfies CourseLearnerProgressSummary
        ];
      })
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw error;
    }

    throw error;
  }
}
