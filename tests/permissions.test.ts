import assert from "node:assert/strict";
import {
  canViewCourseProgress,
  resolveCourseViewerRole
} from "../src/lib/course-permissions.ts";

export function runPermissionTests() {
  assert.equal(
    resolveCourseViewerRole({
      globalRole: "ADMIN",
      isActive: true,
      hasCourseAssignment: false,
      hasEditionAssignment: false,
      hasActiveEnrollment: false
    }),
    "ADMIN"
  );

  assert.equal(
    resolveCourseViewerRole({
      globalRole: "TEACHER",
      isActive: true,
      hasCourseAssignment: true,
      hasEditionAssignment: false,
      hasActiveEnrollment: false
    }),
    "TEACHER"
  );

  assert.equal(
    resolveCourseViewerRole({
      globalRole: "TEACHER",
      isActive: true,
      hasCourseAssignment: false,
      hasEditionAssignment: false,
      hasActiveEnrollment: false
    }),
    null
  );

  assert.equal(
    resolveCourseViewerRole({
      globalRole: "STUDENT",
      isActive: true,
      hasCourseAssignment: false,
      hasEditionAssignment: false,
      hasActiveEnrollment: true
    }),
    "STUDENT"
  );

  assert.equal(
    canViewCourseProgress({
      globalRole: "TEACHER",
      viewerRole: "TEACHER"
    }),
    true
  );

  assert.equal(
    canViewCourseProgress({
      globalRole: "TEACHER",
      viewerRole: null
    }),
    false
  );
}
