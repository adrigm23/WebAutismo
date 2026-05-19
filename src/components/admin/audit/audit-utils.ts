import type { AuditEntityType } from "@prisma/client";

export function getEntityTypeLabel(entityType: AuditEntityType) {
  switch (entityType) {
    case "USER":
      return "Usuario";
    case "COURSE":
      return "Curso";
    case "COURSE_EDITION":
      return "Edición";
    case "COURSE_ENROLLMENT":
      return "Matricula";
    case "COURSE_RESOURCE":
      return "Recurso del curso";
    case "COURSE_RESOURCE_SUBMISSION":
      return "Entrega de ejercicio";
    case "PROMOTION":
      return "Promocion";
    case "PURCHASE":
      return "Compra";
    case "NOTIFICATION_PREFERENCE":
      return "Preferencias";
    default:
      return entityType;
  }
}

export function formatMetadataKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatMetadataValue(value: unknown) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} elementos`;
  }

  if (value && typeof value === "object") {
    return `${Object.keys(value).length} claves`;
  }

  return "Sin datos";
}
