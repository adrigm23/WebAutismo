import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ForumThreadComposer } from "@/components/forum/forum-thread-composer";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunity, canModerateCourse } from "@/lib/course-community";
import { getForumCategories } from "@/lib/forum";

type ForumCategoryNewThreadPageProps = {
  params: Promise<{ slug: string; categorySlug: string }>;
};

export async function generateMetadata({
  params
}: ForumCategoryNewThreadPageProps): Promise<Metadata> {
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

export default async function ForumCategoryNewThreadPage({
  params
}: ForumCategoryNewThreadPageProps) {
  const { slug, categorySlug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/foro/${categorySlug}/nuevo`);
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const categories = await getForumCategories(course.slug, access.role);
  const selectedCategory = categories.find((category) => category.slug === categorySlug);

  if (!selectedCategory) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}/foro`}>
          Foro
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          className="hover:text-[var(--color-primary)]"
          href={`/mis-cursos/${course.slug}/foro/${categorySlug}`}
        >
          {selectedCategory.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Crear contenido</span>
      </div>

      <div>
        <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
          Nuevo hilo en {selectedCategory.title}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
          Redacta una publicación clara, añade adjuntos si hace falta y deja el hilo preparado para que el grupo lo siga con contexto.
        </p>
      </div>

      <ForumThreadComposer
        allowAnnouncement={canModerateCourse(access.role)}
        cancelHref={`/mis-cursos/${course.slug}/foro/${categorySlug}`}
        categories={categories.map((category) => ({
          slug: category.slug,
          title: category.title
        }))}
        courseSlug={course.slug}
        lockCategory
        selectedCategorySlug={categorySlug}
      />
    </div>
  );
}
