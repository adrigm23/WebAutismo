import {
  buildRedsysPaymentForm,
  computeRedsysSignature,
  generateRedsysOrderNumber,
  getRedsysRuntimeState,
  isRedsysCheckoutAllowedFor,
  parseRedsysNotification,
  type LiveRedsysConfig
} from "@/lib/redsys";
import { validateRedsysNotificationAgainstPurchase } from "@/lib/purchases";

// Public test credentials published by Redsys for its sis-t sandbox.
const TEST_SECRET_KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
const TEST_MERCHANT_CODE = "999008881";

const liveConfig: LiveRedsysConfig = {
  mode: "live",
  reason: null,
  environment: "test",
  merchantCode: TEST_MERCHANT_CODE,
  terminal: "1",
  secretKey: TEST_SECRET_KEY,
  endpoint: "https://sis-t.redsys.es:25443/sis/realizarPago",
  testAllowedEmails: null
};

function encodeParameters(parameters: Record<string, string>) {
  return Buffer.from(JSON.stringify(parameters), "utf8").toString("base64");
}

function signNotification(parameters: Record<string, string>) {
  const merchantParameters = encodeParameters(parameters);
  const signature = computeRedsysSignature({
    secretKey: TEST_SECRET_KEY,
    order: parameters.Ds_Order,
    merchantParameters
  })
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return { merchantParameters, signature };
}

const authorisedNotification = {
  Ds_Date: "09%2F10%2F2026",
  Ds_Hour: "12:00",
  Ds_Amount: "9680",
  Ds_Currency: "978",
  Ds_Order: "1234ABCDEFGH",
  Ds_MerchantCode: TEST_MERCHANT_CODE,
  Ds_Terminal: "001",
  Ds_Response: "0000",
  Ds_TransactionType: "0",
  Ds_SecurePayment: "1",
  Ds_AuthorisationCode: "123456",
  Ds_MerchantData: "purchase-1"
};

describe("redsys", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  test("matches the signature OpenSSL computes for the same key, order and parameters", () => {
    // Reference value produced with `openssl enc -des-ede3-cbc -nopad` +
    // `openssl dgst -sha256 -mac HMAC` over the same inputs.
    const merchantParameters = encodeParameters({
      DS_MERCHANT_AMOUNT: "14500",
      DS_MERCHANT_ORDER: "1234ABCDEFGH"
    });

    expect(
      computeRedsysSignature({
        secretKey: TEST_SECRET_KEY,
        order: "1234ABCDEFGH",
        merchantParameters
      })
    ).toBe("Oxwa7VgQeFhYlhaEK3olQP9SJP44SarkPSHdrGHchcY=");
  });

  test("generates order numbers Redsys accepts", () => {
    for (let index = 0; index < 200; index += 1) {
      expect(generateRedsysOrderNumber()).toMatch(/^\d{4}[0-9A-Z]{8}$/);
    }
  });

  test("builds a signed payment form with the purchase amount in cents", () => {
    const form = buildRedsysPaymentForm({
      config: liveConfig,
      order: "1234ABCDEFGH",
      amountInCents: 9680,
      productDescription: "Curso de prueba",
      merchantData: "purchase-1",
      notificationUrl: "https://campus.example.com/api/redsys/notification",
      okUrl: "https://campus.example.com/checkout/exito?course=curso",
      koUrl: "https://campus.example.com/checkout/curso?pago=cancelado"
    });
    const parameters = JSON.parse(
      Buffer.from(form.fields.Ds_MerchantParameters, "base64").toString("utf8")
    );

    expect(form.url).toBe(liveConfig.endpoint);
    expect(form.fields.Ds_SignatureVersion).toBe("HMAC_SHA256_V1");
    expect(parameters).toMatchObject({
      DS_MERCHANT_AMOUNT: "9680",
      DS_MERCHANT_ORDER: "1234ABCDEFGH",
      DS_MERCHANT_MERCHANTCODE: TEST_MERCHANT_CODE,
      DS_MERCHANT_CURRENCY: "978",
      DS_MERCHANT_TRANSACTIONTYPE: "0",
      DS_MERCHANT_TERMINAL: "1",
      DS_MERCHANT_MERCHANTURL: "https://campus.example.com/api/redsys/notification"
    });
    expect(form.fields.Ds_Signature).toBe(
      computeRedsysSignature({
        secretKey: TEST_SECRET_KEY,
        order: "1234ABCDEFGH",
        merchantParameters: form.fields.Ds_MerchantParameters
      })
    );
  });

  test("refuses to build a form for a non-positive amount", () => {
    expect(() =>
      buildRedsysPaymentForm({
        config: liveConfig,
        order: "1234ABCDEFGH",
        amountInCents: 0,
        productDescription: "Curso",
        merchantData: "purchase-1",
        notificationUrl: "https://campus.example.com/api/redsys/notification",
        okUrl: "https://campus.example.com/ok",
        koUrl: "https://campus.example.com/ko"
      })
    ).toThrow();
  });

  test("parses a correctly signed notification", () => {
    const { merchantParameters, signature } = signNotification(authorisedNotification);
    const result = parseRedsysNotification({
      secretKey: TEST_SECRET_KEY,
      signatureVersion: "HMAC_SHA256_V1",
      merchantParameters,
      signature
    });

    expect(result).toEqual({
      ok: true,
      notification: {
        order: "1234ABCDEFGH",
        amountInCents: 9680,
        currency: "978",
        merchantCode: TEST_MERCHANT_CODE,
        terminal: "001",
        responseCode: 0,
        transactionType: "0",
        authorisationCode: "123456",
        merchantData: "purchase-1"
      }
    });
  });

  test("rejects a notification whose parameters were tampered with", () => {
    const { signature } = signNotification(authorisedNotification);
    const tampered = encodeParameters({ ...authorisedNotification, Ds_Amount: "1" });

    expect(
      parseRedsysNotification({
        secretKey: TEST_SECRET_KEY,
        signatureVersion: "HMAC_SHA256_V1",
        merchantParameters: tampered,
        signature
      })
    ).toEqual({ ok: false, reason: "invalid-signature" });
  });

  test("rejects a notification signed with another key", () => {
    const { merchantParameters } = signNotification(authorisedNotification);
    const foreignSignature = computeRedsysSignature({
      secretKey: Buffer.alloc(24, 7).toString("base64"),
      order: authorisedNotification.Ds_Order,
      merchantParameters
    });

    expect(
      parseRedsysNotification({
        secretKey: TEST_SECRET_KEY,
        signatureVersion: "HMAC_SHA256_V1",
        merchantParameters,
        signature: foreignSignature
      })
    ).toEqual({ ok: false, reason: "invalid-signature" });
  });

  test("rejects malformed parameters and unknown signature versions", () => {
    expect(
      parseRedsysNotification({
        secretKey: TEST_SECRET_KEY,
        signatureVersion: "HMAC_SHA256_V1",
        merchantParameters: "not-base64-json",
        signature: "x"
      })
    ).toEqual({ ok: false, reason: "malformed-parameters" });

    expect(
      parseRedsysNotification({
        secretKey: TEST_SECRET_KEY,
        signatureVersion: "HMAC_SHA512_V2",
        merchantParameters: "",
        signature: ""
      })
    ).toEqual({ ok: false, reason: "unsupported-signature-version" });
  });

  test("resolves the runtime state from the environment", () => {
    process.env = { ...originalEnv };
    delete process.env.REDSYS_MERCHANT_CODE;
    delete process.env.REDSYS_SECRET_KEY;
    delete process.env.REDSYS_TERMINAL;
    delete process.env.REDSYS_ENVIRONMENT;
    expect(getRedsysRuntimeState().mode).toBe("disabled");

    process.env.REDSYS_MERCHANT_CODE = TEST_MERCHANT_CODE;
    expect(getRedsysRuntimeState()).toMatchObject({
      mode: "misconfigured",
      reason: "missing-secret-key"
    });

    process.env.REDSYS_SECRET_KEY = "too-short";
    expect(getRedsysRuntimeState()).toMatchObject({
      mode: "misconfigured",
      reason: "invalid-secret-key"
    });

    process.env.REDSYS_SECRET_KEY = TEST_SECRET_KEY;
    expect(getRedsysRuntimeState()).toMatchObject({
      mode: "live",
      environment: "test",
      terminal: "1",
      endpoint: "https://sis-t.redsys.es:25443/sis/realizarPago"
    });

    process.env.REDSYS_ENVIRONMENT = "production";
    expect(getRedsysRuntimeState()).toMatchObject({
      mode: "live",
      endpoint: "https://sis.redsys.es/sis/realizarPago"
    });

    process.env.REDSYS_ENVIRONMENT = "staging";
    expect(getRedsysRuntimeState()).toMatchObject({
      mode: "misconfigured",
      reason: "invalid-environment"
    });
  });

  test("limits the test environment checkout to the allowed accounts", () => {
    const restricted: LiveRedsysConfig = {
      ...liveConfig,
      testAllowedEmails: ["equipo@autismocordoba.org", "banco@example.com"]
    };

    expect(isRedsysCheckoutAllowedFor(restricted, "Equipo@AutismoCordoba.org ")).toBe(true);
    expect(isRedsysCheckoutAllowedFor(restricted, "banco@example.com")).toBe(true);
    expect(isRedsysCheckoutAllowedFor(restricted, "visitante@example.com")).toBe(false);
    expect(isRedsysCheckoutAllowedFor(restricted, null)).toBe(false);

    // Without a list, and always in production, everyone can pay.
    expect(isRedsysCheckoutAllowedFor(liveConfig, "visitante@example.com")).toBe(true);
    expect(
      isRedsysCheckoutAllowedFor({ ...restricted, environment: "production" }, "visitante@example.com")
    ).toBe(true);
  });

  test("reads the allowed accounts from the environment", () => {
    process.env = {
      ...originalEnv,
      REDSYS_MERCHANT_CODE: TEST_MERCHANT_CODE,
      REDSYS_SECRET_KEY: TEST_SECRET_KEY,
      REDSYS_ENVIRONMENT: "test",
      REDSYS_TEST_ALLOWED_EMAILS: " Equipo@AutismoCordoba.org , banco@example.com ,"
    };

    expect(getRedsysRuntimeState()).toMatchObject({
      mode: "live",
      testAllowedEmails: ["equipo@autismocordoba.org", "banco@example.com"]
    });

    process.env.REDSYS_TEST_ALLOWED_EMAILS = "";
    expect(getRedsysRuntimeState()).toMatchObject({ mode: "live", testAllowedEmails: null });
  });

  describe("validateRedsysNotificationAgainstPurchase", () => {
    const purchase = { totalInCents: 9680, redsysOrder: "1234ABCDEFGH" };
    const notification = {
      order: "1234ABCDEFGH",
      amountInCents: 9680,
      currency: "978",
      merchantCode: TEST_MERCHANT_CODE,
      terminal: "001",
      responseCode: 0,
      transactionType: "0",
      authorisationCode: "123456",
      merchantData: "purchase-1"
    };

    test("accepts an authorised notification for the stored purchase", () => {
      expect(
        validateRedsysNotificationAgainstPurchase({ purchase, notification, config: liveConfig })
      ).toEqual({ ok: true });
    });

    test.each([
      ["a denied payment", { responseCode: 190 }],
      ["a different amount", { amountInCents: 100 }],
      ["a different currency", { currency: "840" }],
      ["another merchant", { merchantCode: "111111111" }],
      ["another terminal", { terminal: "2" }],
      ["a refund", { transactionType: "3" }],
      ["another order", { order: "9999ZZZZZZZZ" }]
    ])("rejects %s", (_, override) => {
      expect(
        validateRedsysNotificationAgainstPurchase({
          purchase,
          notification: { ...notification, ...override },
          config: liveConfig
        }).ok
      ).toBe(false);
    });
  });
});
