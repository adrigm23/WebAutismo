import { createCipheriv, createHmac, randomInt, timingSafeEqual } from "crypto";

// Redsys is the card gateway behind CaixaBank's TPV virtual. This module
// implements the "redirección" integration: the buyer is POSTed to the Redsys
// payment page and Redsys confirms the result server-to-server through the
// notification URL (the "notificación online").

const REDSYS_ENDPOINTS = {
  test: "https://sis-t.redsys.es:25443/sis/realizarPago",
  production: "https://sis.redsys.es/sis/realizarPago"
} as const;

export const REDSYS_SIGNATURE_VERSION = "HMAC_SHA256_V1";
export const REDSYS_CURRENCY_EUR = "978";
export const REDSYS_TRANSACTION_TYPE_AUTHORIZATION = "0";
const REDSYS_LANGUAGE_SPANISH = "001";
const REDSYS_PRODUCT_DESCRIPTION_MAX_LENGTH = 125;
const REDSYS_ORDER_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type RedsysEnvironment = keyof typeof REDSYS_ENDPOINTS;

export type RedsysRuntimeState =
  | {
      mode: "disabled";
      reason: "missing-configuration";
    }
  | {
      mode: "misconfigured";
      reason:
        | "missing-merchant-code"
        | "missing-secret-key"
        | "invalid-merchant-code"
        | "invalid-terminal"
        | "invalid-secret-key"
        | "invalid-environment";
      environment: string;
    }
  | {
      mode: "live";
      reason: null;
      environment: RedsysEnvironment;
      merchantCode: string;
      terminal: string;
      secretKey: string;
      endpoint: string;
      // Only meaningful in the test environment, see isRedsysCheckoutAllowedFor.
      testAllowedEmails: string[] | null;
    };

export type LiveRedsysConfig = Extract<RedsysRuntimeState, { mode: "live" }>;

function decodeSecretKey(secretKey: string) {
  const key = Buffer.from(secretKey, "base64");
  // The SHA-256 key Redsys hands out is a base64-encoded 3DES key (24 bytes).
  return key.length === 24 ? key : null;
}

export function getRedsysRuntimeState(): RedsysRuntimeState {
  const merchantCode = process.env.REDSYS_MERCHANT_CODE?.trim() ?? "";
  const secretKey = process.env.REDSYS_SECRET_KEY?.trim() ?? "";
  const terminal = process.env.REDSYS_TERMINAL?.trim() || "1";
  const environment = process.env.REDSYS_ENVIRONMENT?.trim().toLowerCase() || "test";

  if (!merchantCode && !secretKey) {
    return { mode: "disabled", reason: "missing-configuration" };
  }

  if (!merchantCode) {
    return { mode: "misconfigured", reason: "missing-merchant-code", environment };
  }

  if (!secretKey) {
    return { mode: "misconfigured", reason: "missing-secret-key", environment };
  }

  if (!/^\d{1,9}$/.test(merchantCode)) {
    return { mode: "misconfigured", reason: "invalid-merchant-code", environment };
  }

  if (!/^\d{1,3}$/.test(terminal)) {
    return { mode: "misconfigured", reason: "invalid-terminal", environment };
  }

  if (!decodeSecretKey(secretKey)) {
    return { mode: "misconfigured", reason: "invalid-secret-key", environment };
  }

  if (environment !== "test" && environment !== "production") {
    return { mode: "misconfigured", reason: "invalid-environment", environment };
  }

  const testAllowedEmails = (process.env.REDSYS_TEST_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return {
    mode: "live",
    reason: null,
    environment,
    merchantCode,
    terminal,
    secretKey,
    endpoint: REDSYS_ENDPOINTS[environment],
    testAllowedEmails: testAllowedEmails.length > 0 ? testAllowedEmails : null
  };
}

/**
 * The Redsys test environment accepts publicly documented test cards, so on a
 * public site anyone could "pay" with one and get a course for free. While
 * REDSYS_ENVIRONMENT=test, REDSYS_TEST_ALLOWED_EMAILS limits the checkout to
 * the listed accounts (the team's and the bank's validation account).
 */
export function isRedsysCheckoutAllowedFor(config: LiveRedsysConfig, email: string | null | undefined) {
  if (config.environment === "production" || !config.testAllowedEmails) {
    return true;
  }

  return Boolean(email) && config.testAllowedEmails.includes(email!.trim().toLowerCase());
}

/**
 * Redsys order numbers are 4-12 alphanumeric characters, the first 4 numeric,
 * and must never repeat for the merchant (a reused one is rejected as SIS0051).
 * Uniqueness is enforced by the unique index on Purchase.redsysOrder.
 */
export function generateRedsysOrderNumber() {
  let order = "";

  for (let index = 0; index < 4; index += 1) {
    order += String(randomInt(10));
  }

  for (let index = 0; index < 8; index += 1) {
    order += REDSYS_ORDER_ALPHABET[randomInt(REDSYS_ORDER_ALPHABET.length)];
  }

  return order;
}

function deriveOrderKey(secretKey: string, order: string) {
  const key = decodeSecretKey(secretKey);

  if (!key) {
    throw new Error("Redsys secret key is not a valid base64 3DES key.");
  }

  // 3DES-CBC with a zero IV over the order number, zero-padded to the block
  // size (Redsys does not use PKCS padding).
  const orderBytes = Buffer.from(order, "utf8");
  const padded = Buffer.alloc(Math.ceil(orderBytes.length / 8) * 8, 0);
  orderBytes.copy(padded);

  const cipher = createCipheriv("des-ede3-cbc", key, Buffer.alloc(8, 0));
  cipher.setAutoPadding(false);

  return Buffer.concat([cipher.update(padded), cipher.final()]);
}

export function computeRedsysSignature(input: {
  secretKey: string;
  order: string;
  merchantParameters: string;
}) {
  return createHmac("sha256", deriveOrderKey(input.secretKey, input.order))
    .update(input.merchantParameters)
    .digest("base64");
}

function toBase64Url(value: string) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Json(value: string): Record<string, unknown> | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const parsed: unknown = JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export type RedsysPaymentForm = {
  url: string;
  fields: {
    Ds_SignatureVersion: string;
    Ds_MerchantParameters: string;
    Ds_Signature: string;
  };
};

export function buildRedsysPaymentForm(input: {
  config: LiveRedsysConfig;
  order: string;
  amountInCents: number;
  productDescription: string;
  merchantData: string;
  notificationUrl: string;
  okUrl: string;
  koUrl: string;
}): RedsysPaymentForm {
  if (!Number.isInteger(input.amountInCents) || input.amountInCents <= 0) {
    throw new Error("Redsys payments need a positive integer amount in cents.");
  }

  const parameters = {
    DS_MERCHANT_AMOUNT: String(input.amountInCents),
    DS_MERCHANT_ORDER: input.order,
    DS_MERCHANT_MERCHANTCODE: input.config.merchantCode,
    DS_MERCHANT_CURRENCY: REDSYS_CURRENCY_EUR,
    DS_MERCHANT_TRANSACTIONTYPE: REDSYS_TRANSACTION_TYPE_AUTHORIZATION,
    DS_MERCHANT_TERMINAL: input.config.terminal,
    DS_MERCHANT_MERCHANTURL: input.notificationUrl,
    DS_MERCHANT_URLOK: input.okUrl,
    DS_MERCHANT_URLKO: input.koUrl,
    DS_MERCHANT_CONSUMERLANGUAGE: REDSYS_LANGUAGE_SPANISH,
    DS_MERCHANT_PRODUCTDESCRIPTION: input.productDescription.slice(
      0,
      REDSYS_PRODUCT_DESCRIPTION_MAX_LENGTH
    ),
    DS_MERCHANT_MERCHANTDATA: input.merchantData
  };
  const merchantParameters = Buffer.from(JSON.stringify(parameters), "utf8").toString("base64");

  return {
    url: input.config.endpoint,
    fields: {
      Ds_SignatureVersion: REDSYS_SIGNATURE_VERSION,
      Ds_MerchantParameters: merchantParameters,
      Ds_Signature: computeRedsysSignature({
        secretKey: input.config.secretKey,
        order: input.order,
        merchantParameters
      })
    }
  };
}

export type RedsysNotification = {
  order: string;
  amountInCents: number;
  currency: string;
  merchantCode: string;
  terminal: string;
  responseCode: number;
  transactionType: string;
  authorisationCode: string | null;
  merchantData: string | null;
};

export type RedsysNotificationParseResult =
  | { ok: true; notification: RedsysNotification }
  | {
      ok: false;
      reason: "unsupported-signature-version" | "malformed-parameters" | "invalid-signature";
    };

function readString(parameters: Record<string, unknown>, key: string) {
  // Redsys documents these keys as Ds_*, but some responses use DS_* casing.
  const value = parameters[key] ?? parameters[key.toUpperCase()];

  if (typeof value === "string") {
    return value.trim();
  }

  return typeof value === "number" ? String(value) : "";
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Verifies and decodes the server-to-server notification Redsys POSTs to the
 * notification URL. The signature is checked before any field is trusted.
 */
export function parseRedsysNotification(input: {
  secretKey: string;
  signatureVersion: string;
  merchantParameters: string;
  signature: string;
}): RedsysNotificationParseResult {
  if (input.signatureVersion !== REDSYS_SIGNATURE_VERSION) {
    return { ok: false, reason: "unsupported-signature-version" };
  }

  const parameters = decodeBase64Json(input.merchantParameters);
  const order = parameters ? readString(parameters, "Ds_Order") : "";

  if (!parameters || !order) {
    return { ok: false, reason: "malformed-parameters" };
  }

  // The notification signature comes base64url-encoded and is computed over
  // the Ds_MerchantParameters string exactly as received.
  const expected = Buffer.from(
    toBase64Url(
      computeRedsysSignature({
        secretKey: input.secretKey,
        order,
        merchantParameters: input.merchantParameters
      })
    )
  );
  const received = Buffer.from(toBase64Url(input.signature.trim()));

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return { ok: false, reason: "invalid-signature" };
  }

  const amountText = readString(parameters, "Ds_Amount");
  const responseText = readString(parameters, "Ds_Response");

  if (!/^\d+$/.test(amountText) || !/^\d+$/.test(responseText)) {
    return { ok: false, reason: "malformed-parameters" };
  }

  const merchantData = readString(parameters, "Ds_MerchantData");
  const authorisationCode = readString(parameters, "Ds_AuthorisationCode");

  return {
    ok: true,
    notification: {
      order,
      amountInCents: Number(amountText),
      currency: readString(parameters, "Ds_Currency"),
      merchantCode: readString(parameters, "Ds_MerchantCode"),
      terminal: readString(parameters, "Ds_Terminal"),
      responseCode: Number(responseText),
      transactionType: readString(parameters, "Ds_TransactionType"),
      authorisationCode: authorisationCode || null,
      merchantData: merchantData ? safeDecodeURIComponent(merchantData) : null
    }
  };
}

/** Ds_Response 0000-0099 means the card payment was authorised. */
export function isRedsysResponseAuthorized(responseCode: number) {
  return responseCode >= 0 && responseCode <= 99;
}

export function isSameRedsysTerminal(left: string, right: string) {
  return /^\d+$/.test(left) && /^\d+$/.test(right) && Number(left) === Number(right);
}
