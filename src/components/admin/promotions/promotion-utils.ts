import type { PromotionVisualState } from "./types";

export function resolvePromotionVisualState(input: {
  isActive: boolean;
  validUntil: Date | null;
  usageLimit: number | null;
  redemptionCount: number;
}): PromotionVisualState {
  const now = Date.now();

  if (!input.isActive) {
    return { label: "Desactivada", tone: "neutral" };
  }

  if (input.validUntil && input.validUntil.getTime() < now) {
    return { label: "Caducada", tone: "danger" };
  }

  if (input.usageLimit !== null && input.redemptionCount >= input.usageLimit) {
    return { label: "Agotada", tone: "warning" };
  }

  return { label: "Activa", tone: "primary" };
}
