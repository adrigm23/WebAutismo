import Link from "next/link";
import { ArrowUpRight, Clock3, MonitorPlay } from "lucide-react";
import { CourseArtwork } from "@/components/course-artwork";
import type { CatalogCourse } from "@/lib/course-catalog";
import { formatPrice } from "@/lib/utils";

type HomeFeaturedCourseCardProps = {
  course: CatalogCourse;
};

export function HomeFeaturedCourseCard({ course }: HomeFeaturedCourseCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(12,113,195,0.14)] bg-white shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)] motion-reduce:transform-none">
      <div className="relative p-4 pb-0">
        <CourseArtwork className="h-44 w-full sm:h-48" course={course} variant="card" />
        <span className="absolute left-7 top-7 rounded-md bg-[rgba(12,113,195,0.94)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white">
          {course.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <h3 className="text-xl font-semibold leading-snug tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.35rem]">
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

        <ul className="mt-5 space-y-2 text-sm text-[var(--color-ink)]">
          <li className="flex items-center gap-2.5">
            <Clock3 aria-hidden className="h-4 w-4 text-[var(--color-primary)]" />
            <span>{course.duration}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <MonitorPlay aria-hidden className="h-4 w-4 text-[var(--color-primary)]" />
            <span>{course.format}</span>
          </li>
        </ul>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-[rgba(12,113,195,0.12)] pt-4">
          <p className="text-2xl font-semibold tracking-[-0.04em] text-[var(--color-primary)] tabular-nums">
            {formatPrice(course.priceInCents)}
          </p>
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            href={`/cursos/${course.slug}`}
          >
            Ver curso
            <ArrowUpRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
