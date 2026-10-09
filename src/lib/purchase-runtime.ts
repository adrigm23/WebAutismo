import { isDevelopmentDemoPurchaseEnabled, isProductionRuntime } from "@/lib/env";
import { getRedsysRuntimeState } from "@/lib/redsys";
import { getStripeRuntimeState } from "@/lib/stripe";

export type PurchaseRuntimeMode = "live" | "demo" | "disabled";

export type PaymentProvider = "redsys" | "stripe";

/**
 * The gateway that takes live payments. Redsys (CaixaBank's TPV) takes
 * precedence: once any Redsys setting is present Stripe is no longer used,
 * even if its keys are still configured.
 */
export function getActivePaymentProvider(): PaymentProvider | null {
  const redsysState = getRedsysRuntimeState();

  if (redsysState.mode !== "disabled") {
    return redsysState.mode === "live" ? "redsys" : null;
  }

  return getStripeRuntimeState().mode === "live" ? "stripe" : null;
}

export function getPurchaseRuntimeMode(): PurchaseRuntimeMode {
  const redsysState = getRedsysRuntimeState();

  if (redsysState.mode === "live") {
    return "live";
  }

  if (redsysState.mode === "misconfigured") {
    return "disabled";
  }

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
