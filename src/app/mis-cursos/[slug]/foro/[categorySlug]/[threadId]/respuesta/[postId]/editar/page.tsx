import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ForumPostEditForm } from "@/components/forum/forum-post-edit-form";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunity } from "@/lib/course-community";
import { canEditForumContent, getForumThreadById } from "@/lib/forum";
import { getDb } from "@/lib/prisma";

type ForumEditPostPageProps = {
  params: Promise<{ slug: string; categorySlug: string; threadId: string; postId: string }>;
};

export async function generateMetadata({
  params
}: ForumEditPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Editar respuesta | ${course.title}` : "Editar respuesta",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function ForumEditPostPage({
  params
}: ForumEditPostPageProps) {
  const { slug, categorySlug, threadId, postId } = await params;
  const [course, user] = await Promise.all([
    getCatalogCourseBySlug(slug),
    requireUser(`/mis-cursos/${slug}/foro/${categorySlug}/${threadId}/respuesta/${postId}/editar`),
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

  const [forumData, post] = await Promise.all([
    getForumThreadById({
      courseSlug: course.slug,
      categorySlug,
      threadId,
      viewerRole: access.role
    }),
    getDb().forumPost.findFirst({
      where: { id: postId, threadId },
      select: {
        id: true,
        body: true,
        deletedAt: true,
        createdAt: true,
        author: { select: { id: true } },
        attachments: { select: { id: true, label: true } }
      }
    })
  ]);

  if (!forumData) {
    notFound();
  }

  if (!post || post.deletedAt) {
    notFound();
  }

  if (
    !canEditForumContent({
      currentUserId: user.id,
      authorId: post.author.id,
      role: access.role,
      createdAt: post.createdAt
    })
  ) {
    redirect(`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}`);
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
          href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}`}
        >
          Hilo
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Editar respuesta</span>
      </div>

      <div>
        <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-[4rem]">
          Editar respuesta
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
          Corrige o mejora tu aportación manteniendo los adjuntos ya publicados en esta respuesta.
        </p>
      </div>

      <ForumPostEditForm
        cancelHref={`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}`}
        categorySlug={categorySlug}
        courseSlug={course.slug}
        existingAttachments={post.attachments.map((attachment) => ({
          id: attachment.id,
          label: attachment.label
        }))}
        initialBody={post.body}
        postId={postId}
        threadId={threadId}
      />
    </div>
  );
}
