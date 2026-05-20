import Stripe from "stripe";

let stripeClient: Stripe | null = null;
let stripeClientSecretKey: string | null = null;

export type StripeRuntimeState =
  | {
      mode: "disabled";
      hasSecretKey: false;
      hasWebhookSecret: boolean;
      reason: "missing-secret-key";
    }
  | {
      mode: "misconfigured";
      hasSecretKey: true;
      hasWebhookSecret: false;
      reason: "missing-webhook-secret";
    }
  | {
      mode: "live";
      hasSecretKey: true;
      hasWebhookSecret: true;
      reason: null;
      secretKey: string;
      webhookSecret: string;
    };

export function getStripeRuntimeState(): StripeRuntimeState {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";

  if (!secretKey) {
    return {
      mode: "disabled",
      hasSecretKey: false,
      hasWebhookSecret: Boolean(webhookSecret),
      reason: "missing-secret-key"
    };
  }

  if (!webhookSecret) {
    return {
      mode: "misconfigured",
      hasSecretKey: true,
      hasWebhookSecret: false,
      reason: "missing-webhook-secret"
    };
  }

  return {
    mode: "live",
    hasSecretKey: true,
    hasWebhookSecret: true,
    reason: null,
    secretKey,
    webhookSecret
  };
}

export function getStripe() {
  const stripeState = getStripeRuntimeState();

  if (stripeState.mode !== "live") {
    return null;
  }

  if (!stripeClient || stripeClientSecretKey !== stripeState.secretKey) {
    stripeClient = new Stripe(stripeState.secretKey);
    stripeClientSecretKey = stripeState.secretKey;
  }

  return stripeClient;
}
