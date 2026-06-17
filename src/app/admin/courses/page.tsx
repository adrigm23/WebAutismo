import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  CourseGrid,
  type CourseGridItem,
} from "@/components/admin/courses/course-grid";
import { CourseDetailCard } from "@/components/admin/courses/course-detail-card";
import { CreateCourseEditionCard } from "@/components/admin/courses/create-course-edition-card";
import type {
  CourseFilterStatus,
  EditableCourseDetail,
} from "@/components/admin/courses/types";
import { getSearchParamValue } from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDb } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gestión de Cursos — Admin" };

type Tab = "todos" | "publicados" | "borradores" | "archivados";

const TABS: { id: Tab; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "publicados", label: "Publicados" },
  { id: "borradores", label: "Borradores" },
  { id: "archivados", label: "Archivados" },
];

type CoursesPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    courseId?: string | string[];
    tab?: string | string[];
  }>;
};

export default async function AdminCoursesPage({
  searchParams,
}: CoursesPageProps) {
  await requireAdminConsoleUser("/admin/courses");

  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const courseId = getSearchParamValue(params.courseId);
  const rawTab = getSearchParamValue(params.tab, "todos");
  const activeTab: Tab = (["todos", "publicados", "borradores", "archivados"].includes(rawTab)
    ? rawTab
    : "todos") as Tab;

  // Map tab → DB status filter
  const statusFilter: CourseFilterStatus =
    activeTab === "publicados"
      ? "ACTIVE"
      : activeTab === "borradores"
        ? "INACTIVE"
        : "ALL";

  const db = getDb();

  const courseInclude = {
    editions: { orderBy: { editionNumber: "desc" as const } },
    teacherAssignments: { include: { user: { select: { id: true, name: true, email: true } } } },
    _count: { select: { enrollments: true as const, purchases: true as const } },
  } as const;

  const [courses, teacherCandidates] = await Promise.all([
    db.course.findMany({
      where: {
        ...(q
          ? { OR: [{ title: { contains: q } }, { slug: { contains: q } }] }
          : {}),
        ...(statusFilter !== "ALL"
          ? { status: statusFilter === "ACTIVE" ? "ACTIVE" as const : "INACTIVE" as const }
          : {}),
      },
      include: courseInclude,
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: { globalRole: { in: ["TEACHER", "ADMIN"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalCount = courses.length;

  // Build grid items — revenue approximated as enrollment_count × price
  const gridItems: CourseGridItem[] = courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    category: course.category,
    status: course.status,
    accentFrom: course.accentFrom,
    accentTo: course.accentTo,
    coverImageUrl: course.coverImageStorageKey
      ? `/api/courses/${course.slug}/cover`
      : null,
    enrollmentCount: course._count.enrollments,
    revenueInCents: course._count.purchases * course.priceInCents,
    editHref: `/admin/courses?courseId=${course.id}#course-detail`,
    viewHref: `/cursos/${course.slug}`,
  }));

  // Selected course for inline editor
  const selectedCourse =
    courses.find((c) => c.id === courseId) ?? null;
  const editableDetail: EditableCourseDetail | null = selectedCourse
    ? {
        id: selectedCourse.id,
        slug: selectedCourse.slug,
        title: selectedCourse.title,
        shortDescription: selectedCourse.shortDescription,
        status: selectedCourse.status,
        priceInCents: selectedCourse.priceInCents,
        teacherAssignments: selectedCourse.teacherAssignments.map((a) => ({
          id: a.id,
          userId: a.user.id,
          name: a.user.name,
          email: a.user.email,
        })),
        teacherCandidates: teacherCandidates.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email,
        })),
        editions: selectedCourse.editions.map((e) => ({
          id: e.id,
          label: e.label,
          status: e.status,
        })),
        audienceJson: Array.isArray(selectedCourse.audienceJson) ? (selectedCourse.audienceJson as string[]) : [],
        outcomesJson: Array.isArray(selectedCourse.outcomesJson) ? (selectedCourse.outcomesJson as string[]) : [],
        methodologyJson: Array.isArray(selectedCourse.methodologyJson) ? (selectedCourse.methodologyJson as string[]) : [],
        faqJson: Array.isArray(selectedCourse.faqJson)
          ? (selectedCourse.faqJson as { question: string; answer: string }[])
          : [],
      }
    : null;

  function buildTabHref(tab: Tab) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (tab !== "todos") sp.set("tab", tab);
    return `/admin/courses?${sp.toString()}`;
  }

  return (
    <div className="space-y-7">
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-[var(--color-ink)]">
              Gestión de Cursos
            </h1>
            <span className="rounded-full border border-[rgba(22,60,88,0.15)] bg-[rgba(22,60,88,0.06)] px-3 py-0.5 text-sm font-semibold text-[var(--color-ink-soft)]">
              {totalCount} Totales
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">
            Administra el currículo, métricas de retención y estado de publicación.
          </p>
        </div>

        <Link
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          href="/admin/courses/nuevo"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Crear Nuevo Curso
        </Link>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <nav
        aria-label="Filtrar cursos"
        className="flex gap-0 overflow-x-auto border-b border-[rgba(22,60,88,0.1)]"
      >
        {TABS.map(({ id, label }) => (
          <Link
            aria-current={activeTab === id ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-5 pb-3 pt-1 text-sm font-semibold transition focus-visible:outline-none",
              activeTab === id
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
            )}
            href={buildTabHref(id)}
            key={id}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* ── Course grid ─────────────────────────────────────────────── */}
      <CourseGrid courses={gridItems} tab={activeTab} />

      {/* ── Inline editor (appears when courseId is set) ────────────── */}
      {editableDetail ? (
        <section className="scroll-mt-24 space-y-6" id="course-detail">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgba(22,60,88,0.1)]" />
            <span className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Editando: {editableDetail.title}
            </span>
            <div className="h-px flex-1 bg-[rgba(22,60,88,0.1)]" />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
            <CourseDetailCard course={editableDetail} />
            <div className="space-y-6">
              <CreateCourseEditionCard courseId={editableDetail.id} />
            </div>
          </div>
        </section>
      ) : null}

    </div>
  );
}
