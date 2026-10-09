import { computeRedsysSignature } from "@/lib/redsys";

const headersMock = vi.fn();
const findPurchaseMock = vi.fn();
const grantCourseAccessMock = vi.fn();
const markPurchaseFailedByRedsysOrderMock = vi.fn();
const beginPaymentWebhookEventProcessingMock = vi.fn();
const finishPaymentWebhookEventProcessingMock = vi.fn();
const captureOperationalWarningMock = vi.fn();

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

vi.mock("@/lib/purchases", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/purchases")>();

  return {
    grantCourseAccess: grantCourseAccessMock,
    markPurchaseFailedByRedsysOrder: markPurchaseFailedByRedsysOrderMock,
    validateRedsysNotificationAgainstPurchase: actual.validateRedsysNotificationAgainstPurchase
  };
});

vi.mock("@/lib/payment-webhook-events", () => ({
  beginPaymentWebhookEventProcessing: beginPaymentWebhookEventProcessingMock,
  finishPaymentWebhookEventProcessing: finishPaymentWebhookEventProcessingMock
}));

vi.mock("@/lib/monitoring", () => ({
  captureOperationalWarning: captureOperationalWarningMock
}));

// Public test credentials published by Redsys for its sis-t sandbox.
const TEST_SECRET_KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
const TEST_MERCHANT_CODE = "999008881";

function buildNotificationRequest(
  overrides: Record<string, string> = {},
  options: { signWith?: string } = {}
) {
  const parameters = {
    Ds_Amount: "9680",
    Ds_Currency: "978",
    Ds_Order: "1234ABCDEFGH",
    Ds_MerchantCode: TEST_MERCHANT_CODE,
    Ds_Terminal: "001",
    Ds_Response: "0000",
    Ds_TransactionType: "0",
    Ds_AuthorisationCode: "123456",
    Ds_MerchantData: "purchase-1",
    ...overrides
  };
  const merchantParameters = Buffer.from(JSON.stringify(parameters)).toString("base64");
  const signature = computeRedsysSignature({
    secretKey: options.signWith ?? TEST_SECRET_KEY,
    order: parameters.Ds_Order,
    merchantParameters
  })
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return new Request("http://localhost/api/redsys/notification", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      Ds_SignatureVersion: "HMAC_SHA256_V1",
      Ds_MerchantParameters: merchantParameters,
      Ds_Signature: signature
    }).toString()
  });
}

const storedPurchase = {
  id: "purchase-1",
  userId: "user-1",
  totalInCents: 9680,
  redsysOrder: "1234ABCDEFGH",
  courseEditionId: "edition-1",
  courseSlugSnapshot: "curso-demo"
};

describe("redsys notification route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      REDSYS_MERCHANT_CODE: TEST_MERCHANT_CODE,
      REDSYS_TERMINAL: "1",
      REDSYS_SECRET_KEY: TEST_SECRET_KEY,
      REDSYS_ENVIRONMENT: "test"
    };
    headersMock.mockResolvedValue(new Headers());
    beginPaymentWebhookEventProcessingMock.mockResolvedValue({
      duplicate: false,
      exhausted: false,
      resumed: false,
      record: { status: "PROCESSING", attemptCount: 1 }
    });
    findPurchaseMock.mockResolvedValue(storedPurchase);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("grants course access for an authorised payment", async () => {
    const { POST } = await import("@/app/api/redsys/notification/route");
    const response = await POST(buildNotificationRequest());

    expect(response.status).toBe(200);
    expect(beginPaymentWebhookEventProcessingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeEventId: "redsys:1234ABCDEFGH:0",
        type: "redsys.payment.authorized"
      })
    );
    expect(grantCourseAccessMock).toHaveBeenCalledWith({
      userId: "user-1",
      courseSlug: "curso-demo",
      courseEditionId: "edition-1",
      purchaseId: "purchase-1",
      grantSource: "redsys-notification",
      redsysOrder: "1234ABCDEFGH",
      redsysAuthorisationCode: "123456"
    });
    expect(finishPaymentWebhookEventProcessingMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PROCESSED" })
    );
  });

  test("rejects a notification with an invalid signature before touching the database", async () => {
    const { POST } = await import("@/app/api/redsys/notification/route");
    const response = await POST(
      buildNotificationRequest({}, { signWith: Buffer.alloc(24, 7).toString("base64") })
    );

    expect(response.status).toBe(400);
    expect(beginPaymentWebhookEventProcessingMock).not.toHaveBeenCalled();
    expect(findPurchaseMock).not.toHaveBeenCalled();
    expect(grantCourseAccessMock).not.toHaveBeenCalled();
  });

  test("marks the purchase as failed when the card is denied", async () => {
    const { POST } = await import("@/app/api/redsys/notification/route");
    const response = await POST(
      buildNotificationRequest({ Ds_Response: "0190", Ds_AuthorisationCode: "" })
    );

    expect(response.status).toBe(200);
    expect(markPurchaseFailedByRedsysOrderMock).toHaveBeenCalledWith("1234ABCDEFGH");
    expect(grantCourseAccessMock).not.toHaveBeenCalled();
  });

  test("does not grant access when the authorised amount differs from the purchase", async () => {
    const { POST } = await import("@/app/api/redsys/notification/route");
    const response = await POST(buildNotificationRequest({ Ds_Amount: "100" }));

    expect(response.status).toBe(400);
    expect(grantCourseAccessMock).not.toHaveBeenCalled();
    expect(captureOperationalWarningMock).toHaveBeenCalled();
    expect(finishPaymentWebhookEventProcessingMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "REJECTED" })
    );
  });

  test("rejects a notification for an unknown order", async () => {
    findPurchaseMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/redsys/notification/route");
    const response = await POST(buildNotificationRequest());

    expect(response.status).toBe(404);
    expect(grantCourseAccessMock).not.toHaveBeenCalled();
  });

  test("ignores a replayed notification without granting access twice", async () => {
    beginPaymentWebhookEventProcessingMock.mockResolvedValue({
      duplicate: true,
      exhausted: false,
      resumed: false,
      record: { status: "PROCESSED", attemptCount: 1 }
    });
    const { POST } = await import("@/app/api/redsys/notification/route");
    const response = await POST(buildNotificationRequest());

    expect(response.status).toBe(200);
    expect(findPurchaseMock).not.toHaveBeenCalled();
    expect(grantCourseAccessMock).not.toHaveBeenCalled();
  });

  test("returns 503 when Redsys is not configured", async () => {
    delete process.env.REDSYS_MERCHANT_CODE;
    delete process.env.REDSYS_SECRET_KEY;
    const { POST } = await import("@/app/api/redsys/notification/route");
    const response = await POST(buildNotificationRequest());

    expect(response.status).toBe(503);
    expect(grantCourseAccessMock).not.toHaveBeenCalled();
  });
});
