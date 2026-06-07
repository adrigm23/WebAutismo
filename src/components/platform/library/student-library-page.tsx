"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LibraryResourceType } from "@prisma/client";
import {
  BookOpen,
  Download,
  ExternalLink,
  Eye,
  File,
  FileText,
  Film,
  Globe,
  Image,
  Presentation,
  Search,
} from "lucide-react";
import type { LibraryResourceItem } from "@/lib/library";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StudentCourse = { id: string; title: string; slug: string };

export type StudentLibraryPageProps = {
  resources: LibraryResourceItem[];
  courses: StudentCourse[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  if (days < 7) return `Hace ${days} días`;
  if (days < 14) return "Hace 1 semana";
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Type icon ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  LibraryResourceType,
  { Icon: React.ElementType; bg: string; color: string }
> = {
  PDF: { Icon: FileText, bg: "bg-red-50", color: "text-red-500" },
  VIDEO: { Icon: Film, bg: "bg-emerald-50", color: "text-emerald-500" },
  PRESENTATION: { Icon: Presentation, bg: "bg-amber-50", color: "text-amber-500" },
  DOCUMENT: { Icon: FileText, bg: "bg-sky-50", color: "text-sky-500" },
  IMAGE: { Icon: Image, bg: "bg-purple-50", color: "text-purple-500" },
  LINK: { Icon: Globe, bg: "bg-violet-50", color: "text-violet-500" },
  OTHER: { Icon: File, bg: "bg-gray-50", color: "text-gray-500" },
};

function TypeIcon({
  type,
  className,
  iconClassName,
}: {
  type: LibraryResourceType;
  className?: string;
  iconClassName?: string;
}) {
  const { Icon, bg, color } = TYPE_CONFIG[type];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        bg,
        className ?? "h-9 w-9"
      )}
    >
      <Icon className={cn(color, iconClassName ?? "h-4 w-4")} />
    </div>
  );
}

// ─── Course resource card ─────────────────────────────────────────────────────

function CourseResourceCard({ resource }: { resource: LibraryResourceItem }) {
  const isLink = resource.type === "LINK" && resource.externalUrl;
  const isVideo = resource.type === "VIDEO";

  const actionHref = isLink
    ? resource.externalUrl!
    : isVideo
      ? `${resource.downloadHref}?inline=1`
      : resource.downloadHref;

  const ActionIcon = isLink ? ExternalLink : isVideo ? Eye : Download;
  const actionLabel = isLink ? "Abrir" : isVideo ? "Ver" : "Descargar";

  return (
    <div className="flex w-40 shrink-0 snap-start flex-col gap-2.5 rounded-xl border border-[#eaecf0] bg-white p-3.5 transition hover:shadow-sm sm:w-44">
      <TypeIcon type={resource.type} className="h-9 w-9" iconClassName="h-4 w-4" />

      <p className="line-clamp-2 text-xs font-semibold leading-snug text-[var(--color-primary)]">
        {resource.title}
      </p>

      <p className="text-[0.65rem] leading-none text-[#9ba3af]">
        {resource.type} · {formatBytes(resource.fileSize)}
      </p>

      <p className="text-[0.65rem] leading-none text-[#9ba3af]">
        {formatRelativeDate(resource.createdAt)}
      </p>

      <a
        href={actionHref}
        download={!isLink && !isVideo ? true : undefined}
        target={isLink || isVideo ? "_blank" : undefined}
        rel={isLink || isVideo ? "noopener noreferrer" : undefined}
        className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d0d5dd] bg-white px-3 py-1.5 text-[0.7rem] font-medium text-[#374151] transition hover:bg-[#f3f4f6]"
      >
        <ActionIcon className="h-3 w-3" />
        {actionLabel}
      </a>
    </div>
  );
}

// ─── General resource card ────────────────────────────────────────────────────

function GeneralResourceCard({ resource }: { resource: LibraryResourceItem }) {
  const isLink = resource.type === "LINK" && resource.externalUrl;
  const isVideo = resource.type === "VIDEO";

  const actionHref = isLink
    ? resource.externalUrl!
    : isVideo
      ? `${resource.downloadHref}?inline=1`
      : resource.downloadHref;

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-[#eaecf0] bg-white p-4">
      <div className="flex gap-3">
        <TypeIcon type={resource.type} className="h-10 w-10" iconClassName="h-5 w-5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug text-[var(--color-primary)] line-clamp-2">
            {resource.title}
          </p>
          {resource.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6b7280]">
              {resource.description}
            </p>
          )}
        </div>
      </div>

      <a
        href={actionHref}
        download={!isLink && !isVideo ? true : undefined}
        target={isLink || isVideo ? "_blank" : undefined}
        rel={isLink || isVideo ? "noopener noreferrer" : undefined}
        className="flex w-full items-center justify-center rounded-lg border border-[#d0d5dd] py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f3f4f6]"
      >
        Acceder
      </a>
    </div>
  );
}

// ─── Course section ───────────────────────────────────────────────────────────

function CourseSection({
  course,
  resources,
}: {
  course: StudentCourse;
  resources: LibraryResourceItem[];
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-lg font-bold text-[var(--color-primary)] sm:text-xl">
            {course.title}
          </h2>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            {resources.length} Material{resources.length !== 1 ? "es" : ""}
          </span>
        </div>
        <Link
          href={`/mis-cursos/${course.slug}/recursos`}
          className="shrink-0 whitespace-nowrap text-sm font-medium text-[#6b7280] transition hover:text-[var(--color-primary)]"
        >
          Ver todos →
        </Link>
      </div>

      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-2",
          "snap-x snap-mandatory",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {resources.slice(0, 6).map((r) => (
          <CourseResourceCard key={r.id} resource={r} />
        ))}
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudentLibraryPage({ resources, courses }: StudentLibraryPageProps) {
  const [q, setQ] = useState("");

  const enrolledCourseIds = useMemo(() => new Set(courses.map((c) => c.id)), [courses]);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return resources;
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.courseTitle?.toLowerCase().includes(term) ||
        r.fileName.toLowerCase().includes(term)
    );
  }, [resources, q]);

  const courseGroups = useMemo(
    () =>
      courses
        .map((course) => ({
          course,
          resources: filtered.filter((r) => r.courseId === course.id),
        }))
        .filter((g) => g.resources.length > 0),
    [courses, filtered]
  );

  const generalResources = useMemo(
    () => filtered.filter((r) => !r.courseId || !enrolledCourseIds.has(r.courseId)),
    [filtered, enrolledCourseIds]
  );

  const hasResults = courseGroups.length > 0 || generalResources.length > 0;

  return (
    <div className="min-h-screen">
      <div className="px-5 py-8 sm:px-8 xl:px-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-primary)] sm:text-[1.75rem]">
            Materiales de tus cursos
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Accede a los recursos de todos tus cursos en un solo lugar.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ba3af]" />
          <input
            type="text"
            placeholder="Buscar por título, tipo de archivo o curso..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-[#d0d5dd] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[#1a1f2e]/10"
          />
        </div>

        {/* Course sections */}
        {courseGroups.map(({ course, resources: cr }) => (
          <CourseSection key={course.id} course={course} resources={cr} />
        ))}

        {/* General resources */}
        {generalResources.length > 0 && (
          <section className="mt-2">
            <div className="rounded-2xl border border-[#eaecf0] bg-[#f8fafc] p-5 sm:p-6">
              <h2 className="text-lg font-bold text-[var(--color-primary)] sm:text-xl">
                Recursos generales
              </h2>
              <p className="mt-0.5 text-sm text-[#6b7280]">
                Material de consulta pública y biblioteca base.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {generalResources.map((r) => (
                  <GeneralResourceCard key={r.id} resource={r} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasResults && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white px-6 py-16 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-[#d1d5db]" />
            <p className="text-sm font-medium text-[#6b7280]">
              {q
                ? "No se encontraron recursos con esa búsqueda."
                : "Aún no hay materiales disponibles en tus cursos."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
