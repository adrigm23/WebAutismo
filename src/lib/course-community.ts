import type { CourseRole, UserGlobalRole } from "@prisma/client";
import type { CatalogCourse } from "@/lib/course-catalog";
import { getCatalogCourseBySlug, getCatalogCourses } from "@/lib/course-catalog";
import {
  canViewCourseProgress,
  getGlobalRoleLabel,
  resolveCourseViewerRole
} from "@/lib/course-permissions";
import { getEnrollmentAccessState, isEnrollmentActiveNow } from "@/lib/course-editions";
import { getDb } from "@/lib/prisma";

export type CommunityCategoryDefinition = {
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type UserCourseSpace = {
  course: CatalogCourse;
  role: CourseRole;
  purchase: {
    id: string;
    createdAt: Date;
    totalInCents: number;
    discountInCents: number;
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";
  } | null;
  enrollment: {
    id: string;
    status: "ACTIVE" | "CANCELLED" | "REVOKED" | "EXPIRED";
    accessStartsAt: Date;
    accessUntil: Date | null;
  } | null;
  accessState: "active" | "scheduled" | "expired" | "inactive";
};

export const defaultCourseCategories: CommunityCategoryDefinition[] = [
  {
    slug: "anuncios",
    title: "Anuncios",
    description: "Avisos importantes, recordatorios y mensajes del equipo docente.",
    sortOrder: 1
  },
  {
    slug: "dudas",
    title: "Dudas",
    description: "Preguntas del alumnado y resolucion compartida de incidencias del contenido.",
    sortOrder: 2
  },
  {
    slug: "tareas",
    title: "Tareas",
    description: "Aclaraciones sobre ejercicios, actividades y seguimiento del trabajo del curso.",
    sortOrder: 3
  },
  {
    slug: "general",
    title: "General",
    description: "Conversacion abierta sobre el curso, reflexiones y debate del grupo.",
    sortOrder: 4
  },
  {
    slug: "material-adicional",
    title: "Material adicional",
    description: "Recursos extra, enlaces recomendados y materiales complementarios.",
    sortOrder: 5
  }
];

async function getNextForumEditionNumber(courseSlug: string) {
  const latestSpace = await getDb().forumSpace.findFirst({
    where: {
      courseSlug
    },
    orderBy: {
      editionNumber: "desc"
    }
  });

  return (latestSpace?.editionNumber ?? 0) + 1;
}

export async function createDefaultForumCategoriesForSpace(input: {
  courseSlug: string;
  forumSpaceId: string;
}) {
  const db = getDb();

  await Promise.all(
    defaultCourseCategories.map((category) =>
      db.forumCategory.create({
        data: {
          courseSlug: input.courseSlug,
          forumSpaceId: input.forumSpaceId,
          slug: category.slug,
          title: category.title,
          description: category.description,
          sortOrder: category.sortOrder
        }
      })
    )
  );
}

export async function ensureActiveForumSpace(courseSlug: string) {
  const db = getDb();
  const current = await db.forumSpace.findFirst({
    where: {
      courseSlug,
      status: "ACTIVE"
    },
    orderBy: {
      editionNumber: "desc"
    }
  });

  if (current) {
    return current;
  }

  const editionNumber = await getNextForumEditionNumber(courseSlug);

  return db.forumSpace.create({
    data: {
      courseSlug,
      editionNumber,
      editionLabel: `Edicion ${editionNumber}`,
      status: "ACTIVE"
    }
  });
}

export async function getArchivedForumSpaces(courseSlug: string) {
  return getDb().forumSpace.findMany({
    where: {
      courseSlug,
      status: "ARCHIVED"
    },
    orderBy: {
      editionNumber: "desc"
    }
  });
}

export async function getDeletedForumSpaces(courseSlug: string) {
  return getDb().forumSpace.findMany({
    where: {
      courseSlug,
      status: "DELETED"
    },
    orderBy: {
      editionNumber: "desc"
    }
  });
}

async function getAccessSnapshot(input: { userId: string; courseSlug: string }) {
  const [user, course] = await Promise.all([
    getDb().user.findUnique({
      where: {
        id: input.userId
      },
      select: {
        id: true,
        globalRole: true,
        isActive: true
      }
    }),
    getCatalogCourseBySlug(input.courseSlug)
  ]);

  if (!user || !course) {
    return null;
  }

  const [courseAssignment, editionAssignments, enrollments, latestPurchase] = await Promise.all([
    getDb().courseTeacherAssignment.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: input.userId
        }
      },
      select: {
        id: true
      }
    }),
    getDb().courseEditionTeacherAssignment.findMany({
      where: {
        userId: input.userId,
        courseEdition: {
          courseId: course.id
        }
      },
      select: {
        id: true
      }
    }),
    getDb().courseEnrollment.findMany({
      where: {
        userId: input.userId,
        courseId: course.id
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        status: true,
        accessStartsAt: true,
        accessUntil: true
      }
    }),
    getDb().purchase.findFirst({
      where: {
        userId: input.userId,
        courseId: course.id
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        createdAt: true,
        totalInCents: true,
        discountInCents: true,
        status: true
      }
    })
  ]);

  const activeEnrollment =
    enrollments.find((enrollment) =>
      isEnrollmentActiveNow({
        status: enrollment.status,
        accessStartsAt: enrollment.accessStartsAt,
        accessUntil: enrollment.accessUntil
      })
    ) ?? null;
  const latestEnrollment = enrollments[0] ?? null;
  const viewerRole = resolveCourseViewerRole({
    globalRole: user.globalRole,
    isActive: user.isActive,
    hasCourseAssignment: Boolean(courseAssignment),
    hasEditionAssignment: editionAssignments.length > 0,
    hasActiveEnrollment: Boolean(activeEnrollment)
  });

  return {
    user,
    course,
    viewerRole,
    latestPurchase,
    latestEnrollment,
    activeEnrollment
  };
}

export async function ensureCourseMembershipForUser(input: {
  userId: string;
  email?: string;
  courseSlug: string;
}) {
  const snapshot = await getAccessSnapshot({
    userId: input.userId,
    courseSlug: input.courseSlug
  });

  if (!snapshot?.viewerRole) {
    await getDb().courseMembership.deleteMany({
      where: {
        userId: input.userId,
        courseSlug: input.courseSlug
      }
    });

    return null;
  }

  return getDb().courseMembership.upsert({
    where: {
      userId_courseSlug: {
        userId: input.userId,
        courseSlug: input.courseSlug
      }
    },
    update: {
      role: snapshot.viewerRole
    },
    create: {
      userId: input.userId,
      courseSlug: input.courseSlug,
      role: snapshot.viewerRole
    }
  });
}

export async function ensureCourseCommunity(courseSlug: string) {
  const db = getDb();
  const activeSpace = await ensureActiveForumSpace(courseSlug);

  await db.forumCategory.updateMany({
    where: {
      courseSlug,
      forumSpaceId: null
    },
    data: {
      forumSpaceId: activeSpace.id
    }
  });

  const existingCategoryCount = await db.forumCategory.count({
    where: {
      forumSpaceId: activeSpace.id
    }
  });

  if (existingCategoryCount === 0) {
    await createDefaultForumCategoriesForSpace({
      courseSlug,
      forumSpaceId: activeSpace.id
    });
  }

  return activeSpace;
}

export async function getCourseRoleForUser(input: {
  userId: string;
  email?: string;
  courseSlug: string;
}) {
  const snapshot = await getAccessSnapshot({
    userId: input.userId,
    courseSlug: input.courseSlug
  });

  if (!snapshot?.viewerRole) {
    await ensureCourseMembershipForUser(input);
    return null;
  }

  await ensureCourseMembershipForUser(input);
  return snapshot.viewerRole;
}

export async function canAccessCourseCommunity(input: {
  userId: string;
  email?: string;
  courseSlug: string;
}) {
  const snapshot = await getAccessSnapshot({
    userId: input.userId,
    courseSlug: input.courseSlug
  });

  if (!snapshot?.viewerRole) {
    return { allowed: false as const, role: null, enrollment: null };
  }

  await ensureCourseMembershipForUser(input);

  return {
    allowed: true as const,
    role: snapshot.viewerRole,
    enrollment: snapshot.latestEnrollment
      ? {
          ...snapshot.latestEnrollment,
          accessState: getEnrollmentAccessState({
            status: snapshot.latestEnrollment.status,
            accessStartsAt: snapshot.latestEnrollment.accessStartsAt,
            accessUntil: snapshot.latestEnrollment.accessUntil
          })
        }
      : null
  };
}

export async function getUserCourseSpaces(input: { userId: string; email?: string }) {
  const [user, courses] = await Promise.all([
    getDb().user.findUnique({
      where: {
        id: input.userId
      },
      select: {
        globalRole: true,
        isActive: true
      }
    }),
    getCatalogCourses(true)
  ]);

  if (!user) {
    return [] as UserCourseSpace[];
  }

  const db = getDb();
  const [courseAssignments, editionAssignments, enrollments, purchases] = await Promise.all([
    db.courseTeacherAssignment.findMany({
      where: {
        userId: input.userId
      },
      select: {
        courseId: true
      }
    }),
    db.courseEditionTeacherAssignment.findMany({
      where: {
        userId: input.userId
      },
      select: {
        courseEdition: {
          select: {
            courseId: true
          }
        }
      }
    }),
    db.courseEnrollment.findMany({
      where: {
        userId: input.userId
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        courseId: true,
        status: true,
        accessStartsAt: true,
        accessUntil: true
      }
    }),
    db.purchase.findMany({
      where: {
        userId: input.userId
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        courseId: true,
        createdAt: true,
        totalInCents: true,
        discountInCents: true,
        status: true
      }
    })
  ]);

  const courseAssignmentIds = new Set(courseAssignments.map((assignment) => assignment.courseId));
  const editionCourseIds = new Set(
    editionAssignments.map((assignment) => assignment.courseEdition.courseId)
  );
  const enrollmentsByCourse = new Map<string, typeof enrollments>();

  for (const enrollment of enrollments) {
    const bucket = enrollmentsByCourse.get(enrollment.courseId) ?? [];
    bucket.push(enrollment);
    enrollmentsByCourse.set(enrollment.courseId, bucket);
  }

  const purchasesByCourse = new Map<string, (typeof purchases)[number]>();

  for (const purchase of purchases) {
    if (!purchasesByCourse.has(purchase.courseId)) {
      purchasesByCourse.set(purchase.courseId, purchase);
    }
  }

  const spaces = courses.flatMap((course) => {
    const courseEnrollments = enrollmentsByCourse.get(course.id) ?? [];
    const activeEnrollment =
      courseEnrollments.find((enrollment) =>
        isEnrollmentActiveNow({
          status: enrollment.status,
          accessStartsAt: enrollment.accessStartsAt,
          accessUntil: enrollment.accessUntil
        })
      ) ?? null;
    const latestEnrollment = courseEnrollments[0] ?? null;
    const role = resolveCourseViewerRole({
      globalRole: user.globalRole,
      isActive: user.isActive,
      hasCourseAssignment: courseAssignmentIds.has(course.id),
      hasEditionAssignment: editionCourseIds.has(course.id),
      hasActiveEnrollment: Boolean(activeEnrollment)
    });

    if (!role) {
      return [];
    }

    return [
      {
        course,
        role,
        purchase: purchasesByCourse.get(course.id) ?? null,
        enrollment: latestEnrollment
          ? {
              id: latestEnrollment.id,
              status: latestEnrollment.status,
              accessStartsAt: latestEnrollment.accessStartsAt,
              accessUntil: latestEnrollment.accessUntil
            }
          : null,
        accessState: latestEnrollment
          ? getEnrollmentAccessState({
              status: latestEnrollment.status,
              accessStartsAt: latestEnrollment.accessStartsAt,
              accessUntil: latestEnrollment.accessUntil
            })
          : role === "STUDENT"
            ? "inactive"
            : "active"
      } satisfies UserCourseSpace
    ];
  });

  await Promise.all(
    spaces.map((space) =>
      ensureCourseMembershipForUser({
        userId: input.userId,
        courseSlug: space.course.slug
      })
    )
  );

  return spaces;
}

export function getRoleLabel(role: CourseRole | UserGlobalRole) {
  if (role === "ADMIN" || role === "TEACHER" || role === "STUDENT") {
    return getGlobalRoleLabel(role);
  }

  return "Alumno";
}

export function canModerateCourse(role: CourseRole) {
  return canViewCourseProgress({
    globalRole: role === "ADMIN" ? "ADMIN" : "TEACHER",
    viewerRole: role
  });
}

export function getCampusResources(course: CatalogCourse) {
  const teacherSummary = course.teachers.length
    ? course.teachers.map((teacher) => `${teacher.name}. ${teacher.role}. ${teacher.bio}`).join(" ")
    : "El equipo docente se asigna desde administracion por curso y edicion.";

  return [
    {
      id: "guia",
      title: "Guia del alumno",
      description:
        "Normas del campus, funcionamiento del curso, participacion en foros y uso del area privada."
    },
    {
      id: "docentes",
      title: course.teachers.length > 1 ? "Equipo docente" : "Docente asignado",
      description: teacherSummary
    }
  ];
}
