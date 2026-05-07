export const COURSE_ROLES = {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN"
} as const;

export type CourseRole = (typeof COURSE_ROLES)[keyof typeof COURSE_ROLES];

export function isStaffCourseRole(role: CourseRole) {
  return role === COURSE_ROLES.TEACHER || role === COURSE_ROLES.ADMIN;
}
