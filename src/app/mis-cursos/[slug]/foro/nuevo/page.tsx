import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ForumThreadComposer } from "@/components/forum/forum-thread-composer";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunity, canModerateCourse } from "@/lib/course-community";
import { getForumCategories } from "@/lib/forum";

type ForumNewThreadPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: ForumNewThreadPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Nuevo hilo | ${course.title}` : "Nuevo hilo",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function ForumNewThreadPage({ params }: ForumNewThreadPageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/foro/nuevo`);
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const categories = await getForumCategories(course.slug, access.role);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}/foro`}>
          Foro
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Crear contenido</span>
      </div>

      <div>
        <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
          Crear nuevo hilo
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
          Publica una nueva discusión o, si tu rol lo permite, un anuncio programado para el curso.
        </p>
      </div>

      <ForumThreadComposer
        allowAnnouncement={canModerateCourse(access.role)}
        cancelHref={`/mis-cursos/${course.slug}/foro`}
        categories={categories.map((category) => ({
          slug: category.slug,
          title: category.title
        }))}
        courseSlug={course.slug}
      />
    </div>
  );
}
