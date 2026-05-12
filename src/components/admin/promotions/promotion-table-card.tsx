import Link from "next/link";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { getPromotionDiscountSummary } from "@/lib/admin-console";
import { formatDate } from "@/lib/utils";
import type { PromotionVisualState } from "./types";

type PromotionRow = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  amountInCents: number;
  scope: "GLOBAL" | "COURSE";
  validUntil: Date | null;
  usageLimit: number | null;
  courseTitle: string | null;
  redemptionCount: number;
  visualState: PromotionVisualState;
};

export function PromotionTableCard({
  q,
  status,
  promotions
}: {
  q: string;
  status: string;
  promotions: PromotionRow[];
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem]">
      <div className="border-b border-[#dde4ec] px-7 py-6">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <Input defaultValue={q} name="q" placeholder="Buscar cupones..." />
          <select
            className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
            defaultValue={status}
            name="status"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activas</option>
            <option value="EXPIRED">Caducadas</option>
            <option value="EXHAUSTED">Agotadas</option>
            <option value="INACTIVE">Desactivadas</option>
          </select>
          <SubmitButton pendingLabel="Aplicando..." variant="secondary">
            Aplicar
          </SubmitButton>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-[#dde4ec] text-sm uppercase tracking-[0.16em] text-[#3b4f64]">
              <th className="px-7 py-4">Codigo</th>
              <th className="px-4 py-4">Descuento</th>
              <th className="px-4 py-4">Ambito</th>
              <th className="px-4 py-4">Uso</th>
              <th className="px-7 py-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e7ee]">
            {promotions.map((promotion) => (
              <tr key={promotion.id}>
                <td className="px-7 py-5">
                  <Link href={`/admin/promotions?promotionId=${promotion.id}`}>
                    <span className="block text-[1.18rem] font-semibold text-[var(--color-ink)]">
                      {promotion.code}
                    </span>
                    <span className="mt-1 block text-sm text-[#647487]">
                      {promotion.validUntil
                        ? `Hasta ${formatDate(promotion.validUntil)}`
                        : "Sin caducidad"}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-5 text-[#32465a]">
                  {getPromotionDiscountSummary({
                    discountType: promotion.discountType,
                    amountInCents: promotion.amountInCents
                  })}
                </td>
                <td className="px-4 py-5 text-[#32465a]">
                  {promotion.scope === "GLOBAL"
                    ? "Global"
                    : promotion.courseTitle ?? "Curso especifico"}
                </td>
                <td className="px-4 py-5 text-[#32465a]">
                  {promotion.redemptionCount}
                  {promotion.usageLimit ? ` / ${promotion.usageLimit}` : " / ilimitado"}
                </td>
                <td className="px-7 py-5">
                  <AdminStatusBadge tone={promotion.visualState.tone}>
                    {promotion.visualState.label}
                  </AdminStatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
