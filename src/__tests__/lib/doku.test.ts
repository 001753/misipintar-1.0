// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import {
  DOKU_CHECKOUT_PAYMENT_METHODS,
  generateDokuSignature,
  resolveDokuPaymentMethod,
  sha256Base64,
  validateDokuNotificationSignature,
  validateDokuNotificationTimestamp,
} from "@/lib/doku";

const originalEnv = {
  clientId: process.env.DOKU_CLIENT_ID,
  secretKey: process.env.DOKU_SECRET_KEY,
};

afterEach(() => {
  if (originalEnv.clientId === undefined) delete process.env.DOKU_CLIENT_ID;
  else process.env.DOKU_CLIENT_ID = originalEnv.clientId;
  if (originalEnv.secretKey === undefined) delete process.env.DOKU_SECRET_KEY;
  else process.env.DOKU_SECRET_KEY = originalEnv.secretKey;
});

describe("DOKU payment helper", () => {
  it("menghasilkan digest dan signature HMAC-SHA256 yang dapat diverifikasi", () => {
    const body = JSON.stringify({ order: { invoice_number: "DOKU-TEST-001", amount: 29000 } });
    const params = {
      clientId: "MCH-TEST",
      requestId: "request-test-001",
      requestTimestamp: "2026-07-23T06:00:00Z",
      requestTarget: "/api/webhooks/doku",
      digest: sha256Base64(body),
      secretKey: "secret-test",
    };
    const signature = generateDokuSignature(params);

    process.env.DOKU_CLIENT_ID = params.clientId;
    process.env.DOKU_SECRET_KEY = params.secretKey;
    expect(
      validateDokuNotificationSignature({
        body,
        clientId: params.clientId,
        requestId: params.requestId,
        requestTimestamp: params.requestTimestamp,
        signature,
        requestTarget: params.requestTarget,
      })
    ).toBe(true);
    expect(
      validateDokuNotificationSignature({
        body: `${body} `,
        clientId: params.clientId,
        requestId: params.requestId,
        requestTimestamp: params.requestTimestamp,
        signature,
        requestTarget: params.requestTarget,
      })
    ).toBe(false);
  });

  it("tidak mengaktifkan QRIS sebagai metode Checkout", () => {
    expect(DOKU_CHECKOUT_PAYMENT_METHODS).not.toContain("QRIS");
    expect(resolveDokuPaymentMethod({ channel: { id: "VIRTUAL_ACCOUNT_BANK_MANDIRI" } })).toBe(
      "MANDIRI_VA"
    );
    expect(resolveDokuPaymentMethod({ channel: { id: "CREDIT_CARD" } })).toBe(
      "CREDIT_CARD"
    );
    expect(resolveDokuPaymentMethod({ channel: { id: "EMONEY_DANA" } })).toBe("EWALLET");
  });

  it("menolak notification DOKU di luar jendela waktu replay", () => {
    const now = new Date("2026-07-24T02:00:00.000Z");

    expect(
      validateDokuNotificationTimestamp("2026-07-24T01:55:00.000Z", now)
    ).toBe(true);
    expect(
      validateDokuNotificationTimestamp("2026-07-24T01:40:00.000Z", now)
    ).toBe(false);
    expect(
      validateDokuNotificationTimestamp("2026-07-24T02:15:00.000Z", now)
    ).toBe(false);
    expect(validateDokuNotificationTimestamp("not-a-date", now)).toBe(false);
  });
});
