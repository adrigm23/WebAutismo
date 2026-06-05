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
    <Card className="min-w-0 overflow-hidden rounded-xl">
      <div className="border-b border-[var(--color-border)] px-7 py-6">
        <form className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <Input defaultValue={q} name="q" placeholder="Buscar cupones..." />
          <select
            className="h-12 min-w-0 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm"
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

      <div className="grid gap-4 p-4 md:hidden">
        {promotions.map((promotion) => (
          <Card className="rounded-xl p-5" key={promotion.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                  href={`/admin/promotions?promotionId=${promotion.id}`}
                >
                  <span className="block text-[1.18rem] font-semibold text-[var(--color-ink)]">
                    {promotion.code}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">
                    {promotion.validUntil
                      ? `Hasta ${formatDate(promotion.validUntil)}`
                      : "Sin caducidad"}
                  </span>
                </Link>
              </div>
              <AdminStatusBadge tone={promotion.visualState.tone}>
                {promotion.visualState.label}
              </AdminStatusBadge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-ink)]">
              <div>
                <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
                  Descuento
                </p>
                <p className="mt-1.5">
                  {getPromotionDiscountSummary({
                    discountType: promotion.discountType,
                    amountInCents: promotion.amountInCents
                  })}
                </p>
              </div>
              <div>
                <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
                  Uso
                </p>
                <p className="mt-1.5">
                  {promotion.redemptionCount}
                  {promotion.usageLimit ? ` / ${promotion.usageLimit}` : " / ilimitado"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[var(--radius-md)] bg-[color:var(--color-bg-subtle)] px-4 py-3 text-sm text-[var(--color-ink)]">
              <p className="text-meta-xs font-semibold text-[var(--color-ink-soft)]">
                Ambito
              </p>
              <p className="mt-1.5 break-words">
                {promotion.scope === "GLOBAL"
                  ? "Global"
                  : promotion.courseTitle ?? "Curso especifico"}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="hidden max-w-full overflow-x-auto md:block">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-sm uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
              <th className="px-7 py-4">Codigo</th>
              <th className="px-4 py-4">Descuento</th>
              <th className="px-4 py-4">Ambito</th>
              <th className="px-4 py-4">Uso</th>
              <th className="px-7 py-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {promotions.map((promotion) => (
              <tr key={promotion.id}>
                <td className="px-7 py-5">
                  <Link href={`/admin/promotions?promotionId=${promotion.id}`}>
                    <span className="block text-[1.18rem] font-semibold text-[var(--color-ink)]">
                      {promotion.code}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">
                      {promotion.validUntil
                        ? `Hasta ${formatDate(promotion.validUntil)}`
                        : "Sin caducidad"}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-5 text-[var(--color-ink)]">
                  {getPromotionDiscountSummary({
                    discountType: promotion.discountType,
                    amountInCents: promotion.amountInCents
                  })}
                </td>
                <td className="px-4 py-5 text-[var(--color-ink)]">
                  {promotion.scope === "GLOBAL"
                    ? "Global"
                    : promotion.courseTitle ?? "Curso especifico"}
                </td>
                <td className="px-4 py-5 text-[var(--color-ink)]">
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
