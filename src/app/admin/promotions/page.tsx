import { Gift, TrendingUp, Tickets } from "lucide-react";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CreatePromotionCard } from "@/components/admin/promotions/create-promotion-card";
import { DemoPromotionDetailCard } from "@/components/admin/promotions/demo-promotion-detail-card";
import { PromotionDetailCard } from "@/components/admin/promotions/promotion-detail-card";
import { PromotionTableCard } from "@/components/admin/promotions/promotion-table-card";
import { resolvePromotionVisualState } from "@/components/admin/promotions/promotion-utils";
import type {
  PromotionCourseOption,
  PromotionFormValues
} from "@/components/admin/promotions/types";
import { ButtonLink } from "@/components/ui/button";
import {
  getSearchParamValue
} from "@/lib/admin-console";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { demoAdminPromotions } from "@/lib/admin-demo";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type PromotionsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    promotionId?: string | string[];
    create?: string | string[];
  }>;
};

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
    const demoPromotionRows = visiblePromotions.map((promotion) => ({
      id: promotion.id,
      code: promotion.code,
      discountType: promotion.discountType,
      amountInCents: promotion.amountInCents,
      scope: promotion.scope,
      validUntil: promotion.validUntil,
      usageLimit: promotion.usageLimit,
      courseTitle: promotion.courseTitle ?? null,
      redemptionCount: promotion.redemptionCount,
      visualState: resolvePromotionVisualState({
        isActive: promotion.isActive,
        validUntil: promotion.validUntil,
        usageLimit: promotion.usageLimit,
        redemptionCount: promotion.redemptionCount
      })
    }));
    const selectedDemoPromotionDetails = selectedDemoPromotion
      ? {
          id: selectedDemoPromotion.id,
          code: selectedDemoPromotion.code,
          description: selectedDemoPromotion.description,
          isActive: selectedDemoPromotion.isActive,
          discountType: selectedDemoPromotion.discountType,
          amountInCents: selectedDemoPromotion.amountInCents,
          scope: selectedDemoPromotion.scope,
          courseId: null,
          courseTitle: selectedDemoPromotion.courseTitle ?? null,
          validFrom: selectedDemoPromotion.validFrom,
          validUntil: selectedDemoPromotion.validUntil,
          usageLimit: selectedDemoPromotion.usageLimit,
          _count: {
            redemptions: selectedDemoPromotion.redemptionCount
          }
        }
      : null;

    return (
      <div className="space-y-9 overflow-x-hidden">
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
          <PromotionTableCard promotions={demoPromotionRows} q={q} status={status} />
          {selectedDemoPromotionDetails ? (
            <DemoPromotionDetailCard promotion={selectedDemoPromotionDetails} />
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
  const courseOptions: PromotionCourseOption[] = courses;
  const promotionRows = visiblePromotions.map((promotion) => ({
    id: promotion.id,
    code: promotion.code,
    discountType: promotion.discountType,
    amountInCents: promotion.amountInCents,
    scope: promotion.scope,
    validUntil: promotion.validUntil,
    usageLimit: promotion.usageLimit,
    courseTitle: promotion.course?.title ?? null,
    redemptionCount: promotion._count.redemptions,
    visualState: resolvePromotionVisualState({
      isActive: promotion.isActive,
      validUntil: promotion.validUntil,
      usageLimit: promotion.usageLimit,
      redemptionCount: promotion._count.redemptions
    })
  }));
  const selectedPromotionDetails: PromotionFormValues | null = selectedPromotion
    ? {
        id: selectedPromotion.id,
        code: selectedPromotion.code,
        description: selectedPromotion.description,
        isActive: selectedPromotion.isActive,
        discountType: selectedPromotion.discountType,
        amountInCents: selectedPromotion.amountInCents,
        scope: selectedPromotion.scope,
        courseId: selectedPromotion.courseId,
        courseTitle: selectedPromotion.course?.title ?? null,
        validFrom: selectedPromotion.validFrom,
        validUntil: selectedPromotion.validUntil,
        usageLimit: selectedPromotion.usageLimit,
        _count: selectedPromotion._count
      }
    : null;

  return (
    <div className="space-y-9 overflow-x-hidden">
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

      <section className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.88fr)]">
        <PromotionTableCard promotions={promotionRows} q={q} status={status} />

        <div className="min-w-0 space-y-6">
          {create === "1" || promotions.length === 0 ? (
            <CreatePromotionCard courses={courseOptions} />
          ) : null}

          {selectedPromotionDetails ? (
            <PromotionDetailCard courses={courseOptions} promotion={selectedPromotionDetails} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
