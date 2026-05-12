import { createPromotionAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import type { PromotionCourseOption } from "./types";
import { PromotionForm } from "./promotion-form";

export function CreatePromotionCard({
  courses
}: {
  courses: PromotionCourseOption[];
}) {
  return (
    <Card className="rounded-[2rem] p-7" id="create-promotion">
      <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
        Crear cupon
      </h2>
      <PromotionForm
        action={createPromotionAction}
        courses={courses}
        submitLabel="Crear promocion"
      />
    </Card>
  );
}
