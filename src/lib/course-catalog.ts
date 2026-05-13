import { cache } from "react";
import { Prisma } from "@prisma/client";
import type { Course as LegacyCourse, CourseFaq, CourseModule, CourseTeacher } from "../data/courses.ts";
import { courses as legacyCourses } from "../data/courses.ts";
import { isLegacyCatalogFallbackEnabled } from "./env.ts";
import { resolveEditionAccessUntil, isEditionVisible } from "./course-editions.ts";
import { getDb } from "./prisma.ts";

export type CatalogCourseModule = CourseModule & {
  moduleKey?: string;
};

export type CatalogCourseEdition = {
  id: string;
  label: string;
  editionNumber: number;
  status: "ACTIVE" | "SCHEDULED" | "CLOSED" | "CANCELLED";
  startsAt: Date | null;
  endsAt: Date | null;
  graceAccessDays: number;
  accessUntil: Date | null;
  isActive: boolean;
};

export type CatalogCourse = Omit<LegacyCourse, "teacher" | "modules"> & {
  id: string;
  modules: CatalogCourseModule[];
  teachers: CourseTeacher[];
  editions: CatalogCourseEdition[];
  activeEdition: CatalogCourseEdition | null;
  source: "database" | "legacy";
};

function parseArrayField<T>(value: unknown, fallback: T[] = []) {
  if (Array.isArray(value)) {
    return value as T[];
  }

  return fallback;
}

function parseFaqField(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as CourseFaq[];
  }

  return value
    .filter((item): item is CourseFaq => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Record<string, unknown>;
      return typeof candidate.question === "string" && typeof candidate.answer === "string";
    })
    .map((item) => ({
      question: item.question,
      answer: item.answer
    }));
}

function toCatalogTeachers(input: {
  assignments: Array<{
    user: {
      id: string;
      name: string;
      globalRole: "STUDENT" | "TEACHER" | "ADMIN";
    };
  }>;
  legacyCourse?: LegacyCourse | null;
}) {
  if (input.assignments.length) {
    return input.assignments.map(({ user }) => ({
      name: user.name,
      role: user.globalRole === "ADMIN" ? "Administracion" : "Docencia",
      bio:
        user.globalRole === "ADMIN"
          ? "Cuenta con permisos globales de administracion y seguimiento academico."
          : "Docente asignado a este curso dentro del campus."
    }));
  }

  return input.legacyCourse ? [input.legacyCourse.teacher] : [];
}

function pickActiveEdition(editions: CatalogCourseEdition[]) {
  const visible = editions.filter((edition) =>
    isEditionVisible({
      status: edition.status,
      isActive: edition.isActive
    })
  );

  const active = visible.find((edition) => edition.status === "ACTIVE");

  if (active) {
    return active;
  }

  const scheduled = visible.find((edition) => edition.status === "SCHEDULED");
  return scheduled ?? visible[0] ?? null;
}

function toCatalogCourse(
  record: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    description: string;
    priceInCents: number;
    duration: string;
    format: string;
    level: string;
    accentFrom: string;
    accentTo: string;
    category: string;
    audienceJson: unknown;
    outcomesJson: unknown;
    methodologyJson: unknown;
    faqJson: unknown;
    seoTitle: string;
    seoDescription: string;
    modules: Array<{
      id: string;
      moduleKey: string;
      title: string;
      description: string;
      estimatedTime: string;
      resourcesSummary: string;
      position: number;
    }>;
    editions: Array<{
      id: string;
      label: string;
      editionNumber: number;
      status: "ACTIVE" | "SCHEDULED" | "CLOSED" | "CANCELLED";
      startsAt: Date | null;
      endsAt: Date | null;
      graceAccessDays: number;
      accessUntil: Date | null;
      isActive: boolean;
    }>;
    teacherAssignments: Array<{
      user: {
        id: string;
        name: string;
        globalRole: "STUDENT" | "TEACHER" | "ADMIN";
      };
    }>;
  }
): CatalogCourse {
  const legacyCourse = legacyCourses.find((course) => course.slug === record.slug) ?? null;
  const editions = record.editions
    .map((edition) => ({
      id: edition.id,
      label: edition.label,
      editionNumber: edition.editionNumber,
      status: edition.status,
      startsAt: edition.startsAt,
      endsAt: edition.endsAt,
      graceAccessDays: edition.graceAccessDays,
      accessUntil:
        edition.accessUntil ??
        resolveEditionAccessUntil({
          startsAt: edition.startsAt,
          endsAt: edition.endsAt,
          graceAccessDays: edition.graceAccessDays,
          accessUntil: edition.accessUntil
        }),
      isActive: edition.isActive
    }))
    .sort((left, right) => left.editionNumber - right.editionNumber);

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    shortDescription: record.shortDescription,
    description: record.description,
    priceInCents: record.priceInCents,
    duration: record.duration,
    format: record.format,
    level: record.level,
    accentFrom: record.accentFrom,
    accentTo: record.accentTo,
    category: record.category,
    audience: parseArrayField<string>(record.audienceJson),
    outcomes: parseArrayField<string>(record.outcomesJson),
    modules: record.modules
      .sort((left, right) => left.position - right.position)
      .map(
        (module): CatalogCourseModule => ({
          id: module.id,
          moduleKey: module.moduleKey,
          title: module.title,
          description: module.description,
          estimatedTime: module.estimatedTime,
          resourcesSummary: module.resourcesSummary
        })
      ),
    methodology: parseArrayField<string>(record.methodologyJson),
    faq: parseFaqField(record.faqJson),
    teachers: toCatalogTeachers({
      assignments: record.teacherAssignments,
      legacyCourse
    }),
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    editions,
    activeEdition: pickActiveEdition(editions),
    source: "database"
  };
}

function toLegacyCatalogCourse(course: LegacyCourse): CatalogCourse {
  return {
    ...course,
    id: `legacy-${course.slug}`,
    teachers: [course.teacher],
    editions: [],
    activeEdition: null,
    source: "legacy"
  };
}

function toLegacyCourseCreateData(course: LegacyCourse) {
  return {
    slug: course.slug,
    title: course.title,
    shortDescription: course.shortDescription,
    description: course.description,
    priceInCents: course.priceInCents,
    duration: course.duration,
    format: course.format,
    level: course.level,
    accentFrom: course.accentFrom,
    accentTo: course.accentTo,
    category: course.category,
    audienceJson: course.audience,
    outcomesJson: course.outcomes,
    methodologyJson: course.methodology,
    faqJson: course.faq,
    seoTitle: course.seoTitle,
    seoDescription: course.seoDescription,
    status: "ACTIVE" as const
  };
}

function isDatabaseConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("Can't connect to database server")
  );
}

function shouldUseLegacyCatalogFallback(error: unknown) {
  return isLegacyCatalogFallbackEnabled() || isDatabaseConnectionError(error);
}

export async function bootstrapCatalogFromLegacyIfNeeded() {
  const db = getDb();
  const existingCount = await db.course.count();

  if (existingCount > 0) {
    return;
  }

  await db.$transaction(
    legacyCourses.map((course, index) =>
      db.course.create({
        data: {
          ...toLegacyCourseCreateData(course),
          modules: {
            create: course.modules.map((module, moduleIndex) => ({
              moduleKey: module.id,
              title: module.title,
              description: module.description,
              estimatedTime: module.estimatedTime,
              resourcesSummary: module.resourcesSummary,
              position: moduleIndex
            }))
          },
          editions: {
            create: {
              label: "Edicion abierta",
              editionNumber: index + 1,
              status: "ACTIVE",
              isActive: true,
              graceAccessDays: 0
            }
          }
        }
      })
    )
  );
}

async function fetchCatalogCoursesFromDb(includeInactive = false) {
  const records = await getDb().course.findMany({
    where: includeInactive ? {} : { status: "ACTIVE" },
    include: {
      modules: true,
      editions: true,
      teacherAssignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              globalRole: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return records.map((record) => toCatalogCourse(record));
}

export const getCatalogCourses = cache(async (includeInactive = false) => {
  try {
    return await fetchCatalogCoursesFromDb(includeInactive);
  } catch (error) {
    if (!shouldUseLegacyCatalogFallback(error)) {
      throw error;
    }

    return legacyCourses.map((course) => toLegacyCatalogCourse(course));
  }
});

export const getCatalogCourseBySlug = cache(async (slug: string) => {
  try {
    const record = await getDb().course.findUnique({
      where: { slug },
      include: {
        modules: true,
        editions: true,
        teacherAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                globalRole: true
              }
            }
          }
        }
      }
    });

    return record ? toCatalogCourse(record) : null;
  } catch (error) {
    if (!shouldUseLegacyCatalogFallback(error)) {
      throw error;
    }

    const legacyCourse = legacyCourses.find((course) => course.slug === slug);
    return legacyCourse ? toLegacyCatalogCourse(legacyCourse) : null;
  }
});

export async function getFeaturedCatalogCourses() {
  const courses = await getCatalogCourses();
  return courses.slice(0, 3);
}
