import { defaultCourseCategories, ensureCourseCommunity } from "@/lib/course-community";
import { getDb } from "@/lib/prisma";

export async function getForumCategory(courseSlug: string, categorySlug: string) {
  try {
    const activeSpace = await ensureCourseCommunity(courseSlug);

    return getDb().forumCategory.findFirst({
      where: {
        forumSpaceId: activeSpace.id,
        slug: categorySlug
      }
    });
  } catch {
    const fallback = defaultCourseCategories.find((category) => category.slug === categorySlug);

    if (!fallback) {
      return null;
    }

    return {
      id: `demo-${courseSlug}-${fallback.slug}`,
      courseSlug,
      forumSpaceId: null,
      slug: fallback.slug,
      title: fallback.title,
      description: fallback.description,
      sortOrder: fallback.sortOrder
    };
  }
}
