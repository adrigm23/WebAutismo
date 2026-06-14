import assert from "node:assert/strict";
import { courses } from "../src/data/courses.ts";
import { buildClonedCourseInput } from "../src/lib/course-cloning.ts";

export function runCourseCloningTests() {
  const source = {
    ...courses[0],
    id: "course-source",
    teachers: [courses[0].teacher],
    editions: [],
    activeEdition: null,
    coverImageUrl: null,
    source: "legacy" as const
  };

  const cloned = buildClonedCourseInput(source, {
    slug: "curso-clonado",
    title: "Curso clonado"
  });

  assert.equal(cloned.slug, "curso-clonado");
  assert.equal(cloned.title, "Curso clonado");
  assert.equal(cloned.modules.length, source.modules.length);
  assert.equal(cloned.modules[0]?.moduleKey, source.modules[0]?.id);
  assert.equal(cloned.audienceJson.length, source.audience.length);
}
