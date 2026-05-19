import { isDevelopmentDemoPurchaseEnabled } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export type PurchaseRuntimeMode = "live" | "demo" | "disabled";

export function getPurchaseRuntimeMode(): PurchaseRuntimeMode {
  if (getStripe()) {
    return "live";
  }

  return isDevelopmentDemoPurchaseEnabled() ? "demo" : "disabled";
}

export function isPurchaseLiveMode() {
  return getPurchaseRuntimeMode() === "live";
}
