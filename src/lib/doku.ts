import crypto from "node:crypto";

const DOKU_CHECKOUT_PATH = "/checkout/v1/payment";

export const DOKU_CHECKOUT_PAYMENT_METHODS = [
  // Mandiri VA yang diminta merchant.
  "VIRTUAL_ACCOUNT_BANK_MANDIRI",
  // Kartu kredit.
  "CREDIT_CARD",
  // E-wallet yang tersedia pada DOKU Checkout.
  // EMONEY_DOKU (DOKU Wallet) dihilangkan — butuh aktivasi merchant terpisah
  // dan menyebabkan HTTP 400 di sandbox jika belum diaktifkan.
  "EMONEY_OVO",
  "EMONEY_SHOPEE_PAY",
  "EMONEY_DANA",
  "EMONEY_LINKAJA",
] as const;

export type DokuPaymentMethod = (typeof DOKU_CHECKOUT_PAYMENT_METHODS)[number];

export function getDokuCheckoutUrl(): string {
  return process.env.DOKU_IS_PRODUCTION === "true"
    ? "https://api.doku.com/checkout/v1/payment"
    : "https://api-sandbox.doku.com/checkout/v1/payment";
}

export function getDokuPublicBaseUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:5000"
  ).replace(/\/$/, "");
}

export function sha256Base64(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("base64");
}

export function generateDokuSignature(params: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  digest: string;
  secretKey: string;
}): string {
  const component = [
    `Client-Id:${params.clientId}`,
    `Request-Id:${params.requestId}`,
    `Request-Timestamp:${params.requestTimestamp}`,
    `Request-Target:${params.requestTarget}`,
    `Digest:${params.digest}`,
  ].join("\n");

  const signature = crypto
    .createHmac("sha256", params.secretKey)
    .update(component, "utf8")
    .digest("base64");

  return `HMACSHA256=${signature}`;
}

export function buildDokuRequestHeaders(params: {
  body: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget?: string;
}): Record<string, string> {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secretKey = process.env.DOKU_SECRET_KEY;
  if (!clientId || !secretKey) {
    throw new Error("DOKU_CLIENT_ID dan DOKU_SECRET_KEY wajib dikonfigurasi.");
  }

  const requestTarget = params.requestTarget ?? DOKU_CHECKOUT_PATH;
  const digest = sha256Base64(params.body);

  return {
    "Content-Type": "application/json",
    "Client-Id": clientId,
    "Request-Id": params.requestId,
    "Request-Timestamp": params.requestTimestamp,
    Signature: generateDokuSignature({
      clientId,
      requestId: params.requestId,
      requestTimestamp: params.requestTimestamp,
      requestTarget,
      digest,
      secretKey,
    }),
  };
}

export function validateDokuNotificationSignature(params: {
  body: string;
  clientId: string | null;
  requestId: string | null;
  requestTimestamp: string | null;
  signature: string | null;
  requestTarget: string;
}): boolean {
  const expectedClientId = process.env.DOKU_CLIENT_ID;
  const secretKey = process.env.DOKU_SECRET_KEY;
  if (
    !expectedClientId ||
    !secretKey ||
    !params.clientId ||
    !params.requestId ||
    !params.requestTimestamp ||
    !params.signature ||
    params.clientId !== expectedClientId
  ) {
    return false;
  }

  const expected = generateDokuSignature({
    clientId: params.clientId,
    requestId: params.requestId,
    requestTimestamp: params.requestTimestamp,
    requestTarget: params.requestTarget,
    digest: sha256Base64(params.body),
    secretKey,
  });

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(params.signature);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

/**
 * DOKU signs the notification timestamp, but a valid signature alone does
 * not prevent an old signed notification from being replayed. Keep the
 * acceptance window deliberately small; DOKU retries should arrive well
 * within this window and are separately de-duplicated by Request-Id.
 */
export function validateDokuNotificationTimestamp(
  value: string | null,
  now = new Date(),
  maxSkewSeconds = 10 * 60
): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;

  const skewSeconds = Math.abs(now.getTime() - timestamp) / 1000;
  return skewSeconds <= maxSkewSeconds;
}

export function extractDokuPaymentUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const candidates: unknown[] = [
    (payload as { payment?: { url?: unknown } }).payment?.url,
    (payload as { response?: { payment?: { url?: unknown } } }).response?.payment?.url,
    (payload as { payment_url?: unknown }).payment_url,
    (payload as { paymentUrl?: unknown }).paymentUrl,
  ];

  return candidates.find(
    (value): value is string =>
      typeof value === "string" && /^https?:\/\//i.test(value)
  ) ?? null;
}

export function extractDokuInvoiceNumber(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const value =
    (payload as { order?: { invoice_number?: unknown; invoiceNumber?: unknown } }).order
      ?.invoice_number ??
    (payload as { order?: { invoiceNumber?: unknown } }).order?.invoiceNumber ??
    (payload as { invoice_number?: unknown }).invoice_number;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function extractDokuAmount(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const orderAmount = (payload as { order?: { amount?: unknown } }).order?.amount;
  const nestedOrderAmount =
    orderAmount && typeof orderAmount === "object" && "value" in orderAmount
      ? (orderAmount as { value?: unknown }).value
      : undefined;
  const paidAmount = (payload as { paidAmount?: { value?: unknown } }).paidAmount?.value;
  for (const value of [orderAmount, nestedOrderAmount, paidAmount]) {
    if (value && typeof value === "object") continue;
    const amount = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(amount)) return Math.round(amount);
  }
  return null;
}

export function extractDokuTransactionStatus(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const value =
    (payload as { transaction?: { status?: unknown } }).transaction?.status ??
    (payload as { order?: { status?: unknown } }).order?.status ??
    (payload as { status?: unknown }).status;
  return typeof value === "string" ? value.toUpperCase() : null;
}

export function resolveDokuPaymentMethod(
  payload: unknown
): "MANDIRI_VA" | "CREDIT_CARD" | "EWALLET" | "BANK_TRANSFER" {
  const source = JSON.stringify(payload).toUpperCase();
  if (source.includes("CREDIT_CARD") || source.includes("CREDIT CARD")) return "CREDIT_CARD";
  if (source.includes("EMONEY_") || source.includes("E-WALLET") || source.includes("EWALLET")) return "EWALLET";
  if (source.includes("VIRTUAL_ACCOUNT_BANK_MANDIRI") || source.includes("MANDIRI")) return "MANDIRI_VA";
  if (source.includes("VIRTUAL_ACCOUNT")) return "BANK_TRANSFER";
  return "BANK_TRANSFER";
}

export { DOKU_CHECKOUT_PATH };