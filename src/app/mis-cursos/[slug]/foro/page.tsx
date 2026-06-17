import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  MessageSquare,
  MessageSquareText,
  Pin,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse,
} from "@/lib/course-community";
import { getForumCategories } from "@/lib/forum-read";
import { getAggregatedCommunityFeed } from "@/lib/forum-read";
import { cn, firstValue, formatRelativeTime } from "@/lib/utils";

type ForumHomePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string | string[]; filter?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: ForumHomePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Foro | ${course.title}` : "Foro",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ForumHomePage({
  params,
  searchParams,
}: ForumHomePageProps) {
  const { slug } = await params;
  const { q, filter } = await searchParams;
  const [course, user] = await Promise.all([
    getCatalogCourseBySlug(slug),
    requireUser(`/mis-cursos/${slug}/foro`),
  ]);

  if (!course) {
    notFound();
  }
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const canModerate = canModerateCourse(access.role);

  const [categories, feedResult] = await Promise.all([
    getForumCategories(course.slug, access.role),
    getAggregatedCommunityFeed(
      [{ courseSlug: course.slug, courseTitle: course.title }],
      30,
    ),
  ]);

  const query = firstValue(q)?.trim().toLowerCase() ?? "";
  const filterValue = firstValue(filter) ?? "";
  const totalThreads = categories.reduce(
    (sum, category) => sum + category._count.threads,
    0,
  );

  const feedThreads = filterValue === "sin-respuesta"
    ? feedResult.threads.filter((t) => t.replyCount === 0)
    : feedResult.threads;

  return (
    <div>
      {/* Filtros + búsqueda */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div
          className="flex gap-1 p-1 rounded-full border border-[var(--color-border)] bg-white"
          style={{ boxShadow: "0px 2px 8px rgba(30,58,95,0.04)" }}
        >
          <Link
            href={`/mis-cursos/${course.slug}/foro`}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              filterValue !== "sin-respuesta"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[#43474e] hover:text-[var(--color-primary)]",
            )}
          >
            Más recientes
          </Link>
          <Link
            href={`/mis-cursos/${course.slug}/foro?filter=sin-respuesta`}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              filterValue === "sin-respuesta"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[#43474e] hover:text-[var(--color-primary)]",
            )}
          >
            Sin respuesta
          </Link>
        </div>
        <form
          method="get"
          action={`/mis-cursos/${course.slug}/foro`}
          className="flex-1 max-w-sm"
        >
          <div
            className="relative flex items-center h-10 rounded-full border border-[var(--color-border)] bg-white px-4 gap-2"
            style={{ boxShadow: "0px 2px 8px rgba(30,58,95,0.04)" }}
          >
            <Search className="h-4 w-4 text-[#74777f] shrink-0" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar discusiones..."
              className="flex-1 bg-transparent text-sm text-[#111c2c] placeholder:text-[#74777f] focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* Layout dos columnas */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 lg:items-start">
        {/* Columna principal: thread feed */}
        <div className="space-y-4">
          {feedThreads.length > 0 ? (
            feedThreads.map((thread) => (
              <Link
                key={thread.id}
                href={`/mis-cursos/${thread.courseSlug}/foro/${thread.categorySlug}/${thread.id}`}
                className="block bg-white rounded-xl border border-[var(--color-border)] p-5 hover:border-[#74777f] transition-all cursor-pointer group"
                style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {thread.isPinned && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-border)]">
                          <Pin className="h-3 w-3" /> Fijado
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded text-[12px] font-medium bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-success)]">
                        {thread.categoryTitle}
                      </span>
                      {thread.isResolved && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-success)]">
                          <CheckCircle2 className="h-3 w-3" /> Resuelta
                        </span>
                      )}
                      <span className="text-xs text-[#43474e]">
                        {formatRelativeTime(thread.lastActivityAt)}
                      </span>
                    </div>
                    <h3 className="text-[18px] font-semibold text-[#111c2c] group-hover:text-[var(--color-primary)] transition-colors leading-snug mb-2 line-clamp-2">
                      {thread.title}
                    </h3>
                    {thread.excerpt && (
                      <p className="text-sm text-[#43474e] line-clamp-2 leading-relaxed">
                        {thread.excerpt}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border shrink-0",
                        thread.isStaff
                          ? "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
                          : "border-[var(--color-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
                      )}
                    >
                      {thread.authorInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111c2c] leading-none truncate">
                        {thread.authorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#43474e]">
                    <MessageSquare className="h-4 w-4" />
                    <span>{thread.replyCount}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[var(--color-border)]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center mb-4">
                <MessageSquareText className="h-8 w-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[#111c2c] mb-2">
                Sin discusiones todavía
              </h3>
              <p className="text-sm text-[#43474e] max-w-xs mb-6">
                Sé el primero en iniciar una conversación en la comunidad del
                curso.
              </p>
              <Link
                href={`/mis-cursos/${course.slug}/foro/nuevo`}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-strong)] transition-colors"
              >
                <Plus className="h-4 w-4" /> Nueva Consulta
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar derecho */}
        <div className="hidden lg:block space-y-4 mt-0">
          {/* Mis comunidades */}
          <div
            className="bg-white rounded-xl border border-[var(--color-border)] p-4"
            style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-[#43474e]" />
              <h3 className="text-sm font-semibold text-[#111c2c]">
                Mis comunidades
              </h3>
            </div>
            <div className="space-y-1">
              <Link
                href={`/mis-cursos/${course.slug}/foro`}
                className="flex items-center justify-between w-full px-3 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium"
              >
                <span>Todas las discusiones</span>
                <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                  {totalThreads}
                </span>
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/mis-cursos/${course.slug}/foro/${cat.slug}`}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-full text-sm text-[#43474e] hover:bg-[#f0f3ff] hover:text-[var(--color-primary)] transition-colors"
                >
                  <span className="truncate">{cat.title}</span>
                  {cat._count.threads > 0 && (
                    <span className="ml-2 shrink-0 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-full px-2 py-0.5 text-xs font-medium">
                      {cat._count.threads}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Categorías activas */}
          <div
            className="bg-white rounded-xl border border-[var(--color-border)] p-4"
            style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-[#43474e]" />
              <h3 className="text-sm font-semibold text-[#111c2c]">
                Categorías activas
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories
                .filter((c) => c._count.threads > 0)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/mis-cursos/${course.slug}/foro/${cat.slug}`}
                    className="px-3 py-1 rounded-full border border-[var(--color-border)] text-sm text-[#43474e] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {cat.title}
                  </Link>
                ))}
            </div>
          </div>

          {/* Normas de la Comunidad */}
          <div
            className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center"
            style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}
          >
            <Shield className="h-8 w-8 text-[#43474e] mx-auto mb-2 opacity-60" />
            <h3 className="text-sm font-semibold text-[#111c2c] mb-1">
              Normas de la Comunidad
            </h3>
            <p className="text-xs text-[#43474e] mb-3">
              Mantenemos un entorno seguro, respetuoso y basado en evidencia.
            </p>
            <Link
              href="/soporte"
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              Leer lineamientos
            </Link>
          </div>

          {/* Para moderadores */}
          {canModerate && (
            <div
              className="bg-white rounded-xl border border-[var(--color-border)] p-4"
              style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                <h3 className="text-sm font-semibold text-[#111c2c]">
                  Moderación
                </h3>
              </div>
              <div className="space-y-2">
                <Link
                  href={`/mis-cursos/${course.slug}/foro/moderacion`}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#43474e] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  Panel de moderación
                </Link>
                <Link
                  href={`/mis-cursos/${course.slug}/foro/historico`}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#43474e] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  Ver histórico
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
