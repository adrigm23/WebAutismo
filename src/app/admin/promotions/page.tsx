import Link from "next/link";
import { Gift, TrendingUp, Tickets } from "lucide-react";
import {
  createPromotionAction,
  togglePromotionAction,
  updatePromotionAction
} from "@/actions/admin";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getPromotionDiscountSummary,
  getPromotionScopeLabel,
  getSearchParamValue
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { demoAdminPromotions } from "@/lib/admin-demo";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";

type PromotionsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    promotionId?: string | string[];
    create?: string | string[];
  }>;
};

function resolvePromotionVisualState(input: {
  isActive: boolean;
  validUntil: Date | null;
  usageLimit: number | null;
  redemptionCount: number;
}) {
  const now = Date.now();

  if (!input.isActive) {
    return { label: "Desactivada", tone: "neutral" as const };
  }

  if (input.validUntil && input.validUntil.getTime() < now) {
    return { label: "Caducada", tone: "danger" as const };
  }

  if (input.usageLimit !== null && input.redemptionCount >= input.usageLimit) {
    return { label: "Agotada", tone: "warning" as const };
  }

  return { label: "Activa", tone: "primary" as const };
}

export default async function AdminPromotionsPage({ searchParams }: PromotionsPageProps) {
  const currentUser = await requireAdminConsoleUser("/admin/promotions");
  const params = await searchParams;
  const q = getSearchParamValue(params.q);
  const status = getSearchParamValue(params.status, "ALL");
  const promotionId = getSearchParamValue(params.promotionId);
  const create = getSearchParamValue(params.create);

  if (isDemoUserId(currentUser.id)) {
    const visiblePromotions = demoAdminPromotions.filter((promotion) => {
      const matchesQ =
        !q ||
        promotion.code.toLowerCase().includes(q.toLowerCase()) ||
        (promotion.description?.toLowerCase().includes(q.toLowerCase()) ?? false) ||
        (promotion.courseTitle?.toLowerCase().includes(q.toLowerCase()) ?? false);
      if (!matchesQ) return false;
      if (status === "ALL") return true;
      const visualState = resolvePromotionVisualState({
        isActive: promotion.isActive,
        validUntil: promotion.validUntil,
        usageLimit: promotion.usageLimit,
        redemptionCount: promotion.redemptionCount
      });
      if (status === "ACTIVE") return visualState.label === "Activa";
      if (status === "EXPIRED") return visualState.label === "Caducada";
      if (status === "EXHAUSTED") return visualState.label === "Agotada";
      if (status === "INACTIVE") return visualState.label === "Desactivada";
      return true;
    });
    const selectedDemoPromotion =
      visiblePromotions.find((promotion) => promotion.id === promotionId) ?? visiblePromotions[0] ?? null;

    return (
      <div className="space-y-9">
        <AdminPageHeader
          actions={<ButtonLink href="/admin/courses" variant="secondary">Volver a cursos</ButtonLink>}
          description="Promociones demo para revisar tabla, estados y detalle lateral sin persistencia real."
          title="Promociones"
        />
        <section className="grid gap-5 xl:grid-cols-3">
          <AdminMetricCard accent="primary" icon={<Tickets className="h-6 w-6" strokeWidth={1.8} />} label="Promociones activas" meta="Checkout demo" value={demoAdminPromotions.filter((promotion) => promotion.isActive).length} />
          <AdminMetricCard accent="warning" icon={<TrendingUp className="h-6 w-6" strokeWidth={1.8} />} label="Usos este mes" meta="Canjes simulados" value={73} />
          <AdminMetricCard accent="neutral" icon={<Gift className="h-6 w-6" strokeWidth={1.8} />} label="Ahorro generado" meta="Importe acumulado demo" value={formatPrice(152000)} />
        </section>
        <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.88fr]">
          <Card className="overflow-hidden rounded-[2rem]">
            <div className="border-b border-[#dde4ec] px-7 py-6">
              <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                <Input defaultValue={q} name="q" placeholder="Buscar cupones..." />
                <select className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm" defaultValue={status} name="status">
                  <option value="ALL">Todos los estados</option>
                  <option value="ACTIVE">Activas</option>
                  <option value="EXPIRED">Caducadas</option>
                  <option value="EXHAUSTED">Agotadas</option>
                  <option value="INACTIVE">Desactivadas</option>
                </select>
                <SubmitButton pendingLabel="Aplicando..." variant="secondary">Aplicar</SubmitButton>
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
                  {visiblePromotions.map((promotion) => {
                    const visualState = resolvePromotionVisualState({
                      isActive: promotion.isActive,
                      validUntil: promotion.validUntil,
                      usageLimit: promotion.usageLimit,
                      redemptionCount: promotion.redemptionCount
                    });

                    return (
                      <tr key={promotion.id}>
                        <td className="px-7 py-5">
                          <Link href={`/admin/promotions?promotionId=${promotion.id}`}>
                            <span className="block text-[1.18rem] font-semibold text-[var(--color-ink)]">{promotion.code}</span>
                            <span className="mt-1 block text-sm text-[#647487]">
                              {promotion.validUntil ? `Hasta ${formatDate(promotion.validUntil)}` : "Sin caducidad"}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-5 text-[#32465a]">
                          {getPromotionDiscountSummary({
                            discountType: promotion.discountType as never,
                            amountInCents: promotion.amountInCents
                          })}
                        </td>
                        <td className="px-4 py-5 text-[#32465a]">{promotion.scope === "GLOBAL" ? "Global" : promotion.courseTitle ?? "Curso especifico"}</td>
                        <td className="px-4 py-5 text-[#32465a]">{promotion.redemptionCount}{promotion.usageLimit ? ` / ${promotion.usageLimit}` : " / ilimitado"}</td>
                        <td className="px-7 py-5"><AdminStatusBadge tone={visualState.tone}>{visualState.label}</AdminStatusBadge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          {selectedDemoPromotion ? (
            <Card className="rounded-[2rem] p-7">
              <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">Detalle de promocion</h2>
              <p className="mt-2 text-sm leading-7 text-[#56697d]">{selectedDemoPromotion.description}</p>
              <div className="mt-5 space-y-4 rounded-[1.4rem] border border-[#d9e1e8] bg-[#fbfcfd] p-5 text-sm leading-7 text-[#44586d]">
                <div><strong>Codigo:</strong> {selectedDemoPromotion.code}</div>
                <div><strong>Descuento:</strong> {getPromotionDiscountSummary({ discountType: selectedDemoPromotion.discountType as never, amountInCents: selectedDemoPromotion.amountInCents })}</div>
                <div><strong>Ambito:</strong> {selectedDemoPromotion.scope === "GLOBAL" ? "Global" : selectedDemoPromotion.courseTitle}</div>
                <div><strong>Validez:</strong> {selectedDemoPromotion.validFrom ? formatDate(selectedDemoPromotion.validFrom) : "Sin inicio"} - {selectedDemoPromotion.validUntil ? formatDate(selectedDemoPromotion.validUntil) : "Sin caducidad"}</div>
              </div>
            </Card>
          ) : null}
        </section>
      </div>
    );
  }

  const db = getDb();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const yearStart = new Date(monthStart.getFullYear(), 0, 1);

  const [promotions, courses, usageThisMonth, savingsThisYear] = await Promise.all([
    db.promotion.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { code: { contains: q } },
                { description: { contains: q } },
                {
                  course: {
                    title: {
                      contains: q
                    }
                  }
                }
              ]
            }
          : {})
      },
      include: {
        course: {
          select: {
            title: true
          }
        },
        _count: {
          select: {
            redemptions: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    db.course.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        id: true,
        title: true
      },
      orderBy: {
        title: "asc"
      }
    }),
    db.promotionRedemption.aggregate({
      where: {
        createdAt: {
          gte: monthStart
        }
      },
      _count: {
        id: true
      }
    }),
    db.promotionRedemption.aggregate({
      where: {
        createdAt: {
          gte: yearStart
        }
      },
      _sum: {
        discountInCents: true
      }
    })
  ]);

  const visiblePromotions = promotions.filter((promotion) => {
    if (status === "ALL") {
      return true;
    }

    const visualState = resolvePromotionVisualState({
      isActive: promotion.isActive,
      validUntil: promotion.validUntil,
      usageLimit: promotion.usageLimit,
      redemptionCount: promotion._count.redemptions
    });

    if (status === "ACTIVE") {
      return visualState.label === "Activa";
    }

    if (status === "EXPIRED") {
      return visualState.label === "Caducada";
    }

    if (status === "EXHAUSTED") {
      return visualState.label === "Agotada";
    }

    if (status === "INACTIVE") {
      return visualState.label === "Desactivada";
    }

    return true;
  });

  const selectedPromotion =
    visiblePromotions.find((promotion) => promotion.id === promotionId) ??
    visiblePromotions[0] ??
    null;

  return (
    <div className="space-y-9">
      <AdminPageHeader
        actions={<ButtonLink href="/admin/promotions?create=1#create-promotion">Crear cupon</ButtonLink>}
        description="Gestiona codigos promocionales, ambito global o por curso y consumo real sobre compras del campus."
        title="Promociones"
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <AdminMetricCard
          accent="primary"
          icon={<Tickets className="h-6 w-6" strokeWidth={1.8} />}
          label="Promociones activas"
          meta="Disponibles para checkout"
          value={
            promotions.filter(
              (promotion) =>
                resolvePromotionVisualState({
                  isActive: promotion.isActive,
                  validUntil: promotion.validUntil,
                  usageLimit: promotion.usageLimit,
                  redemptionCount: promotion._count.redemptions
                }).label === "Activa"
            ).length
          }
        />
        <AdminMetricCard
          accent="warning"
          icon={<TrendingUp className="h-6 w-6" strokeWidth={1.8} />}
          label="Usos este mes"
          meta="Canjes registrados"
          value={usageThisMonth._count.id}
        />
        <AdminMetricCard
          accent="neutral"
          icon={<Gift className="h-6 w-6" strokeWidth={1.8} />}
          label="Ahorro generado"
          meta="Importe descontado acumulado"
          value={formatPrice(savingsThisYear._sum.discountInCents ?? 0)}
        />
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.88fr]">
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
                {visiblePromotions.map((promotion) => {
                  const visualState = resolvePromotionVisualState({
                    isActive: promotion.isActive,
                    validUntil: promotion.validUntil,
                    usageLimit: promotion.usageLimit,
                    redemptionCount: promotion._count.redemptions
                  });

                  return (
                    <tr key={promotion.id}>
                      <td className="px-7 py-5">
                        <Link href={`/admin/promotions?promotionId=${promotion.id}`}>
                          <span className="block text-[1.18rem] font-semibold text-[var(--color-ink)]">
                            {promotion.code}
                          </span>
                          <span className="mt-1 block text-sm text-[#647487]">
                            {promotion.validUntil ? `Hasta ${formatDate(promotion.validUntil)}` : "Sin caducidad"}
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
                          : promotion.course?.title ?? "Curso especifico"}
                      </td>
                      <td className="px-4 py-5 text-[#32465a]">
                        {promotion._count.redemptions}
                        {promotion.usageLimit ? ` / ${promotion.usageLimit}` : " / ilimitado"}
                      </td>
                      <td className="px-7 py-5">
                        <AdminStatusBadge tone={visualState.tone}>{visualState.label}</AdminStatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          {(create === "1" || promotions.length === 0) ? (
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
          ) : null}

          {selectedPromotion ? (
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
                  <input name="promotionId" type="hidden" value={selectedPromotion.id} />
                  <input
                    name="isActive"
                    type="hidden"
                    value={selectedPromotion.isActive ? "false" : "true"}
                  />
                  <SubmitButton
                    pendingLabel="Actualizando..."
                    variant={selectedPromotion.isActive ? "ghost" : "secondary"}
                  >
                    {selectedPromotion.isActive ? "Desactivar" : "Activar"}
                  </SubmitButton>
                </form>
              </div>

              <PromotionForm
                action={updatePromotionAction}
                courses={courses}
                defaultValues={selectedPromotion}
                submitLabel="Guardar cambios"
              />
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function PromotionForm({
  action,
  courses,
  defaultValues,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  courses: Array<{ id: string; title: string }>;
  defaultValues?: {
    id: string;
    code: string;
    description: string | null;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    amountInCents: number;
    scope: "GLOBAL" | "COURSE";
    courseId: string | null;
    validFrom: Date | null;
    validUntil: Date | null;
    usageLimit: number | null;
    _count: {
      redemptions: number;
    };
  };
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
          defaultValue={defaultValues?.validFrom ? new Date(defaultValues.validFrom).toISOString().slice(0, 16) : ""}
          name="validFrom"
          type="datetime-local"
        />
        <Input
          defaultValue={defaultValues?.validUntil ? new Date(defaultValues.validUntil).toISOString().slice(0, 16) : ""}
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
      {defaultValues && defaultValues.usageLimit !== null && defaultValues._count.redemptions > defaultValues.usageLimit ? (
        <div className="rounded-[1.2rem] border border-[#f3b8b2] bg-[#fff0ee] px-4 py-4 text-sm leading-7 text-[#b13b2f]">
          El limite es menor que los usos ya consumidos. La promocion quedara agotada de inmediato.
        </div>
      ) : null}
      <SubmitButton className="w-full" pendingLabel="Guardando promocion...">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
