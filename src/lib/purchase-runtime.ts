import { isDevelopmentDemoPurchaseEnabled, isProductionRuntime } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export type PurchaseRuntimeMode = "live" | "demo" | "disabled";

export function getPurchaseRuntimeMode(): PurchaseRuntimeMode {
  if (getStripe()) {
    return "live";
  }

  if (isProductionRuntime()) {
    return "disabled";
  }

  return isDevelopmentDemoPurchaseEnabled() ? "demo" : "disabled";
}

export function isPurchaseLiveMode() {
  return getPurchaseRuntimeMode() === "live";
}
