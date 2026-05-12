import type { CourseStatus, CourseEditionStatus } from "@prisma/client";

export type CourseFilterStatus = "ALL" | CourseStatus;

export type CourseTableRow = {
  id: string;
  href: string;
  title: string;
  slug: string;
  status: CourseStatus;
  priceInCents: number;
  modulesCount: number;
  editionsCount: number;
  teachersCount: number;
};

export type DemoCourseDetail = {
  title: string;
  slug: string;
  shortDescription: string;
  status: CourseStatus;
  teachers: readonly string[];
};

export type CourseTeacherAssignmentItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
};

export type CourseTeacherCandidate = {
  id: string;
  name: string;
  email: string;
};

export type CourseEditionBadgeItem = {
  id: string;
  label: string;
  status: CourseEditionStatus;
};

export type EditableCourseDetail = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  status: CourseStatus;
  priceInCents: number;
  teacherAssignments: CourseTeacherAssignmentItem[];
  teacherCandidates: CourseTeacherCandidate[];
  editions: CourseEditionBadgeItem[];
};
