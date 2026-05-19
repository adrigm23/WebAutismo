import Link from "next/link";
import { CourseArtwork } from "@/components/course-artwork";
import type { CatalogCourse } from "@/lib/course-catalog";
import { formatPrice } from "@/lib/utils";

type HomeFeaturedCourseCardProps = {
  course: CatalogCourse;
};

export function HomeFeaturedCourseCard({ course }: HomeFeaturedCourseCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[rgba(12,113,195,0.12)] bg-white/88 transition duration-200 hover:border-[rgba(12,113,195,0.2)] hover:bg-white motion-reduce:transform-none">
      <CourseArtwork className="h-44 w-full border-0 sm:h-48" course={course} variant="card" />

      <div className="flex flex-1 flex-col px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {course.category}
        </p>

        <h3 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)]">
          <Link
            className="transition-colors group-hover:text-[var(--color-primary)]"
            href={`/cursos/${course.slug}`}
          >
            {course.title}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--color-muted)]">
          {course.shortDescription}
        </p>

        <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
          {course.duration} · {course.format}
        </p>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-[rgba(12,113,195,0.12)] pt-5">
          <p className="text-2xl font-semibold tracking-[-0.04em] text-[var(--color-primary)] tabular-nums">
            {formatPrice(course.priceInCents)}
          </p>
          <Link
            className="text-sm font-semibold text-[var(--color-primary)] underline-offset-4 transition hover:underline"
            href={`/cursos/${course.slug}`}
          >
            Ver curso
          </Link>
        </div>
      </div>
    </article>
  );
}
