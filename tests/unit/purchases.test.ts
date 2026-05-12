import { validateStripeCheckoutSessionAgainstPurchase } from "@/lib/purchases";

describe("purchase session validation", () => {
  test("accepts a paid stripe session that matches the stored purchase", () => {
    const result = validateStripeCheckoutSessionAgainstPurchase({
      purchase: {
        totalInCents: 9680,
        stripeCheckoutSessionId: "cs_test_ok",
        userId: "user-1"
      },
      session: {
        amount_total: 9680,
        currency: "eur",
        id: "cs_test_ok",
        metadata: {
          userId: "user-1"
        },
        payment_status: "paid"
      }
    });

    expect(result).toEqual({ ok: true });
  });

  test("rejects a session with a mismatched total", () => {
    const result = validateStripeCheckoutSessionAgainstPurchase({
      purchase: {
        totalInCents: 9680,
        stripeCheckoutSessionId: "cs_test_ok",
        userId: "user-1"
      },
      session: {
        amount_total: 9500,
        currency: "eur",
        id: "cs_test_ok",
        metadata: {
          userId: "user-1"
        },
        payment_status: "paid"
      }
    });

    expect(result).toEqual({
      ok: false,
      reason: "Stripe session amount does not match the stored purchase total."
    });
  });

  test("rejects a session for a different user", () => {
    const result = validateStripeCheckoutSessionAgainstPurchase({
      purchase: {
        totalInCents: 9680,
        stripeCheckoutSessionId: "cs_test_ok",
        userId: "user-1"
      },
      session: {
        amount_total: 9680,
        currency: "eur",
        id: "cs_test_ok",
        metadata: {
          userId: "user-2"
        },
        payment_status: "paid"
      }
    });

    expect(result).toEqual({
      ok: false,
      reason: "Stripe session metadata user does not match the stored purchase."
    });
  });
});
