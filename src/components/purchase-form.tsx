"use client";

import { useActionState } from "react";
import {
  startPurchaseAction,
  type PurchaseFormState,
} from "@/actions/purchase";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StateBanner } from "@/components/ui/state-banner";
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
  buttonVariant = "primary",
}: PurchaseFormProps) {
  const [state, action] = useActionState(startPurchaseAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input
        name="courseEditionId"
        type="hidden"
        value={courseEditionId ?? ""}
      />

      <FormField
        description="Si tienes un codigo institucional o promocional, puedes aplicarlo antes de pasar al pago."
        htmlFor="promotion-code"
        label="Codigo promocional"
      >
        <Input
          id="promotion-code"
          name="promotionCode"
          placeholder="Ej. PRIMAVERA10"
        />
      </FormField>

      {state.error ? (
        <StateBanner description={state.error} tone="danger" />
      ) : null}

      <SubmitButton
        className="w-full"
        pendingLabel={pendingLabel}
        variant={buttonVariant}
      >
        {buttonLabel}
      </SubmitButton>
    </form>
  );
}
