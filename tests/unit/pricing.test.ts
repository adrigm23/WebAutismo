import { calculatePurchaseAmounts, TAX_RATE } from "@/lib/promotions";

// Training courses are VAT-exempt: the amount charged must be exactly the
// course price (minus any discount), never price + VAT.
describe("purchase pricing", () => {
  test("does not add VAT to the course price", () => {
    expect(TAX_RATE).toBe(0);
    expect(calculatePurchaseAmounts({ subtotalInCents: 8000 })).toMatchObject({
      subtotalInCents: 8000,
      taxInCents: 0,
      totalInCents: 8000
    });
  });

  test("charges the discounted price with no VAT on top", () => {
    expect(
      calculatePurchaseAmounts({
        subtotalInCents: 8000,
        promotion: { discountType: "PERCENTAGE", amountInCents: 25 }
      })
    ).toMatchObject({ discountInCents: 2000, taxInCents: 0, totalInCents: 6000 });
  });
});
