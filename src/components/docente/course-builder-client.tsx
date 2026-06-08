"use client";

import dynamic from "next/dynamic";
import type { BuilderCourse } from "@/components/docente/course-builder/course-builder";

// Lazy-load the builder so @dnd-kit (heavy drag-and-drop library) is only
// downloaded when a teacher actually opens the constructor route.
// ssr: false is only valid inside a Client Component — do not move to a Server Component.
const CourseBuilder = dynamic(
  () =>
    import("@/components/docente/course-builder/course-builder").then((m) => ({
      default: m.CourseBuilder,
    })),
  { ssr: false },
);

type Props = {
  course: BuilderCourse;
  embedded?: boolean;
};

export function CourseBuilderClient({ course, embedded }: Props) {
  return <CourseBuilder course={course} embedded={embedded} />;
}
