import Link from "next/link";
import { User, Clock3 } from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import type { CatalogCourse } from "@/lib/course-catalog";
import { formatPrice } from "@/lib/utils";

type Props = {
  course: CatalogCourse;
};

export function CourseCardCatalog({ course }: Props) {
  const isFree = course.priceInCents === 0;
  const teacherName = course.teachers[0]?.name ?? "Equipo Campus Autismo";

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="relative h-48 overflow-hidden">
        <CourseArtwork
          className="h-full w-full rounded-none border-none"
          course={course}
          variant="card"
        />
        {isFree && (
          <span className="absolute left-3 top-3 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            Gratuito
          </span>
        )}
        <span
          className={`absolute top-3 rounded-md bg-[rgba(12,113,195,0.88)] px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${isFree ? "right-3" : "left-3"}`}
        >
          {course.category}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-base font-bold leading-snug text-[var(--color-ink)]">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
          {course.shortDescription}
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span>{teacherName}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            <span>{course.duration}</span>
          </div>
          <span className="text-base font-bold text-[var(--color-ink)]">
            {isFree ? "Gratis" : formatPrice(course.priceInCents)}
          </span>
        </div>

        <Link
          className="mt-4 block w-full rounded-lg border border-[var(--color-ink)] py-2.5 text-center text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)] hover:text-white"
          href={`/cursos/${course.slug}`}
        >
          Ver Detalle
        </Link>
      </div>
    </article>
  );
}
