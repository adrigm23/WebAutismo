"use client";

import { useActionState } from "react";
import { startPurchaseAction, type PurchaseFormState } from "@/actions/purchase";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: PurchaseFormState = {};

type PurchaseFormProps = {
  courseSlug: string;
  courseEditionId?: string | null;
  buttonLabel?: string;
  pendingLabel?: string;
  buttonVariant?: "primary" | "secondary" | "ghost" | "accent";
};

export function PurchaseForm({
  courseSlug,
  courseEditionId,
  buttonLabel = "Comprar curso",
  pendingLabel = "Preparando compra...",
  buttonVariant = "primary"
}: PurchaseFormProps) {
  const [state, action] = useActionState(startPurchaseAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input name="courseEditionId" type="hidden" value={courseEditionId ?? ""} />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Codigo promocional</span>
        <Input name="promotionCode" placeholder="Ej. PRIMAVERA10" />
      </label>
      {state.error ? (
        <p className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
          {state.error}
        </p>
      ) : null}
      <SubmitButton className="w-full" pendingLabel={pendingLabel} variant={buttonVariant}>
        {buttonLabel}
      </SubmitButton>
    </form>
  );
}
