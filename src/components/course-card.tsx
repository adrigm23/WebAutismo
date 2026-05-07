import Link from "next/link";
import { Clock3, MonitorPlay } from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import type { CatalogCourse } from "@/lib/course-catalog";
import { formatPrice } from "@/lib/utils";

type CourseCardProps = {
  course: CatalogCourse;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_18px_40px_rgba(34,34,33,0.06)] transition hover:-translate-y-1">
      <div className="relative p-4 pb-0">
        <CourseArtwork className="h-48 w-full" course={course} variant="card" />
        <span className="absolute left-8 top-8 rounded-md bg-[rgba(12,113,195,0.92)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
          {course.category}
        </span>
      </div>

      <div className="px-6 pb-6 pt-5">
        <h3 className="text-[2.05rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-ink)]">
          {course.title}
        </h3>
        <p className="mt-4 text-[1.03rem] leading-8 text-[var(--color-ink)]/84">
          {course.shortDescription}
        </p>

        <div className="mt-8 space-y-3 text-[0.98rem] text-[var(--color-ink)]">
          <div className="flex items-center gap-3">
            <Clock3 className="h-4 w-4 text-[var(--color-primary)]" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-3">
            <MonitorPlay className="h-4 w-4 text-[var(--color-primary)]" />
            <span>{course.format}</span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-[rgba(12,113,195,0.14)] pt-4">
          <p className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-primary)]">
            {formatPrice(course.priceInCents)}
          </p>
          <Link
            className="rounded-xl border border-[var(--color-primary)] px-5 py-3 text-base font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
            href={`/cursos/${course.slug}`}
          >
            Ver curso
          </Link>
        </div>
      </div>
    </article>
  );
}
