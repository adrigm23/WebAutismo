const headersMock = vi.fn();
const findPurchaseMock = vi.fn();
const grantCourseAccessMock = vi.fn();
const markPurchaseFailedByStripeSessionIdMock = vi.fn();
const validateStripeCheckoutSessionAgainstPurchaseMock = vi.fn();
const getStripeMock = vi.fn();
const getStripeRuntimeStateMock = vi.fn();
const beginPaymentWebhookEventProcessingMock = vi.fn();
const finishPaymentWebhookEventProcessingMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock
}));

vi.mock("@/lib/prisma", () => ({
  getDb: () => ({
    purchase: {
      findUnique: findPurchaseMock
    }
  })
}));

vi.mock("@/lib/purchases", () => ({
  grantCourseAccess: grantCourseAccessMock,
  markPurchaseFailedByStripeSessionId: markPurchaseFailedByStripeSessionIdMock,
  validateStripeCheckoutSessionAgainstPurchase:
    validateStripeCheckoutSessionAgainstPurchaseMock
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: getStripeMock,
  getStripeRuntimeState: getStripeRuntimeStateMock
}));

vi.mock("@/lib/payment-webhook-events", () => ({
  beginPaymentWebhookEventProcessing: beginPaymentWebhookEventProcessingMock,
  finishPaymentWebhookEventProcessing: finishPaymentWebhookEventProcessingMock
}));

describe("stripe webhook route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_WEBHOOK_SECRET: "whsec_test"
    };
    getStripeRuntimeStateMock.mockReturnValue({
      mode: "live",
      hasSecretKey: true,
      hasWebhookSecret: true,
      reason: null,
      secretKey: "sk_test",
      webhookSecret: "whsec_test"
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("rejects a webhook when the stored purchase does not match the stripe session", async () => {
    headersMock.mockResolvedValue(
      new Headers({
        "stripe-signature": "sig_test"
      })
    );

    const stripeSession = {
      id: "cs_test_1",
      metadata: {
        purchaseId: "purchase-1",
        userId: "user-1",
        courseSlug: "curso-demo"
      },
      payment_intent: "pi_test_1"
    };

    const stripe = {
      webhooks: {
        constructEvent: vi.fn(() => ({
          id: "evt_test_1",
          type: "checkout.session.completed",
          data: {
            object: stripeSession
          }
        }))
      }
    };

    getStripeMock.mockReturnValue(stripe);
    beginPaymentWebhookEventProcessingMock.mockResolvedValue({
      duplicate: false,
      exhausted: false,
      resumed: false,
      record: {
        status: "PROCESSING",
        attemptCount: 1
      }
    });

    findPurchaseMock.mockResolvedValue({
      id: "purchase-1",
      userId: "user-1",
      totalInCents: 9680,
      stripeCheckoutSessionId: "cs_test_1"
    });
    validateStripeCheckoutSessionAgainstPurchaseMock.mockReturnValue({
      ok: false,
      reason: "Stripe session amount does not match the stored purchase total."
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}"
      })
    );

    expect(response.status).toBe(400);
    expect(markPurchaseFailedByStripeSessionIdMock).toHaveBeenCalledWith("cs_test_1");
    expect(grantCourseAccessMock).not.toHaveBeenCalled();
    expect(finishPaymentWebhookEventProcessingMock).toHaveBeenCalledWith({
      stripeEventId: "evt_test_1",
      status: "REJECTED",
      lastError: "Stripe session amount does not match the stored purchase total."
    });
  });

  test("blocks the webhook when Stripe is misconfigured", async () => {
    headersMock.mockResolvedValue(new Headers());
    getStripeMock.mockReturnValue(null);
    getStripeRuntimeStateMock.mockReturnValue({
      mode: "misconfigured",
      hasSecretKey: true,
      hasWebhookSecret: false,
      reason: "missing-webhook-secret"
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}"
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error:
        "Stripe webhook is blocked because STRIPE_SECRET_KEY is configured without STRIPE_WEBHOOK_SECRET."
    });
    expect(beginPaymentWebhookEventProcessingMock).not.toHaveBeenCalled();
  });

  test("ignores a duplicate webhook replay without granting access twice", async () => {
    headersMock.mockResolvedValue(
      new Headers({
        "stripe-signature": "sig_test"
      })
    );
    getStripeMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => ({
          id: "evt_duplicate",
          type: "checkout.session.completed",
          data: {
            object: {
              id: "cs_duplicate",
              metadata: {
                purchaseId: "purchase-1",
                userId: "user-1",
                courseSlug: "curso-demo"
              }
            }
          }
        }))
      }
    });
    beginPaymentWebhookEventProcessingMock.mockResolvedValue({
      duplicate: true,
      exhausted: false,
      resumed: false,
      record: {
        status: "PROCESSED",
        attemptCount: 1
      }
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}"
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
      duplicate: true
    });
    expect(grantCourseAccessMock).not.toHaveBeenCalled();
  });
});
