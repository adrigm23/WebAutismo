import assert from "node:assert/strict";
import {
  getEnrollmentAccessState,
  isEnrollmentActiveNow,
  resolveEditionAccessUntil
} from "../src/lib/course-editions.ts";

export function runCourseEditionTests() {
  const accessUntil = resolveEditionAccessUntil({
    startsAt: new Date("2026-05-01T00:00:00.000Z"),
    endsAt: new Date("2026-05-10T00:00:00.000Z"),
    graceAccessDays: 15,
    accessUntil: null
  });

  assert.equal(accessUntil?.toISOString(), "2026-05-25T00:00:00.000Z");

  const active = isEnrollmentActiveNow(
    {
      status: "ACTIVE",
      accessStartsAt: new Date("2026-05-01T00:00:00.000Z"),
      accessUntil: new Date("2026-05-25T00:00:00.000Z")
    },
    new Date("2026-05-20T00:00:00.000Z")
  );

  assert.equal(active, true);

  const expiredState = getEnrollmentAccessState(
    {
      status: "ACTIVE",
      accessStartsAt: new Date("2026-05-01T00:00:00.000Z"),
      accessUntil: new Date("2026-05-25T00:00:00.000Z")
    },
    new Date("2026-05-26T00:00:00.000Z")
  );

  assert.equal(expiredState, "expired");
}
