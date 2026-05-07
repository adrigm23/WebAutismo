import type { CourseRole, UserGlobalRole } from "@prisma/client";

type ViewerContext = {
  globalRole: UserGlobalRole;
  isActive: boolean;
  hasCourseAssignment: boolean;
  hasEditionAssignment: boolean;
  hasActiveEnrollment: boolean;
};

export function isAdminUser(role: UserGlobalRole) {
  return role === "ADMIN";
}

export function isTeacherUser(role: UserGlobalRole) {
  return role === "TEACHER" || role === "ADMIN";
}

export function resolveCourseViewerRole(input: ViewerContext): CourseRole | null {
  if (!input.isActive) {
    return null;
  }

  if (input.globalRole === "ADMIN") {
    return "ADMIN";
  }

  if (input.globalRole === "TEACHER" && (input.hasCourseAssignment || input.hasEditionAssignment)) {
    return "TEACHER";
  }

  if (input.hasActiveEnrollment) {
    return "STUDENT";
  }

  return null;
}

export function canManageUsers(role: UserGlobalRole) {
  return role === "ADMIN";
}

export function canManagePromotions(role: UserGlobalRole) {
  return role === "ADMIN";
}

export function canAssignTeachers(role: UserGlobalRole) {
  return role === "ADMIN";
}

export function canCloneCourses(role: UserGlobalRole) {
  return role === "ADMIN";
}

export function canViewCourseProgress(input: {
  globalRole: UserGlobalRole;
  viewerRole: CourseRole | null;
}) {
  if (input.globalRole === "ADMIN") {
    return true;
  }

  return input.viewerRole === "TEACHER";
}

export function getGlobalRoleLabel(role: UserGlobalRole) {
  if (role === "ADMIN") {
    return "Administrador";
  }

  return role === "TEACHER" ? "Docente" : "Alumno";
}
