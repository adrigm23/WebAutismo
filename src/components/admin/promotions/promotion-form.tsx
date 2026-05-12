import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getPromotionDiscountSummary,
  getPromotionScopeLabel
} from "@/lib/admin-console";
import type { PromotionCourseOption, PromotionFormValues } from "./types";

export function PromotionForm({
  action,
  courses,
  defaultValues,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  courses: PromotionCourseOption[];
  defaultValues?: PromotionFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="mt-5 space-y-4">
      {defaultValues ? <input name="promotionId" type="hidden" value={defaultValues.id} /> : null}
      <Input defaultValue={defaultValues?.code} name="code" placeholder="CODIGO2026" required />
      <Input
        defaultValue={defaultValues?.description ?? ""}
        name="description"
        placeholder="Descripcion interna"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <select
          className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
          defaultValue={defaultValues?.discountType ?? "PERCENTAGE"}
          name="discountType"
        >
          <option value="PERCENTAGE">Porcentaje</option>
          <option value="FIXED_AMOUNT">Importe fijo</option>
        </select>
        <Input
          defaultValue={defaultValues ? String(defaultValues.amountInCents) : ""}
          name="amountInCents"
          placeholder="Valor"
          required
          type="number"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <select
          className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
          defaultValue={defaultValues?.scope ?? "GLOBAL"}
          name="scope"
        >
          <option value="GLOBAL">{getPromotionScopeLabel("GLOBAL")}</option>
          <option value="COURSE">{getPromotionScopeLabel("COURSE")}</option>
        </select>
        <select
          className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
          defaultValue={defaultValues?.courseId ?? ""}
          name="courseId"
        >
          <option value="">Todos los cursos</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          defaultValue={
            defaultValues?.validFrom
              ? new Date(defaultValues.validFrom).toISOString().slice(0, 16)
              : ""
          }
          name="validFrom"
          type="datetime-local"
        />
        <Input
          defaultValue={
            defaultValues?.validUntil
              ? new Date(defaultValues.validUntil).toISOString().slice(0, 16)
              : ""
          }
          name="validUntil"
          type="datetime-local"
        />
      </div>
      <Input
        defaultValue={defaultValues?.usageLimit ? String(defaultValues.usageLimit) : ""}
        name="usageLimit"
        placeholder="Limite de usos opcional"
        type="number"
      />
      {defaultValues &&
      defaultValues.usageLimit !== null &&
      defaultValues._count.redemptions > defaultValues.usageLimit ? (
        <div className="rounded-[1.2rem] border border-[#f3b8b2] bg-[#fff0ee] px-4 py-4 text-sm leading-7 text-[#b13b2f]">
          El limite es menor que los usos ya consumidos. La promocion quedara agotada de inmediato.
        </div>
      ) : null}
      {defaultValues ? (
        <div className="rounded-[1.2rem] border border-[#d9e1e8] bg-[#fbfcfd] px-4 py-4 text-sm leading-7 text-[#44586d]">
          <strong>Descuento actual:</strong>{" "}
          {getPromotionDiscountSummary({
            discountType: defaultValues.discountType,
            amountInCents: defaultValues.amountInCents
          })}
        </div>
      ) : null}
      <SubmitButton className="w-full" pendingLabel="Guardando promocion...">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
