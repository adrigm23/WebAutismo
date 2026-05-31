import type { Metadata } from "next";
import { getCatalogCourses } from "@/lib/course-catalog";
import { absoluteUrl } from "@/lib/site";
import { CourseCatalogClient } from "@/components/catalog/course-catalog-client";

export const metadata: Metadata = {
  title: "Cursos online",
  description:
    "Listado de cursos online especializados en autismo con compra directa y acceso segun edicion.",
  alternates: {
    canonical: absoluteUrl("/cursos")
  },
  openGraph: {
    title: "Cursos online",
    description:
      "Listado de cursos online especializados en autismo con compra directa y acceso segun edicion.",
    url: absoluteUrl("/cursos"),
    type: "website"
  }
};

export const revalidate = 3600;

export default async function CoursesPage() {
  const courses = await getCatalogCourses();
  return <CourseCatalogClient courses={courses} />;
}
