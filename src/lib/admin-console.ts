import type {
  AuditAction,
  CourseEditionStatus,
  CourseEnrollmentStatus,
  CourseStatus,
  PromotionDiscountType,
  UserGlobalRole,
} from "@prisma/client";
import { getGlobalRoleLabel } from "@/lib/course-permissions";
import { firstValue, formatPrice, getInitials } from "@/lib/utils";

export type AdminNavigationItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: string;
};

export const adminNavigation: AdminNavigationItem[] = [
  {
    href: "/admin",
    label: "Panel de control",
    shortLabel: "Panel",
    icon: "layout-dashboard",
  },
  {
    href: "/admin/users",
    label: "Gestion de usuarios",
    shortLabel: "Usuarios",
    icon: "users-round",
  },
  {
    href: "/admin/teachers",
    label: "Portal docente",
    shortLabel: "Docentes",
    icon: "graduation-cap",
  },
  {
    href: "/admin/courses",
    label: "Catálogo de cursos",
    shortLabel: "Cursos",
    icon: "book-copy",
  },
  {
    href: "/admin/editions",
    label: "Ediciones",
    shortLabel: "Ediciones",
    icon: "layers-3",
  },
  {
    href: "/admin/promotions",
    label: "Promociones",
    shortLabel: "Promociones",
    icon: "tickets",
  },
  {
    href: "/admin/audit",
    label: "Registro de auditoria",
    shortLabel: "Auditoria",
    icon: "scroll-text",
  },
  {
    href: "/admin/supervision",
    label: "Supervision academica",
    shortLabel: "Supervision",
    icon: "chart-column-big",
  },
];

export function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function getAdminSearchPlaceholder(pathname: string) {
  if (pathname.startsWith("/admin/users")) {
    return "Buscar usuarios, emails...";
  }

  if (pathname.startsWith("/admin/teachers")) {
    return "Buscar docentes, cursos asignados...";
  }

  if (pathname.startsWith("/admin/courses")) {
    return "Buscar cursos, slugs, docentes...";
  }

  if (pathname.startsWith("/admin/editions")) {
    return "Buscar ediciones...";
  }

  if (pathname.startsWith("/admin/promotions")) {
    return "Buscar codigos promocionales...";
  }

  if (pathname.startsWith("/admin/audit")) {
    return "Buscar registros, actores, entidades...";
  }

  if (pathname.startsWith("/admin/supervision")) {
    return "Buscar alumnos, cursos, accesos...";
  }

  return "Buscar...";
}

export function getUserInitials(name: string) {
  return getInitials(name, "AD");
}

export function getCourseStatusLabel(status: CourseStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo";
}

export function getCourseStatusTone(status: CourseStatus) {
  return status === "ACTIVE" ? "primary" : "neutral";
}

export function getEditionStatusLabel(status: CourseEditionStatus) {
  switch (status) {
    case "ACTIVE":
      return "Abierta";
    case "SCHEDULED":
      return "Programada";
    case "CLOSED":
      return "Cerrada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}

export function getEditionStatusTone(status: CourseEditionStatus) {
  switch (status) {
    case "ACTIVE":
      return "primary";
    case "SCHEDULED":
      return "warning";
    case "CLOSED":
      return "neutral";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

export function getEnrollmentStatusLabel(status: CourseEnrollmentStatus) {
  switch (status) {
    case "ACTIVE":
      return "Activa";
    case "CANCELLED":
      return "Baja";
    case "REVOKED":
      return "Revocada";
    case "EXPIRED":
      return "Expirada";
    default:
      return status;
  }
}

export function getRoleTone(role: UserGlobalRole) {
  switch (role) {
    case "ADMIN":
      return "primary";
    case "TEACHER":
      return "warning";
    default:
      return "neutral";
  }
}

export function getAccessStateLabel(
  state: "active" | "scheduled" | "expired" | "inactive",
) {
  switch (state) {
    case "active":
      return "Vigente";
    case "scheduled":
      return "Programado";
    case "expired":
      return "Caducado";
    case "inactive":
      return "Inactivo";
    default:
      return state;
  }
}

export function getAccessStateTone(
  state: "active" | "scheduled" | "expired" | "inactive",
) {
  switch (state) {
    case "active":
      return "primary";
    case "scheduled":
      return "warning";
    case "expired":
      return "danger";
    case "inactive":
      return "neutral";
    default:
      return "neutral";
  }
}

export function getPromotionDiscountSummary(input: {
  discountType: PromotionDiscountType;
  amountInCents: number;
}) {
  return input.discountType === "PERCENTAGE"
    ? `${input.amountInCents}%`
    : formatPrice(input.amountInCents);
}

export function getPromotionScopeLabel(scope: "GLOBAL" | "COURSE") {
  return scope === "GLOBAL" ? "Global" : "Por curso";
}

export function getAuditActionLabel(action: AuditAction) {
  const labels: Partial<Record<AuditAction, string>> = {
    COURSE_CREATED: "Curso creado",
    COURSE_UPDATED: "Curso actualizado",
    COURSE_CLONED: "Curso clonado",
    COURSE_TEACHER_ASSIGNED: "Docente asignado",
    COURSE_TEACHER_UNASSIGNED: "Docente desasignado",
    COURSE_EDITION_TEACHER_ASSIGNED: "Docente asignado a edicion",
    COURSE_EDITION_TEACHER_UNASSIGNED: "Docente retirado de edicion",
    EDITION_CREATED: "Edición creada",
    EDITION_UPDATED: "Edición actualizada",
    EDITION_CLOSED: "Edición cerrada",
    USER_CREATED: "Usuario creado",
    USER_DEACTIVATED: "Usuario desactivado",
    USER_REACTIVATED: "Usuario reactivado",
    USER_ADMIN_GRANTED: "Permiso admin concedido",
    USER_ADMIN_REVOKED: "Permiso admin revocado",
    USER_TEACHER_GRANTED: "Permiso docente concedido",
    USER_TEACHER_REVOKED: "Permiso docente revocado",
    ENROLLMENT_CREATED: "Matricula creada",
    ENROLLMENT_DEACTIVATED: "Matricula desactivada",
    ENROLLMENT_REACTIVATED: "Matricula reactivada",
    PROMOTION_CREATED: "Promocion creada",
    PROMOTION_UPDATED: "Promocion actualizada",
    PROMOTION_ACTIVATED: "Promocion activada",
    PROMOTION_DEACTIVATED: "Promocion desactivada",
    PURCHASE_CREATED: "Compra creada",
    PURCHASE_PAID: "Compra pagada",
    PURCHASE_FAILED: "Compra fallida",
    PROMOTION_APPLIED: "Promocion aplicada",
    NOTIFICATION_PREFERENCES_UPDATED: "Preferencias actualizadas",
    COURSE_RESOURCE_CREATED: "Recurso creado",
    COURSE_RESOURCE_UPDATED: "Recurso actualizado",
    COURSE_RESOURCE_DELETED: "Recurso eliminado",
    COURSE_RESOURCE_PUBLISHED: "Recurso publicado",
    COURSE_RESOURCE_UNPUBLISHED: "Recurso ocultado",
    COURSE_RESOURCE_REORDERED: "Recurso reordenado",
    COURSE_RESOURCE_SUBMISSION_CREATED: "Entrega creada",
    COURSE_RESOURCE_SUBMISSION_UPDATED: "Entrega actualizada",
    COURSE_RESOURCE_SUBMISSION_REVIEWED: "Entrega revisada",
    COURSE_RESOURCE_SUBMISSION_CHANGES_REQUESTED: "Cambios solicitados",
  };

  return labels[action] ?? action;
}

export function getAuditActionTone(action: AuditAction) {
  if (
    action.includes("DEACTIVATED") ||
    action.includes("REVOKED") ||
    action === "PURCHASE_FAILED"
  ) {
    return "danger";
  }

  if (
    action.includes("UPDATED") ||
    action.includes("CLOSED") ||
    action.includes("APPLIED")
  ) {
    return "warning";
  }

  return "primary";
}

export function getSearchParamValue(
  value: string | string[] | undefined,
  fallback = "",
) {
  return firstValue(value)?.trim() || fallback;
}

export function getRoleFilterLabel(role: UserGlobalRole) {
  return getGlobalRoleLabel(role);
}
