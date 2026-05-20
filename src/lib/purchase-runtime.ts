import { isDevelopmentDemoPurchaseEnabled, isProductionRuntime } from "@/lib/env";
import { getStripeRuntimeState } from "@/lib/stripe";

export type PurchaseRuntimeMode = "live" | "demo" | "disabled";

export function getPurchaseRuntimeMode(): PurchaseRuntimeMode {
  const stripeState = getStripeRuntimeState();

  if (stripeState.mode === "live") {
    return "live";
  }

  if (stripeState.mode === "misconfigured") {
    return "disabled";
  }

  if (isProductionRuntime()) {
    return "disabled";
  }

  return isDevelopmentDemoPurchaseEnabled() ? "demo" : "disabled";
}

export function isPurchaseLiveMode() {
  return getPurchaseRuntimeMode() === "live";
}
