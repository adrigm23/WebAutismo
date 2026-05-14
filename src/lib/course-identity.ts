import { cache } from "react";
import { getDb } from "@/lib/prisma";

export type CourseIdentity = {
  id: string;
  slug: string;
};

export const getCourseIdentityBySlug = cache(async (courseSlug: string) => {
  return getDb().course.findUnique({
    where: {
      slug: courseSlug
    },
    select: {
      id: true,
      slug: true
    }
  });
});

export async function getCourseIdentitiesBySlugs(courseSlugs: string[]) {
  const uniqueCourseSlugs = Array.from(new Set(courseSlugs.filter(Boolean)));

  if (!uniqueCourseSlugs.length) {
    return [] as CourseIdentity[];
  }

  return getDb().course.findMany({
    where: {
      slug: {
        in: uniqueCourseSlugs
      }
    },
    select: {
      id: true,
      slug: true
    }
  });
}

export function buildLegacyCourseWhere(identity: CourseIdentity | Pick<CourseIdentity, "slug">) {
  if ("id" in identity && identity.id) {
    return {
      OR: [
        {
          courseId: identity.id
        },
        {
          courseSlug: identity.slug
        }
      ]
    };
  }

  return {
    courseSlug: identity.slug
  };
}

export function buildLegacyCourseInWhere(identities: Array<CourseIdentity | Pick<CourseIdentity, "slug">>) {
  const courseSlugs = Array.from(new Set(identities.map((identity) => identity.slug).filter(Boolean)));
  const courseIds = Array.from(
    new Set(
      identities
        .filter((identity): identity is CourseIdentity => "id" in identity && Boolean(identity.id))
        .map((identity) => identity.id)
    )
  );

  if (!courseIds.length) {
    return {
      courseSlug: {
        in: courseSlugs
      }
    };
  }

  return {
    OR: [
      {
        courseId: {
          in: courseIds
        }
      },
      {
        courseSlug: {
          in: courseSlugs
        }
      }
    ]
  };
}
