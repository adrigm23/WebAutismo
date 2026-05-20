const headersMock = vi.fn();
const findPurchaseMock = vi.fn();
const grantCourseAccessMock = vi.fn();
const markPurchaseFailedByStripeSessionIdMock = vi.fn();
const validateStripeCheckoutSessionAgainstPurchaseMock = vi.fn();
const getStripeMock = vi.fn();
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
  getStripe: getStripeMock
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
      record: {
        status: "PROCESSING"
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
      status: "REJECTED"
    });
  });
});
