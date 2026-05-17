import type { Metadata } from "next";
import { CourseCard } from "@/components/course-card";
import { getCatalogCourses } from "@/lib/course-catalog";
import { absoluteUrl } from "@/lib/site";

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

  return (
    <div className="pb-24 pt-14 lg:pt-16">
      <section className="site-container">
        <div className="max-w-4xl">
          <h1 className="text-display-xl font-semibold text-[var(--color-ink)]">
            Catálogo de cursos
          </h1>
          <p className="mt-5 text-body-lg text-[var(--color-muted)]">
            Descubre una oferta formativa especializada, pensada para familias, docentes y
            profesionales que necesitan contenido claro, aplicable y acceso gestionado por
            ediciones reales del campus.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard course={course} key={course.slug} />
          ))}
        </div>
      </section>
    </div>
  );
}
