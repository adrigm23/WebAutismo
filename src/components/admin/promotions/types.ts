import type { PromotionDiscountType } from "@prisma/client";

export type PromotionVisualState = {
  label: "Activa" | "Caducada" | "Agotada" | "Desactivada";
  tone: "primary" | "danger" | "warning" | "neutral";
};

export type PromotionCourseOption = {
  id: string;
  title: string;
};

export type PromotionFormValues = {
  id: string;
  code: string;
  description: string | null;
  isActive: boolean;
  discountType: PromotionDiscountType;
  amountInCents: number;
  scope: "GLOBAL" | "COURSE";
  courseId: string | null;
  courseTitle?: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  usageLimit: number | null;
  _count: {
    redemptions: number;
  };
};
