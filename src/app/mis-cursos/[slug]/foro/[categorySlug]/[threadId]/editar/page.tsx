import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ForumThreadEditForm } from "@/components/forum/forum-thread-edit-form";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse
} from "@/lib/course-community";
import { canEditForumContent, getForumThreadById } from "@/lib/forum";

type ForumEditThreadPageProps = {
  params: Promise<{ slug: string; categorySlug: string; threadId: string }>;
};

function toDateTimeLocalValue(date: Date | null) {
  if (!date) {
    return "";
  }

  const nextDate = new Date(date);
  const offset = nextDate.getTimezoneOffset();
  const localDate = new Date(nextDate.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export async function generateMetadata({
  params
}: ForumEditThreadPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Editar hilo | ${course.title}` : "Editar hilo",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function ForumEditThreadPage({
  params
}: ForumEditThreadPageProps) {
  const { slug, categorySlug, threadId } = await params;
  const [course, user] = await Promise.all([
    getCatalogCourseBySlug(slug),
    requireUser(`/mis-cursos/${slug}/foro/${categorySlug}/${threadId}/editar`),
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

  const forumData = await getForumThreadById({
    courseSlug: course.slug,
    categorySlug,
    threadId,
    viewerRole: access.role
  });

  if (!forumData) {
    notFound();
  }

  if (
    !canEditForumContent({
      currentUserId: user.id,
      authorId: forumData.thread.author.id,
      role: access.role,
      createdAt: forumData.thread.createdAt
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
        <span className="text-[var(--color-ink)]">Editar</span>
      </div>

      <div>
        <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-[4rem]">
          Editar hilo
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
          Ajusta el contenido publicado sin perder el contexto del hilo ni sus adjuntos actuales.
        </p>
      </div>

      <ForumThreadEditForm
        allowAnnouncement={canModerateCourse(access.role)}
        cancelHref={`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}`}
        categorySlug={categorySlug}
        courseSlug={course.slug}
        existingAttachments={forumData.thread.attachments.map((attachment) => ({
          id: attachment.id,
          label: attachment.label
        }))}
        initialValues={{
          title: forumData.thread.title,
          body: forumData.thread.body,
          type: forumData.thread.type,
          isPinned: forumData.thread.isPinned,
          isReadOnly: forumData.thread.isReadOnly,
          scheduledFor: toDateTimeLocalValue(forumData.thread.scheduledFor)
        }}
        threadId={threadId}
      />
    </div>
  );
}
