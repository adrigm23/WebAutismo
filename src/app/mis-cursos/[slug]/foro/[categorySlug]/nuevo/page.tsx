import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ForumThreadComposer } from "@/components/forum/forum-thread-composer";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
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
  const [course, user] = await Promise.all([
    getCatalogCourseBySlug(slug),
    requireUser(`/mis-cursos/${slug}/foro/${categorySlug}/nuevo`),
  ]);

  if (!course) {
    notFound();
  }
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
          Comunidad
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

      <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/92" padding="md">
        <SectionHeader
          description="Redacta una publicación clara, añade adjuntos si hace falta y deja el hilo preparado para que el grupo lo siga con contexto."
          eyebrow="Nuevo hilo"
          title={`Abrir conversación en ${selectedCategory.title}`}
        />
      </SurfaceCard>

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
