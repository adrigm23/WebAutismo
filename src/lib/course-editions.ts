import type { CourseEnrollmentStatus, CourseEditionStatus } from "@prisma/client";

type EditionWindowInput = {
  startsAt: Date | null;
  endsAt: Date | null;
  graceAccessDays: number;
  accessUntil: Date | null;
};

type EnrollmentWindowInput = {
  status: CourseEnrollmentStatus;
  accessStartsAt: Date;
  accessUntil: Date | null;
};

export function resolveEditionAccessUntil(input: EditionWindowInput) {
  if (input.accessUntil) {
    return input.accessUntil;
  }

  if (!input.endsAt) {
    return null;
  }

  const accessUntil = new Date(input.endsAt);
  accessUntil.setUTCDate(accessUntil.getUTCDate() + Math.max(input.graceAccessDays, 0));
  return accessUntil;
}

export function isEditionVisible(input: {
  status: CourseEditionStatus;
  isActive: boolean;
}) {
  return input.isActive && input.status !== "CANCELLED";
}

export function isEnrollmentActiveNow(input: EnrollmentWindowInput, now = new Date()) {
  if (input.status !== "ACTIVE") {
    return false;
  }

  if (input.accessStartsAt.getTime() > now.getTime()) {
    return false;
  }

  if (input.accessUntil && input.accessUntil.getTime() < now.getTime()) {
    return false;
  }

  return true;
}

export function getEnrollmentAccessState(input: EnrollmentWindowInput, now = new Date()) {
  if (input.status === "CANCELLED" || input.status === "REVOKED") {
    return "inactive" as const;
  }

  if (input.status === "EXPIRED") {
    return "expired" as const;
  }

  if (input.accessStartsAt.getTime() > now.getTime()) {
    return "scheduled" as const;
  }

  if (input.accessUntil && input.accessUntil.getTime() < now.getTime()) {
    return "expired" as const;
  }

  return "active" as const;
}
