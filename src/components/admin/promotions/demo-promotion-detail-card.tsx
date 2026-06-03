import { Card } from "@/components/ui/card";
import { getPromotionDiscountSummary } from "@/lib/admin-console";
import { formatDate } from "@/lib/utils";
import type { PromotionFormValues } from "./types";

export function DemoPromotionDetailCard({
  promotion
}: {
  promotion: PromotionFormValues;
}) {
  return (
    <Card className="rounded-xl p-7">
      <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
        Detalle de promocion
      </h2>
      <p className="mt-2 text-sm leading-7 text-[#56697d]">{promotion.description}</p>
      <div className="mt-5 space-y-4 rounded-xl border border-[#d9e1e8] bg-[#fbfcfd] p-5 text-sm leading-7 text-[#44586d]">
        <div>
          <strong>Codigo:</strong> {promotion.code}
        </div>
        <div>
          <strong>Descuento:</strong>{" "}
          {getPromotionDiscountSummary({
            discountType: promotion.discountType,
            amountInCents: promotion.amountInCents
          })}
        </div>
        <div>
          <strong>Ambito:</strong> {promotion.scope === "GLOBAL" ? "Global" : promotion.courseTitle}
        </div>
        <div>
          <strong>Validez:</strong>{" "}
          {promotion.validFrom ? formatDate(promotion.validFrom) : "Sin inicio"} -{" "}
          {promotion.validUntil ? formatDate(promotion.validUntil) : "Sin caducidad"}
        </div>
      </div>
    </Card>
  );
}
