import { getEntityTypeLabel } from "@/components/admin/audit/audit-utils";
import { getAuditActionLabel, getAuditActionTone } from "@/lib/admin-console";

describe("admin audit labels", () => {
  test("renders readable labels for course resource actions", () => {
    expect(getAuditActionLabel("COURSE_RESOURCE_CREATED")).toBe("Recurso creado");
    expect(getAuditActionLabel("COURSE_RESOURCE_UNPUBLISHED")).toBe("Recurso ocultado");
    expect(getAuditActionLabel("COURSE_RESOURCE_SUBMISSION_REVIEWED")).toBe(
      "Entrega revisada"
    );
  });

  test("maps the new audit entities to readable names", () => {
    expect(getEntityTypeLabel("COURSE_RESOURCE")).toBe("Recurso del curso");
    expect(getEntityTypeLabel("COURSE_RESOURCE_SUBMISSION")).toBe(
      "Entrega de ejercicio"
    );
  });

  test("keeps the tone semantics for the new audit actions", () => {
    expect(getAuditActionTone("COURSE_RESOURCE_UPDATED")).toBe("warning");
    expect(getAuditActionTone("COURSE_RESOURCE_UNPUBLISHED")).toBe("primary");
    expect(getAuditActionTone("COURSE_RESOURCE_SUBMISSION_CHANGES_REQUESTED")).toBe(
      "primary"
    );
  });
});
