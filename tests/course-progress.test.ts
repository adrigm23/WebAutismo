import assert from "node:assert/strict";
import { courses } from "../src/data/courses.ts";
import {
  normalizeCourseProgress,
  resolveCourseModuleId
} from "../src/lib/course-progress.ts";

const course = courses[0];

export function runCourseProgressTests() {
  const databaseCourse = {
    slug: "curso-db",
    modules: [
      {
        id: "module-db-1",
        moduleKey: "modulo-legado-1",
        title: "Modulo 1",
        description: "",
        estimatedTime: "",
        resourcesSummary: ""
      },
      {
        id: "module-db-2",
        moduleKey: "modulo-legado-2",
        title: "Modulo 2",
        description: "",
        estimatedTime: "",
        resourcesSummary: ""
      }
    ]
  };

  assert.equal(
    resolveCourseModuleId(course, {
      moduleId: "prevencion-y-apoyos",
      moduleIndex: 0
    }),
    "prevencion-y-apoyos"
  );

  assert.equal(
    resolveCourseModuleId(course, {
      moduleId: "",
      moduleIndex: 2
    }),
    "prevencion-y-apoyos"
  );

  assert.equal(
    resolveCourseModuleId(course, {
      moduleId: "",
      moduleIndex: 99
    }),
    null
  );

  assert.equal(
    resolveCourseModuleId(databaseCourse, {
      moduleId: "modulo-legado-2",
      moduleIndex: 0
    }),
    "module-db-2"
  );

  const progress = normalizeCourseProgress(course, [
    {
      moduleId: "",
      moduleIndex: 0,
      completedAt: new Date("2026-05-01T10:00:00.000Z")
    },
    {
      moduleId: "evaluacion-funcional",
      moduleIndex: 1,
      completedAt: new Date("2026-05-02T10:00:00.000Z")
    },
    {
      moduleId: "evaluacion-funcional",
      moduleIndex: 1,
      completedAt: new Date("2026-05-03T10:00:00.000Z")
    },
    {
      moduleId: "",
      moduleIndex: 40,
      completedAt: new Date("2026-05-04T10:00:00.000Z")
    }
  ]);

  assert.equal(progress.totalModules, 4);
  assert.equal(progress.completedModules, 2);
  assert.equal(progress.pendingModules, 2);
  assert.equal(progress.completionRate, 50);
  assert.equal(progress.hasStarted, true);
  assert.equal(progress.isCompleted, false);
  assert.equal(progress.lastCompletedAt?.toISOString(), "2026-05-03T10:00:00.000Z");
  assert.deepEqual(
    progress.modules.map((module) => module.isCompleted),
    [true, true, false, false]
  );
}
