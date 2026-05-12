import {
  togglePromotionAction,
  updatePromotionAction
} from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import type { PromotionCourseOption, PromotionFormValues } from "./types";
import { PromotionForm } from "./promotion-form";

export function PromotionDetailCard({
  promotion,
  courses
}: {
  promotion: PromotionFormValues;
  courses: PromotionCourseOption[];
}) {
  return (
    <Card className="rounded-[2rem] p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Editar promocion
          </h2>
          <p className="mt-2 text-sm leading-7 text-[#56697d]">
            Ajusta alcance, validez y limite de usos sin perder trazabilidad.
          </p>
        </div>
        <form action={togglePromotionAction}>
          <input name="promotionId" type="hidden" value={promotion.id} />
          <input name="isActive" type="hidden" value={promotion.isActive ? "false" : "true"} />
          <SubmitButton
            pendingLabel="Actualizando..."
            variant={promotion.isActive ? "ghost" : "secondary"}
          >
            {promotion.isActive ? "Desactivar" : "Activar"}
          </SubmitButton>
        </form>
      </div>

      <PromotionForm
        action={updatePromotionAction}
        courses={courses}
        defaultValues={promotion}
        submitLabel="Guardar cambios"
      />
    </Card>
  );
}
