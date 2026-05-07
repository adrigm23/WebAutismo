import type { MetadataRoute } from "next";
import { getCatalogCourses } from "@/lib/course-catalog";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/cursos", "/acceder", "/registro"];
  const courses = await getCatalogCourses();

  return [
    ...staticRoutes.map((path) => ({
      url: absoluteUrl(path || "/"),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8
    })),
    ...courses.map((course) => ({
      url: absoluteUrl(`/cursos/${course.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.9
    }))
  ];
}
